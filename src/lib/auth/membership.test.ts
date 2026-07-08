import { describe, expect, it } from "vitest";
import {
  getForgeOSPersistenceMode,
  membershipAccessPath,
  resolveMembershipAccessForUser
} from "./membership";
import type { TenantMembershipRecord } from "@/lib/supabase/tenant";

const user = { id: "auth-user-1" };
const service = {} as never;

function membership(overrides: Partial<TenantMembershipRecord> = {}): TenantMembershipRecord {
  return {
    createdAt: "2026-07-04T00:00:00.000Z",
    id: "membership-1",
    permissions: [],
    role: "viewer",
    status: "active",
    tenantId: "tenant-a",
    tenantKey: "tenant_a",
    tenantName: "Tenant A",
    tenantSlug: "tenant-a",
    updatedAt: "2026-07-04T00:00:00.000Z",
    ...overrides
  };
}

describe("membership access resolution", () => {
  it("distinguishes local and Supabase persistence modes", () => {
    expect(getForgeOSPersistenceMode({ FORGEOS_PERSISTENCE_MODE: "supabase" })).toBe("supabase");
    expect(getForgeOSPersistenceMode({ FORGEOS_PERSISTENCE_MODE: "local" })).toBe("local");
  });

  it("accepts exactly one active membership", async () => {
    const access = await resolveMembershipAccessForUser(user, null, {
      createServiceClient: () => service,
      listMemberships: async () => [membership()],
      randomUUID: () => "correlation-1"
    });

    expect(access.status).toBe("active");
    if (access.status === "active") {
      expect(access.context.tenantId).toBe("tenant-a");
      expect(access.context.permissions).toContain("app:access");
    }
  });

  it.each([
    ["pending", "pending"],
    ["suspended", "denied"],
    ["revoked", "denied"]
  ] as const)("rejects %s memberships as %s", async (status, expected) => {
    const access = await resolveMembershipAccessForUser(user, null, {
      createServiceClient: () => service,
      listMemberships: async () => [membership({ status })]
    });

    expect(access.status).toBe(expected);
  });

  it("requires trusted tenant selection for multiple active memberships", async () => {
    const access = await resolveMembershipAccessForUser(user, null, {
      createServiceClient: () => service,
      listMemberships: async () => [
        membership({ id: "membership-a", tenantId: "tenant-a" }),
        membership({ id: "membership-b", tenantId: "tenant-b" })
      ]
    });

    expect(access.status).toBe("multiple_active");
  });

  it("rejects cross-tenant selection and accepts owned selections", async () => {
    const deps = {
      createServiceClient: () => service,
      listMemberships: async () => [
        membership({ id: "membership-a", tenantId: "tenant-a" }),
        membership({ id: "membership-b", tenantId: "tenant-b" })
      ],
      randomUUID: () => "correlation-2"
    };

    expect((await resolveMembershipAccessForUser(user, "tenant-c", deps)).status).toBe(
      "multiple_active"
    );
    const selected = await resolveMembershipAccessForUser(user, "tenant-b", deps);
    expect(selected.status).toBe("active");
    if (selected.status === "active") {
      expect(selected.context.tenantId).toBe("tenant-b");
    }
  });

  it("preserves safe next redirects for access pages", () => {
    expect(membershipAccessPath("en", "pending", "/en/customers")).toBe(
      "/en/access/pending?next=%2Fen%2Fcustomers"
    );
    expect(membershipAccessPath("pt-PT", "denied", "https://example.com")).toBe(
      "/pt-PT/access/denied?next=%2Fpt-PT"
    );
  });
});
