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

describe("outlook integration api", () => {
  beforeEach(() => {
    clearInMemoryTokenFallback();
    process.env.OUTLOOK_GRAPH_ENABLED = "true";
    process.env.OUTLOOK_LIVE_SEND_ENABLED = "true";
    process.env.MICROSOFT_CLIENT_ID = "client-id";
    process.env.FORGEOS_LOCAL_ENCRYPTION_KEY = TEST_KEY;
    process.env.OUTLOOK_TEST_RECIPIENTS = "allowed@example.com";
    process.env.MICROSOFT_GRAPH_BASE_URL = "https://mock.graph.local/v1.0";
  });

  it("returns connection status without token fields", async () => {
    await saveCachedTokens(readOutlookGraphConfig(), tokens);
    const response = await statusGet();
    const body = await response.json();
    expect(body.connection.mailboxAddress).toBe("mailbox@example.com");
    expect(JSON.stringify(body)).not.toContain("integration-access");
    expect(JSON.stringify(body)).not.toContain("integration-refresh");
  });

  it("sends approved synthetic draft through mock graph and records accepted", async () => {
    await saveCachedTokens(readOutlookGraphConfig(), tokens);
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(null, { status: 202 }) as Response
    );
    const request = new NextRequest("http://localhost/api/integrations/outlook/test-send", {
      method: "POST",
      body: JSON.stringify({
        confirmation: "SEND OUTLOOK TEST",
        campaignId: "campaign-synthetic",
        recipientId: "recipient-synthetic",
        approvedDraftVersion: "hash-synthetic",
        recipientEmail: "allowed@example.com",
        subject: "Synthetic subject",
        renderedBody: "<p>Synthetic body</p>",
        bodyContentType: "HTML"
      })
    });
    const response = await testSendPost(request);
    const body = await response.json();
    expect(response.status).toBe(202);
    expect(body.acceptedByGraph).toBe(true);
    expect(fetchMock).toHaveBeenCalled();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(init.body)).toContain("Synthetic subject");
    expect(String(init.body)).not.toContain("integration-access");
    fetchMock.mockRestore();
  });

  it("blocks recipient outside allowlist", async () => {
    const request = new NextRequest("http://localhost/api/integrations/outlook/test-send", {
      method: "POST",
      body: JSON.stringify({
        confirmation: "SEND OUTLOOK TEST",
        campaignId: "campaign-synthetic",
        recipientId: "recipient-synthetic",
        approvedDraftVersion: "hash-synthetic",
        recipientEmail: "blocked@example.com",
        subject: "Synthetic subject",
        renderedBody: "Body"
      })
    });
    const response = await testSendPost(request);
    expect(response.status).toBe(403);
  });
});
