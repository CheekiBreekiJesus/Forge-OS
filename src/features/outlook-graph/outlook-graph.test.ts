import { describe, expect, it, beforeEach, vi } from "vitest";
import { generateCodeChallenge, generateCodeVerifier } from "./oauth-pkce";
import {
  clearPendingOAuthSessions,
  consumePendingOAuthSession,
  createPendingOAuthSession,
  validatePendingOAuthState
} from "./oauth-state";
import {
  encryptTokenCacheRoundTrip,
  readEncryptedTokenCache,
  writeEncryptedTokenCache
} from "./token-cache";
import { classifyGraphHttpStatus } from "./classify-error";
import {
  buildOrganicIdempotencyKey,
  createOrganicSendSession,
  isOrganicIdempotencyKeySubmitted,
  isWithinBusinessHours,
  pauseOrganicSendSession,
  processOrganicSendSessionTick,
  resetOrganicSendSessionForTests,
  resumeOrganicSendSession
} from "./organic-send-session";
import { readOutlookGraphConfig, isOutlookLiveSendAllowed, isOutlookTestRecipientAllowed } from "./config";
import { OutlookGraphEmailProvider } from "./outlook-graph-provider";
import { clearInMemoryTokenFallback } from "./token-service";
import type { CachedOutlookTokens } from "./types";
import { join } from "node:path";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";

const TEST_KEY = "a".repeat(32);

const sampleTokens: CachedOutlookTokens = {
  accessToken: "access-token-value",
  refreshToken: "refresh-token-value",
  expiresAt: Date.now() + 3600_000,
  accountId: "acct-1",
  homeAccountId: "acct-1",
  mailboxAddress: "sender@example.com",
  displayName: "Sender",
  scopes: ["Mail.Send", "User.Read"],
  cachedAt: new Date().toISOString()
};

describe("outlook oauth pkce", () => {
  it("generates verifier and S256 challenge", () => {
    const verifier = generateCodeVerifier();
    const challenge = generateCodeChallenge(verifier);
    expect(verifier.length).toBeGreaterThan(20);
    expect(challenge).not.toEqual(verifier);
  });
});

describe("outlook oauth state", () => {
  beforeEach(() => clearPendingOAuthSessions());

  it("creates and validates pending state", () => {
    const session = createPendingOAuthSession();
    expect(validatePendingOAuthState(session.state)).toBe(true);
    const consumed = consumePendingOAuthSession(session.state);
    expect(consumed?.codeVerifier).toBe(session.codeVerifier);
    expect(validatePendingOAuthState(session.state)).toBe(false);
  });

  it("rejects expired oauth state", () => {
    const session = createPendingOAuthSession(Date.now() - 20 * 60 * 1000);
    expect(consumePendingOAuthSession(session.state, Date.now())).toBeNull();
  });
});

describe("encrypted token cache", () => {
  it("round-trips encrypted cache without exposing tokens in envelope", async () => {
    const roundTrip = encryptTokenCacheRoundTrip(TEST_KEY, sampleTokens);
    expect(roundTrip?.accessToken).toBe(sampleTokens.accessToken);
    const dir = await mkdtemp(join(tmpdir(), "forgeos-outlook-"));
    const filePath = join(dir, "outlook-token-cache.enc");
    await writeEncryptedTokenCache(TEST_KEY, sampleTokens, filePath);
    const raw = await readFileText(filePath);
    expect(raw).not.toContain("access-token-value");
    expect(raw).not.toContain("refresh-token-value");
    const loaded = await readEncryptedTokenCache(TEST_KEY, filePath);
    expect(loaded?.mailboxAddress).toBe("sender@example.com");
    await rm(dir, { recursive: true, force: true });
  });
});

async function readFileText(path: string): Promise<string> {
  const { readFile } = await import("node:fs/promises");
  return readFile(path, "utf8");
}

describe("live send gates", () => {
  it("blocks when live send disabled", () => {
    const config = readOutlookGraphConfig({
      OUTLOOK_GRAPH_ENABLED: "true",
      OUTLOOK_LIVE_SEND_ENABLED: "false"
    });
    expect(isOutlookLiveSendAllowed(config)).toBe(false);
  });

  it("enforces test recipient allowlist", () => {
    const config = readOutlookGraphConfig({
      OUTLOOK_TEST_RECIPIENTS: "test@example.com"
    });
    expect(isOutlookTestRecipientAllowed(config, "test@example.com")).toBe(true);
    expect(isOutlookTestRecipientAllowed(config, "other@example.com")).toBe(false);
  });
});

describe("graph response classification", () => {
  it("maps 202 to accepted", () => {
    expect(classifyGraphHttpStatus(202, false).classification).toBe("accepted");
  });
  it("maps 401 to reconnect required", () => {
    expect(classifyGraphHttpStatus(401, false).classification).toBe("reconnect_required");
  });
  it("maps 403 to permission failure", () => {
    expect(classifyGraphHttpStatus(403, false).classification).toBe("permission_failure");
  });
  it("maps 429 to throttled", () => {
    expect(classifyGraphHttpStatus(429, false).classification).toBe("throttled");
  });
  it("maps 5xx to temporary failure", () => {
    expect(classifyGraphHttpStatus(503, false).classification).toBe("temporary_provider_failure");
  });
  it("maps timeout after submit to uncertain", () => {
    expect(classifyGraphHttpStatus(null, true).classification).toBe("uncertain");
  });
});

