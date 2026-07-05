import { describe, expect, it, vi } from "vitest";
import { ForgeOSAuthError, type ForgeOSSession } from "@/lib/auth/types";
import type { TenantMembershipRecord } from "@/lib/supabase/tenant";
import { hasSendJobPermission } from "./send-job-authorization";
import {
  resolveTrustedSendJobActorContext,
  resolveTrustedSendJobTenantMemberships,
  SendJobActorContextError
} from "./send-job-actor-context";

const productionEnv = {
  NODE_ENV: "production"
};

function session(
  overrides: Partial<ForgeOSSession> = {}
): ForgeOSSession {
  return {
    roles: ["viewer"],
    source: "supabase",
    tenantId: "tenant_from_membership",
    userId: "auth_user_1",
    ...overrides
  };
}

function membership(
  overrides: Partial<TenantMembershipRecord> = {}
): TenantMembershipRecord {
  return {
    createdAt: "2026-07-04T00:00:00.000Z",
    id: "membership_1",
    permissions: [],
    role: "viewer",
    status: "active",
    tenantId: "tenant_from_membership",
    tenantKey: "tenant_from_membership",
    tenantName: "Tenant from membership",
    tenantSlug: "tenant-from-membership",
    updatedAt: "2026-07-04T00:00:00.000Z",
    ...overrides
  };
}

