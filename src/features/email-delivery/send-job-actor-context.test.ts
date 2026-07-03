import { describe, expect, it, vi } from "vitest";
import { hasSendJobPermission } from "./send-job-authorization";
import {
  resolveTrustedSendJobActorContext,
  SendJobActorContextError
} from "./send-job-actor-context";

const productionEnv = {
  NODE_ENV: "production",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-test-key",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-test-key",
  SUPABASE_URL: "https://db.example"
};

function jsonResponse(body: unknown, ok = true): Response {
  return {
    json: async () => body,
    ok
  } as Response;
}

function mockFetch(...responses: Response[]): typeof fetch & { mock: ReturnType<typeof vi.fn>["mock"] } {
  const fn = vi.fn(async () => {
    const response = responses.shift();
    return response ?? jsonResponse(null, false);
  });
  return fn as unknown as typeof fetch & { mock: ReturnType<typeof vi.fn>["mock"] };
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

  it("rejects production requests without a bearer session", async () => {
    await expect(
      resolveTrustedSendJobActorContext(new Request("http://localhost/api/outreach/send-jobs"), productionEnv)
    ).rejects.toMatchObject({
      code: "authentication_required"
    } satisfies Partial<SendJobActorContextError>);
  });

  it("validates production bearer sessions and ignores spoofed actor headers", async () => {
    const fetcher = mockFetch(
      jsonResponse({ id: "auth_user_1" }),
      jsonResponse(
        [
          {
            permissions: ["send_job:view"],
            role: "viewer",
            status: "active",
            tenant_id: "tenant_from_membership"
          }
        ]
      )
    );

    const actor = await resolveTrustedSendJobActorContext(
      new Request("http://localhost/api/outreach/send-jobs", {
        headers: {
          authorization: "Bearer access-token",
          "x-forgeos-actor-id": "spoofed_user",
          "x-forgeos-roles": "super_admin",
          "x-forgeos-tenant-id": "spoofed_tenant"
        }
      }),
      productionEnv,
      fetcher
    );

    expect(actor).toMatchObject({
      permissions: ["send_job:view"],
      roles: ["viewer"],
      source: "production_session",
      tenantId: "tenant_from_membership",
      userId: "auth_user_1"
    });
    expect(hasSendJobPermission(actor, "send_job:view")).toBe(true);
    expect(hasSendJobPermission(actor, "send_job:queue")).toBe(false);
    expect(String(fetcher.mock.calls[1][0])).toContain("status=eq.active");
  });

  it("rejects disabled production memberships", async () => {
    const fetcher = mockFetch(
      jsonResponse({ id: "auth_user_1" }),
      jsonResponse(
        [
          {
            permissions: ["send_job:queue"],
            role: "marketing_manager",
            status: "disabled",
            tenant_id: "tenant_disabled"
          }
        ]
      )
    );

    await expect(
      resolveTrustedSendJobActorContext(
        new Request("http://localhost/api/outreach/send-jobs", {
          headers: { authorization: "Bearer access-token" }
        }),
        productionEnv,
        fetcher
      )
    ).rejects.toMatchObject({
      code: "tenant_membership_required"
    } satisfies Partial<SendJobActorContextError>);
  });

  it("fails closed instead of guessing when a user has multiple active memberships", async () => {
    const fetcher = mockFetch(
      jsonResponse({ id: "auth_user_1" }),
      jsonResponse(
        [
          { permissions: [], role: "marketing_manager", status: "active", tenant_id: "tenant_a" },
          { permissions: [], role: "marketing_manager", status: "active", tenant_id: "tenant_b" }
        ]
      )
    );

    await expect(
      resolveTrustedSendJobActorContext(
        new Request("http://localhost/api/outreach/send-jobs", {
          headers: { authorization: "Bearer access-token" }
        }),
        productionEnv,
        fetcher
      )
    ).rejects.toMatchObject({
      code: "tenant_selection_required"
    } satisfies Partial<SendJobActorContextError>);
  });
});
