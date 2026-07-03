import { describe, expect, it, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as statusGet } from "@/app/api/integrations/outlook/status/route";
import { POST as testSendPost } from "@/app/api/integrations/outlook/test-send/route";
import { clearInMemoryTokenFallback, saveCachedTokens } from "@/features/outlook-graph/token-service";
import { readOutlookGraphConfig } from "@/features/outlook-graph/config";
import type { CachedOutlookTokens } from "@/features/outlook-graph/types";

const TEST_KEY = "b".repeat(32);

const tokens: CachedOutlookTokens = {
  accessToken: "integration-access",
  refreshToken: "integration-refresh",
  expiresAt: Date.now() + 3_600_000,
  accountId: "acct",
  homeAccountId: "acct",
  mailboxAddress: "mailbox@example.com",
  displayName: "Mailbox",
  scopes: ["Mail.Send"],
  cachedAt: new Date().toISOString()
};

function trustedHeaders(): Record<string, string> {
  return {
    "content-type": "application/json",
    host: "localhost:3000",
    origin: "http://localhost:3000",
    "x-forgeos-actor-id": "operator",
    "x-forgeos-correlation-id": "corr",
    "x-forgeos-roles": "marketing_manager",
    "x-forgeos-tenant-id": "tenant_demo"
  };
}

describe("outlook integration api", () => {
  beforeEach(() => {
    clearInMemoryTokenFallback();
    process.env.OUTLOOK_GRAPH_ENABLED = "true";
    process.env.OUTLOOK_LIVE_SEND_ENABLED = "true";
    process.env.MICROSOFT_CLIENT_ID = "client-id";
    process.env.FORGEOS_LOCAL_ENCRYPTION_KEY = TEST_KEY;
    process.env.OUTLOOK_TEST_RECIPIENTS = "allowed@example.com";
    process.env.MICROSOFT_GRAPH_BASE_URL = "https://mock.graph.local/v1.0";
    process.env.FORGEOS_PUBLIC_BASE_URL = "http://localhost:3000";
  });

  it("returns connection status without token fields", async () => {
    await saveCachedTokens(readOutlookGraphConfig(), tokens);
    const response = await statusGet();
    const body = await response.json();
    expect(body.connection.mailboxAddress).toBe("mailbox@example.com");
    expect(JSON.stringify(body)).not.toContain("integration-access");
    expect(JSON.stringify(body)).not.toContain("integration-refresh");
  });

  it("requires server persistence and trusted actor for test send", async () => {
    await saveCachedTokens(readOutlookGraphConfig(), tokens);
    const request = new NextRequest("http://localhost:3000/api/integrations/outlook/test-send", {
      method: "POST",
      body: JSON.stringify({
        confirmation: "SEND OUTLOOK TEST",
        campaignId: "campaign-synthetic",
        recipientId: "recipient-synthetic"
      }),
      headers: trustedHeaders()
    });
    const response = await testSendPost(request);
    expect(response.status).toBe(503);
  });

  it("blocks recipient outside allowlist when persistence configured", async () => {
    const request = new NextRequest("http://localhost:3000/api/integrations/outlook/test-send", {
      method: "POST",
      body: JSON.stringify({
        confirmation: "SEND OUTLOOK TEST",
        campaignId: "campaign-synthetic",
        recipientId: "recipient-synthetic",
        recipientEmail: "blocked@example.com"
      }),
      headers: trustedHeaders()
    });
    const response = await testSendPost(request);
    expect([403, 503]).toContain(response.status);
  });
});
