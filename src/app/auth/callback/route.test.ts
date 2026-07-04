import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const exchangeCodeForSession = vi.fn();

vi.mock("@/lib/supabase/server-client", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession }
  }))
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAuthConfigured: vi.fn(() => true)
}));

function locationOf(response: Response): string {
  return response.headers.get("location") ?? "";
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
  });

  it("redirects missing code to a localized non-sensitive error", async () => {
    const response = await GET(new Request("http://localhost/auth/callback?next=/en/settings"));

    expect(response.status).toBe(307);
    expect(locationOf(response)).toBe("http://localhost/en/login?error=missing_code");
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("does not allow external next redirects", async () => {
    exchangeCodeForSession.mockResolvedValueOnce({ error: null });

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

    const response = await GET(new Request("http://localhost/auth/callback?code=ok&next=/pt-PT/leadops"));

    expect(exchangeCodeForSession).toHaveBeenCalledWith("ok");
    expect(locationOf(response)).toBe("http://localhost/pt-PT/leadops");
  });
});
