import { describe, expect, it } from "vitest";
import { isPublicRoute, requiresActiveMembership } from "./routes";

describe("auth route classification", () => {
  it.each([
    "/pt-PT/login",
    "/en/access/pending",
    "/auth/callback",
    "/auth/signout",
    "/api/health/local",
    "/api/outreach/unsubscribe",
    "/api/outreach/brevo/webhook",
    "/_next/static/chunk.js",
    "/favicon.ico"
  ])("keeps public route accessible: %s", (path) => {
    expect(isPublicRoute(path)).toBe(true);
    expect(requiresActiveMembership(path)).toBe(false);
  });

  it.each([
    "/pt-PT",
    "/en/customers",
    "/pt-PT/leadops",
    "/en/settings",
    "/api/leadops/generate",
    "/api/outreach/send-jobs/queue"
  ])("requires active membership for protected route: %s", (path) => {
    expect(requiresActiveMembership(path)).toBe(true);
  });
});
