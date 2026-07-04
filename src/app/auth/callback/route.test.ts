import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const { exchangeCodeForSession, getUser, resolveMembershipAccessForUser } = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  getUser: vi.fn(),
  resolveMembershipAccessForUser: vi.fn()
}));

vi.mock("@/lib/supabase/server-client", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession, getUser }
  }))
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

function locationOf(response: Response): string {
  return response.headers.get("location") ?? "";
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
    getUser.mockReset();
    resolveMembershipAccessForUser.mockReset();
  });

  it("redirects missing code to a localized non-sensitive error", async () => {
    const response = await GET(new Request("http://localhost/auth/callback?next=/en/settings"));

    expect(response.status).toBe(307);
    expect(locationOf(response)).toBe("http://localhost/en/login?error=missing_code");
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("does not allow external next redirects", async () => {
    exchangeCodeForSession.mockResolvedValueOnce({ error: null });
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } }, error: null });
    resolveMembershipAccessForUser.mockResolvedValueOnce({
      context: { tenantId: "tenant-a" },
      memberships: [],
      status: "active"
    });

    const response = await GET(
      new Request("http://localhost/auth/callback?code=abc&next=https%3A%2F%2Fexample.com")
    );

    expect(locationOf(response)).toBe("http://localhost/pt-PT");
  });

  it("redirects safely when Supabase auth config is missing", async () => {
    const { isSupabaseAuthConfigured } = await import("@/lib/supabase/env");
    vi.mocked(isSupabaseAuthConfigured).mockReturnValueOnce(false);

    const response = await GET(new Request("http://localhost/auth/callback?code=abc&next=/en"));

    expect(exchangeCodeForSession).not.toHaveBeenCalled();
    expect(locationOf(response)).toBe("http://localhost/en/login?error=supabase_not_configured");
  });

  it("redirects failed exchanges without leaking provider error details", async () => {
    exchangeCodeForSession.mockResolvedValueOnce({ error: new Error("raw provider detail") });

    const response = await GET(new Request("http://localhost/auth/callback?code=bad&next=/en"));

    expect(exchangeCodeForSession).toHaveBeenCalledWith("bad");
    expect(locationOf(response)).toBe("http://localhost/en/login?error=oauth_exchange_failed");
    expect(locationOf(response)).not.toContain("raw");
  });

  it("exchanges a valid code and redirects to the safe destination", async () => {
    exchangeCodeForSession.mockResolvedValueOnce({ error: null });
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } }, error: null });
    resolveMembershipAccessForUser.mockResolvedValueOnce({
      context: { tenantId: "tenant-a" },
      memberships: [],
      status: "active"
    });

    const response = await GET(new Request("http://localhost/auth/callback?code=ok&next=/pt-PT/leadops"));

    expect(exchangeCodeForSession).toHaveBeenCalledWith("ok");
    expect(resolveMembershipAccessForUser).toHaveBeenCalledWith({ id: "user-1" });
    expect(locationOf(response)).toBe("http://localhost/pt-PT/leadops");
    expect(response.headers.get("set-cookie")).toContain("forgeos.selected_tenant_id=tenant-a");
  });

  it("redirects authenticated users without active membership to pending access", async () => {
    exchangeCodeForSession.mockResolvedValueOnce({ error: null });
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } }, error: null });
    resolveMembershipAccessForUser.mockResolvedValueOnce({ memberships: [], status: "pending" });

    const response = await GET(new Request("http://localhost/auth/callback?code=ok&next=/en"));

    expect(locationOf(response)).toBe("http://localhost/en/access/pending?next=%2Fen");
  });

  it("redirects suspended or revoked users to denied access", async () => {
    exchangeCodeForSession.mockResolvedValueOnce({ error: null });
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } }, error: null });
    resolveMembershipAccessForUser.mockResolvedValueOnce({ memberships: [], status: "denied" });

    const response = await GET(new Request("http://localhost/auth/callback?code=ok&next=/pt-PT"));

    expect(locationOf(response)).toBe("http://localhost/pt-PT/access/denied?next=%2Fpt-PT");
  });

  it("redirects multi-tenant users to trusted tenant selection", async () => {
    exchangeCodeForSession.mockResolvedValueOnce({ error: null });
    getUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } }, error: null });
    resolveMembershipAccessForUser.mockResolvedValueOnce({
      memberships: [],
      status: "multiple_active"
    });

    const response = await GET(new Request("http://localhost/auth/callback?code=ok&next=/en/settings"));

    expect(locationOf(response)).toBe(
      "http://localhost/en/access/tenants?next=%2Fen%2Fsettings"
    );
  });
});
