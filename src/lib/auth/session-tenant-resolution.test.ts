import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForgeOSAuthError } from "./types";

const { getUser, resolveMembershipAccessForUser, resolveTenantByKey } = vi.hoisted(() => ({
  getUser: vi.fn(),
  resolveMembershipAccessForUser: vi.fn(),
  resolveTenantByKey: vi.fn()
}));

vi.mock("@/lib/supabase/server-client", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser }
  }))
}));

vi.mock("@/lib/supabase/service-client", () => ({
  createSupabaseServiceClient: vi.fn(() => ({}))
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAuthConfigured: vi.fn(() => true)
}));

vi.mock("@/lib/auth/membership", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/membership")>();
  return {
    ...actual,
    resolveMembershipAccessForUser
  };
});

vi.mock("@/lib/supabase/tenant", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase/tenant")>();
  return {
    ...actual,
    resolveTenantByKey
  };
});

import {
  readSelectedTenantIdFromRequest,
  resolveForgeOSSession
} from "./session";
import { SELECTED_TENANT_COOKIE } from "./membership";

function requestWithCookie(tenantId: string | null): Request {
  const headers: Record<string, string> = {};
  if (tenantId) {
    headers.cookie = `${SELECTED_TENANT_COOKIE}=${tenantId}`;
  }
  return new Request("http://localhost/api/test", { headers });
}

const activeContext = {
  correlationId: "correlation-1",
  membershipId: "membership-a",
  permissions: ["app:access"],
  roles: ["viewer"],
  tenantId: "tenant-a",
  userId: "user-1"
};

describe("readSelectedTenantIdFromRequest", () => {
  it("reads the selected tenant cookie from request headers", () => {
    expect(readSelectedTenantIdFromRequest(requestWithCookie("tenant-a"))).toBe("tenant-a");
    expect(readSelectedTenantIdFromRequest(new Request("http://localhost"))).toBeNull();
  });
});

describe("resolveForgeOSSession tenant resolution", () => {
  beforeEach(() => {
    getUser.mockReset();
    resolveMembershipAccessForUser.mockReset();
    resolveTenantByKey.mockReset();
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  });

  it("resolves active membership from the selected tenant cookie", async () => {
    resolveMembershipAccessForUser.mockResolvedValueOnce({
      context: activeContext,
      memberships: [],
      status: "active"
    });

    const session = await resolveForgeOSSession(requestWithCookie("tenant-a"), {
      NODE_ENV: "test",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key"
    });

    expect(resolveMembershipAccessForUser).toHaveBeenCalledWith({ id: "user-1" }, "tenant-a");
    expect(session.tenantId).toBe("tenant-a");
    expect(session.source).toBe("supabase");
  });

  it("rejects unauthorized cookie tenant selections", async () => {
    resolveMembershipAccessForUser.mockResolvedValueOnce({
      context: activeContext,
      memberships: [],
      status: "active"
    });

    await expect(
      resolveForgeOSSession(requestWithCookie("tenant-b"), {
        NODE_ENV: "test",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key"
      })
    ).rejects.toMatchObject({ status: 403, code: "forbidden" });
  });

  it("requires tenant selection when multiple active memberships exist", async () => {
    resolveMembershipAccessForUser.mockResolvedValueOnce({
      memberships: [
        { tenantId: "tenant-a" },
        { tenantId: "tenant-b" }
      ],
      status: "multiple_active"
    });

    await expect(
      resolveForgeOSSession(new Request("http://localhost/api/test"), {
        NODE_ENV: "test",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key"
      })
    ).rejects.toMatchObject({
      status: 403,
      message: "Tenant selection required."
    });
  });

  it("uses FORGEOS_ACTIVE_TENANT_KEY override for single-tenant deployments", async () => {
    resolveTenantByKey.mockResolvedValueOnce({
      defaultLocale: "pt-PT",
      id: "tenant-configured",
      slug: "jh-gomes",
      tenantKey: "tenant_jh_gomes"
    });
    resolveMembershipAccessForUser.mockResolvedValueOnce({
      context: { ...activeContext, tenantId: "tenant-configured" },
      memberships: [],
      status: "active"
    });

    const session = await resolveForgeOSSession(requestWithCookie("tenant-a"), {
      FORGEOS_ACTIVE_TENANT_KEY: "tenant_jh_gomes",
      NODE_ENV: "test",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key"
    });

    expect(resolveMembershipAccessForUser).toHaveBeenCalledWith(
      { id: "user-1" },
      "tenant-configured"
    );
    expect(session.tenantId).toBe("tenant-configured");
  });

  it("rejects configured tenant keys without membership access", async () => {
    resolveTenantByKey.mockResolvedValueOnce({
      defaultLocale: "pt-PT",
      id: "tenant-configured",
      slug: "jh-gomes",
      tenantKey: "tenant_jh_gomes"
    });
    resolveMembershipAccessForUser.mockResolvedValueOnce({
      memberships: [],
      status: "denied"
    });

    await expect(
      resolveForgeOSSession(new Request("http://localhost/api/test"), {
        FORGEOS_ACTIVE_TENANT_KEY: "tenant_jh_gomes",
        NODE_ENV: "test",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key"
      })
    ).rejects.toBeInstanceOf(ForgeOSAuthError);
  });
});
