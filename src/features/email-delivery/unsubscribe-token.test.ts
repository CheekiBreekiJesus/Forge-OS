import { describe, expect, it } from "vitest";
import {
  buildUnsubscribeUrl,
  createUnsubscribeToken,
  verifyUnsubscribeToken
} from "./unsubscribe-token";

const secret = "test-secret-with-enough-entropy-for-hmac-signing";
const claims = {
  campaignId: "cmp_1",
  campaignRecipientId: "cmr_1",
  emailHash: "hash_email",
  leadId: "lead_1",
  tenantId: "tenant_a"
};

describe("unsubscribe tokens", () => {
  it("creates and verifies versioned signed tokens", () => {
    const token = createUnsubscribeToken({ ...claims, issuedAt: 1000, ttlDays: 1 }, secret);
    const result = verifyUnsubscribeToken(token, secret, 1001);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.claims.version).toBe(1);
      expect(result.claims.campaignRecipientId).toBe("cmr_1");
      expect(result.claims.expiresAt).toBe(87400);
    }
  });

  it("rejects tampered tokens", () => {
    const token = createUnsubscribeToken({ ...claims, issuedAt: 1000, ttlDays: 1 }, secret);
    const tampered = `${token.slice(0, -1)}x`;

    expect(verifyUnsubscribeToken(tampered, secret, 1001)).toEqual({
      ok: false,
      reason: "invalid"
    });
  });

  it("rejects expired tokens", () => {
    const token = createUnsubscribeToken({ ...claims, issuedAt: 1000, ttlDays: 1 }, secret);

    expect(verifyUnsubscribeToken(token, secret, 90000)).toEqual({
      ok: false,
      reason: "expired"
    });
  });

  it("builds a locale-aware unsubscribe URL without raw query identifiers", () => {
    const token = createUnsubscribeToken({ ...claims, issuedAt: 1000, ttlDays: null }, secret);
    const url = buildUnsubscribeUrl("https://forgeos.example", "pt-PT", token);

    expect(url).toContain("https://forgeos.example/pt-PT/unsubscribe?token=");
    expect(url).not.toContain("campaignRecipientId");
  });
});