describe("organic send session", () => {
  beforeEach(() => resetOrganicSendSessionForTests());

  it("defaults to disabled session with max 5 messages", () => {
    const items = Array.from({ length: 8 }, (_, i) => ({
      attemptId: `a-${i}`,
      campaignId: "c1",
      recipientId: `r-${i}`,
      approvedDraftVersion: "hash",
      senderSnapshot: {},
      recipientEmail: `user${i}@example.com`,
      subject: "Subject",
      renderedBody: "Body",
      bodyContentType: "Text" as const,
      locale: "pt-PT"
    }));
    const session = createOrganicSendSession(items);
    expect(session.items).toHaveLength(5);
    expect(session.status).toBe("paused");
  });

  it("supports pause and resume", () => {
    const session = createOrganicSendSession([], { enabled: true });
    expect(session.status).toBe("running");
    pauseOrganicSendSession();
    expect(resumeOrganicSendSession()?.status).toBe("running");
  });

  it("prevents duplicate idempotency submission", async () => {
    process.env.OUTLOOK_GRAPH_ENABLED = "true";
    process.env.OUTLOOK_LIVE_SEND_ENABLED = "true";
    process.env.MICROSOFT_CLIENT_ID = "client-id";
    process.env.FORGEOS_LOCAL_ENCRYPTION_KEY = TEST_KEY;
    const payload = {
      attemptId: "attempt-1",
      campaignId: "c1",
      recipientId: "r1",
      approvedDraftVersion: "hash-1",
      senderSnapshot: {},
      recipientEmail: "user@example.com",
      subject: "Hello",
      renderedBody: "Body",
      bodyContentType: "Text" as const,
      locale: "pt-PT"
    };
    const key = buildOrganicIdempotencyKey(payload);
    const config = readOutlookGraphConfig({
      OUTLOOK_GRAPH_ENABLED: "true",
      OUTLOOK_LIVE_SEND_ENABLED: "true",
      MICROSOFT_CLIENT_ID: "client-id",
      FORGEOS_LOCAL_ENCRYPTION_KEY: TEST_KEY
    });
    const { saveCachedTokens } = await import("./token-service");
    await saveCachedTokens(config, sampleTokens);
    createOrganicSendSession([payload], {
      enabled: true,
      delayMinSeconds: 0,
      delayMaxSeconds: 0
    });
    const provider = new OutlookGraphEmailProvider({
      ...config,
      graphBaseUrl: "https://mock.graph.local/v1.0"
    });
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(null, { status: 202 }) as Response
    );
    await processOrganicSendSessionTick(provider);
    expect(isOrganicIdempotencyKeySubmitted(key)).toBe(true);
    vi.restoreAllMocks();
  });

  it("checks Europe/Lisbon business hours", () => {
    const config = {
      enabled: true,
      maxMessagesPerSession: 5,
      concurrentSends: 1,
      delayMinSeconds: 180,
      delayMaxSeconds: 420,
      timezone: "Europe/Lisbon",
      businessHourStart: 9,
      businessHourEnd: 18
    };
    expect(isWithinBusinessHours(config, new Date("2026-07-03T10:00:00Z"))).toBe(true);
    expect(isWithinBusinessHours(config, new Date("2026-07-03T22:00:00Z"))).toBe(false);
  });
});

describe("outlook status api payload", () => {
  beforeEach(() => clearInMemoryTokenFallback());

  it("never includes token fields in connection status", async () => {
    const provider = new OutlookGraphEmailProvider(
      readOutlookGraphConfig({
        OUTLOOK_GRAPH_ENABLED: "true",
        MICROSOFT_CLIENT_ID: "client",
        FORGEOS_LOCAL_ENCRYPTION_KEY: TEST_KEY
      })
    );
    const status = await provider.getConnectionStatus();
    expect(status).not.toHaveProperty("accessToken");
    expect(status).not.toHaveProperty("refreshToken");
  });
});

describe("uncertain graph send", () => {
  it("marks attempt uncertain and blocks automatic retry", async () => {
    const provider = new OutlookGraphEmailProvider({
      ...readOutlookGraphConfig({
        OUTLOOK_GRAPH_ENABLED: "true",
        OUTLOOK_LIVE_SEND_ENABLED: "true",
        MICROSOFT_CLIENT_ID: "client-id",
        FORGEOS_LOCAL_ENCRYPTION_KEY: TEST_KEY
      }),
      graphBaseUrl: "https://mock.graph.local/v1.0"
    });
    const { saveCachedTokens } = await import("./token-service");
    await saveCachedTokens(
      readOutlookGraphConfig({
        OUTLOOK_GRAPH_ENABLED: "true",
        OUTLOOK_LIVE_SEND_ENABLED: "true",
        MICROSOFT_CLIENT_ID: "client-id",
        FORGEOS_LOCAL_ENCRYPTION_KEY: TEST_KEY
      }),
      sampleTokens
    );
    const result = await provider.sendApprovedMessage(
      {
        attemptId: "attempt-uncertain",
        campaignId: "c1",
        recipientId: "r1",
        approvedDraftVersion: "hash",
        senderSnapshot: {},
        recipientEmail: "test@example.com",
        subject: "Hi",
        renderedBody: "Body",
        bodyContentType: "Text",
        locale: "pt-PT"
      },
      { simulateConnectionLossAfterSubmit: true }
    );
    expect(result.classification).toBe("uncertain");
    expect(result.retryable).toBe(false);
  });
});
