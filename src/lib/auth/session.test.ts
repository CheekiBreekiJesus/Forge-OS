import { describe, expect, it, vi, beforeEach } from "vitest";
import { resolveForgeOSSession } from "./session";
import { ForgeOSAuthError } from "./types";

function requestWithHeaders(headers: Record<string, string>): Request {
  return new Request("http://localhost/api/test", { headers });
}

describe("resolveForgeOSSession", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns 401 in production without supabase or test auth", async () => {
    await expect(
      resolveForgeOSSession(requestWithHeaders({}), {
        NODE_ENV: "production",
        NEXT_PUBLIC_SUPABASE_URL: "",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ""
      })
    ).rejects.toMatchObject({ status: 503, code: "auth_not_configured" });
  });

  it("allows test auth only when FORGEOS_TEST_AUTH_ENABLED is true", async () => {
    await expect(
      resolveForgeOSSession(
        requestWithHeaders({
          "x-forgeos-actor-id": "user-1",
          "x-forgeos-tenant-id": "tenant_jh_gomes",
          "x-forgeos-roles": "outreach_operator"
        }),
        { NODE_ENV: "development", FORGEOS_TEST_AUTH_ENABLED: "false", FORGEOS_E2E: "false" }
      )
    ).rejects.toBeInstanceOf(ForgeOSAuthError);
  });

  it("resolves test auth session with explicit flag", async () => {
    const session = await resolveForgeOSSession(
      requestWithHeaders({
        "x-forgeos-actor-id": "user-1",
        "x-forgeos-tenant-id": "tenant_jh_gomes",
        "x-forgeos-roles": "outreach_operator"
      }),
      { NODE_ENV: "test", FORGEOS_TEST_AUTH_ENABLED: "true" }
    );

    expect(session.userId).toBe("user-1");
    expect(session.tenantId).toBe("tenant_jh_gomes");
    expect(session.source).toBe("test_adapter");
  });

  it("blocks development headers in production mode", async () => {
    await expect(
      resolveForgeOSSession(
        requestWithHeaders({
          "x-forgeos-actor-id": "user-1",
          "x-forgeos-tenant-id": "tenant_jh_gomes",
          "x-forgeos-roles": "owner"
        }),
        {
          NODE_ENV: "production",
          FORGEOS_ALLOW_DEV_AUTH_HEADERS: "true",
          NEXT_PUBLIC_SUPABASE_URL: "",
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ""
        }
      )
    ).rejects.toMatchObject({ status: 503, code: "auth_not_configured" });
  });

  it("rejects invalid roles", async () => {
    await expect(
      resolveForgeOSSession(
        requestWithHeaders({
          "x-forgeos-actor-id": "user-1",
          "x-forgeos-tenant-id": "tenant_jh_gomes",
          "x-forgeos-roles": "invalid_role"
        }),
        { NODE_ENV: "test", FORGEOS_TEST_AUTH_ENABLED: "true" }
      )
    ).rejects.toMatchObject({ status: 403 });
  });
});
