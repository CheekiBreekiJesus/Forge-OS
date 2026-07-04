import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const signOut = vi.fn();

vi.mock("@/lib/supabase/server-client", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { signOut }
  }))
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseAuthConfigured: vi.fn(() => true)
}));

function locationOf(response: Response): string {
  return response.headers.get("location") ?? "";
}

describe("GET /auth/signout", () => {
  beforeEach(() => {
    signOut.mockReset();
  });

  it("signs out through the user-session client and redirects to localized login", async () => {
    signOut.mockResolvedValueOnce({ error: null });

    const response = await GET(new Request("http://localhost/auth/signout?next=/en/settings"));

    expect(signOut).toHaveBeenCalled();
    expect(locationOf(response)).toBe("http://localhost/en/login");
  });

  it("rejects unsafe sign-out redirects", async () => {
    signOut.mockResolvedValueOnce({ error: null });

    const response = await GET(
      new Request("http://localhost/auth/signout?next=https%3A%2F%2Fexample.com")
    );

    expect(locationOf(response)).toBe("http://localhost/pt-PT/login");
  });

  it("does not construct a Supabase client when auth config is missing", async () => {
    const { isSupabaseAuthConfigured } = await import("@/lib/supabase/env");
    vi.mocked(isSupabaseAuthConfigured).mockReturnValueOnce(false);

    const response = await GET(new Request("http://localhost/auth/signout?next=/en"));

    expect(signOut).not.toHaveBeenCalled();
    expect(locationOf(response)).toBe("http://localhost/en/login");
  });
});
