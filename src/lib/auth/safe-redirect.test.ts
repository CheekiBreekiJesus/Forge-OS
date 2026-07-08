import { describe, expect, it } from "vitest";
import {
  localeFromInternalPath,
  loginPathForRedirect,
  normalizeLoginError,
  sanitizeAuthRedirect,
  sanitizeInternalRedirect
} from "./safe-redirect";

describe("safe auth redirects", () => {
  it.each(["/pt-PT", "/en", "/pt-PT/leadops", "/en/settings?tab=auth"])(
    "accepts internal path %s",
    (path) => {
      expect(sanitizeInternalRedirect(path, "/pt-PT")).toBe(path);
    }
  );

  it.each([
    "https://example.com",
    "http://example.com",
    "//example.com",
    "\\\\example.com",
    "/\\example.com",
    "/%5C%5Cexample.com",
    "javascript:alert(1)",
    "/javascript:alert(1)",
    "data:text/html,test"
  ])("rejects unsafe redirect %s", (path) => {
    expect(sanitizeInternalRedirect(path, "/pt-PT")).toBe("/pt-PT");
  });

  it("blocks auth callback loops", () => {
    expect(sanitizeAuthRedirect("/auth/callback?next=/en", "/en")).toBe("/en");
    expect(sanitizeAuthRedirect("/auth/callback/nested", "/en")).toBe("/en");
    expect(sanitizeAuthRedirect("/auth/signout", "/pt-PT")).toBe("/pt-PT");
  });

  it("derives localized login paths without open redirects", () => {
    expect(localeFromInternalPath("/en/settings?tab=auth")).toBe("en");
    expect(loginPathForRedirect("/en/settings?tab=auth", "oauth_exchange_failed")).toBe(
      "/en/login?error=oauth_exchange_failed"
    );
    expect(normalizeLoginError("tenant_access_denied")).toBe("tenant_access_denied");
    expect(normalizeLoginError("raw-provider-error")).toBeNull();
  });
});