describe("send job actor context", () => {
  it("keeps trusted actor headers behind the non-production guard", async () => {
    const actor = await resolveTrustedSendJobActorContext(
      new Request("http://localhost/api/outreach/send-jobs", {
        headers: {
          "x-forgeos-actor-id": "user_dev",
          "x-forgeos-roles": "marketing_manager",
          "x-forgeos-tenant-id": "tenant_dev"
        }
      }),
      { NODE_ENV: "test" }
    );

    expect(actor).toMatchObject({
      permissions: [],
      roles: ["marketing_manager"],
      source: "development_headers",
      tenantId: "tenant_dev",
      userId: "user_dev"
    });
  });

  it("allows synthetic E2E actor env only when test auth is enabled", async () => {
    const actor = await resolveTrustedSendJobActorContext(
      new Request("http://localhost/api/outreach/send-jobs"),
      {
        FORGEOS_TEST_AUTH_ENABLED: "true",
        FORGEOS_TEST_ROLES: "marketing_manager,outreach_operator",
        FORGEOS_TEST_TENANT_ID: "tenant_e2e",
        FORGEOS_TEST_USER_ID: "user_e2e",
        NODE_ENV: "test"
      }
    );

    expect(actor).toMatchObject({
      roles: ["marketing_manager", "outreach_operator"],
      source: "development_headers",
      tenantId: "tenant_e2e",
      userId: "user_e2e"
    });
  });

  it("rejects production requests without a cookie-backed session", async () => {
    await expect(
      resolveTrustedSendJobActorContext(new Request("http://localhost/api/outreach/send-jobs"), productionEnv, {
        resolveSession: async () => {
          throw new ForgeOSAuthError("unauthenticated", "Authentication required.", 401);
        }
      })
    ).rejects.toMatchObject({
      code: "authentication_required"
    } satisfies Partial<SendJobActorContextError>);
  });

  it("uses production cookie sessions and ignores spoofed actor headers", async () => {
    const listMemberships = vi.fn(async () => [
      membership({ permissions: ["send_job:view"], role: "viewer", tenantId: "tenant_from_membership" })
    ]);

    const actor = await resolveTrustedSendJobActorContext(
      new Request("http://localhost/api/outreach/send-jobs", {
        headers: {
          "x-forgeos-actor-id": "spoofed_user",
          "x-forgeos-roles": "super_admin",
          "x-forgeos-tenant-id": "spoofed_tenant"
        }
      }),
      productionEnv,
      {
        listMemberships,
        resolveSession: async () => session()
      }
    );

    expect(actor).toMatchObject({
      permissions: ["send_job:view"],
      roles: ["viewer"],
      source: "production_session",
      tenantId: "tenant_from_membership",
      userId: "auth_user_1"
    });
    expect(hasSendJobPermission(actor, "send_job:view")).toBe(true);
    expect(hasSendJobPermission(actor, "send_job:prepare")).toBe(false);
    expect(hasSendJobPermission(actor, "send_job:queue")).toBe(false);
    expect(listMemberships).toHaveBeenCalledWith("auth_user_1");
  });

  it("rejects disabled production memberships", async () => {
    await expect(
      resolveTrustedSendJobActorContext(
        new Request("http://localhost/api/outreach/send-jobs"),
        productionEnv,
        {
          listMemberships: async () => [
            membership({ permissions: ["send_job:queue"], role: "marketing_manager", status: "disabled" })
          ],
          resolveSession: async () => session()
        }
      )
    ).rejects.toMatchObject({
      code: "tenant_membership_required"
    } satisfies Partial<SendJobActorContextError>);
  });

  it("fails closed instead of guessing when a user has multiple active memberships", async () => {
    await expect(
      resolveTrustedSendJobActorContext(
        new Request("http://localhost/api/outreach/send-jobs"),
        productionEnv,
        {
          listMemberships: async () => [
            membership({ role: "marketing_manager", tenantId: "tenant_a" }),
            membership({ role: "marketing_manager", tenantId: "tenant_b" })
          ],
          resolveSession: async () => session({ tenantId: "tenant_a" })
        }
      )
    ).rejects.toMatchObject({
      code: "tenant_selection_required"
    } satisfies Partial<SendJobActorContextError>);
  });

  it("allows configured stable tenant selection without a client tenant selector", async () => {
    const actor = await resolveTrustedSendJobActorContext(
      new Request("http://localhost/api/outreach/send-jobs"),
      { ...productionEnv, FORGEOS_ACTIVE_TENANT_KEY: "jh-gomes" },
      {
        listMemberships: async () => [
          membership({ role: "marketing_manager", tenantId: "tenant_a" }),
          membership({ role: "viewer", tenantId: "tenant_b" })
        ],
        resolveSession: async () => session({ tenantId: "tenant_a" })
      }
    );

    expect(actor.tenantId).toBe("tenant_a");
    expect(actor.roles).toEqual(["marketing_manager"]);
  });

  it("selects a requested production tenant only when the membership is active", async () => {
    const actor = await resolveTrustedSendJobActorContext(
      new Request("http://localhost/api/outreach/send-jobs", {
        headers: {
          "x-forgeos-selected-tenant-id": "tenant_b",
          "x-forgeos-tenant-id": "tenant_spoofed"
        }
      }),
      productionEnv,
      {
        listMemberships: async () => [
          membership({ permissions: ["send_job:prepare"], role: "marketing_manager", tenantId: "tenant_a" }),
          membership({ role: "viewer", tenantId: "tenant_b" })
        ],
        resolveSession: async () => session({ tenantId: "tenant_a" })
      }
    );

    expect(actor).toMatchObject({
      roles: ["viewer"],
      source: "production_session",
      tenantId: "tenant_b",
      userId: "auth_user_1"
    });
  });

  it("rejects selected tenants outside the authenticated membership set", async () => {
    await expect(
      resolveTrustedSendJobActorContext(
        new Request("http://localhost/api/outreach/send-jobs", {
          headers: {
            "x-forgeos-selected-tenant-id": "tenant_attacker"
          }
        }),
        productionEnv,
        {
          listMemberships: async () => [
            membership({ role: "marketing_manager", tenantId: "tenant_a" }),
            membership({ role: "viewer", tenantId: "tenant_b" })
          ],
          resolveSession: async () => session({ tenantId: "tenant_a" })
        }
      )
    ).rejects.toMatchObject({
      code: "tenant_membership_required"
    } satisfies Partial<SendJobActorContextError>);
  });

  it("returns only server-derived active memberships for tenant selection", async () => {
    const result = await resolveTrustedSendJobTenantMemberships(
      new Request("http://localhost/api/outreach/send-jobs", {
        headers: {
          "x-forgeos-actor-id": "spoofed_user",
          "x-forgeos-tenant-id": "tenant_spoofed"
        }
      }),
      productionEnv,
      {
        listMemberships: async () => [
          membership({ permissions: ["send_job:prepare"], role: "marketing_manager", tenantId: "tenant_a" }),
          membership({ role: "viewer", status: "disabled", tenantId: "tenant_disabled" }),
          membership({ role: "viewer", tenantId: "tenant_b" })
        ],
        resolveSession: async () => session({ tenantId: "tenant_a" })
      }
    );

    expect(result.memberships.map((item) => item.tenantId)).toEqual(["tenant_a", "tenant_b"]);
    expect(result.userId).toBe("auth_user_1");
  });
});
