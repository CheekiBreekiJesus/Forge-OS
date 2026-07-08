import { createHmac, timingSafeEqual } from "node:crypto";
import type { PublicUnsubscribeTokenClaims } from "@/domain/email-delivery-types";
import { assertServerOnlyModule } from "./server-only";

assertServerOnlyModule();

const TOKEN_PREFIX = "forgeos-unsub";
const TOKEN_VERSION = 1;
const DEFAULT_TTL_DAYS = 365;

type CreateTokenInput = Omit<PublicUnsubscribeTokenClaims, "version" | "issuedAt" | "expiresAt"> & {
  issuedAt?: number;
  ttlDays?: number | null;
};

export type VerifyUnsubscribeTokenResult =
  | { ok: true; claims: PublicUnsubscribeTokenClaims }
  | { ok: false; reason: "missing_secret" | "invalid" | "unsupported_version" | "expired" };

export function createUnsubscribeToken(input: CreateTokenInput, secret: string): string {
  assertSecret(secret);
  const issuedAt = input.issuedAt ?? Math.floor(Date.now() / 1000);
  const ttlDays = input.ttlDays === undefined ? DEFAULT_TTL_DAYS : input.ttlDays;
  const claims: PublicUnsubscribeTokenClaims = {
    campaignId: input.campaignId,
    campaignRecipientId: input.campaignRecipientId,
    emailHash: input.emailHash,
    expiresAt: ttlDays === null ? null : issuedAt + ttlDays * 24 * 60 * 60,
    issuedAt,
    leadId: input.leadId,
    tenantId: input.tenantId,
    version: TOKEN_VERSION
  };
  const payload = base64UrlEncode(JSON.stringify(claims));
  const signature = signPayload(payload, secret);
  return `${TOKEN_PREFIX}.${payload}.${signature}`;
}

export function verifyUnsubscribeToken(
  token: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): VerifyUnsubscribeTokenResult {
  if (!secret.trim()) return { ok: false, reason: "missing_secret" };

  const [prefix, payload, signature] = token.split(".");
  if (prefix !== TOKEN_PREFIX || !payload || !signature) return { ok: false, reason: "invalid" };

  const expected = signPayload(payload, secret);
  if (!timingSafeStringEqual(signature, expected)) return { ok: false, reason: "invalid" };

  const claims = parseClaims(payload);
  if (!claims) return { ok: false, reason: "invalid" };
  if (claims.version !== TOKEN_VERSION) return { ok: false, reason: "unsupported_version" };
  if (claims.expiresAt !== null && claims.expiresAt < nowSeconds) {
    return { ok: false, reason: "expired" };
  }
  return { ok: true, claims };
}

export function buildUnsubscribeUrl(baseUrl: string, locale: string, token: string): string {
  const parsed = new URL(baseUrl);
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
    throw new Error("Public unsubscribe base URL must be HTTPS outside local development.");
  }
  parsed.pathname = `/${locale}/unsubscribe`;
  parsed.search = new URLSearchParams({ token }).toString();
  return parsed.toString();
}

function assertSecret(secret: string): void {
  if (secret.trim().length < 32) {
    throw new Error("OUTREACH_UNSUBSCRIBE_SECRET must contain at least 32 characters.");
  }
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function parseClaims(payload: string): PublicUnsubscribeTokenClaims | null {
  try {
    const value = JSON.parse(base64UrlDecode(payload)) as Partial<PublicUnsubscribeTokenClaims>;
    if (
      value.version !== TOKEN_VERSION ||
      typeof value.tenantId !== "string" ||
      typeof value.campaignId !== "string" ||
      typeof value.campaignRecipientId !== "string" ||
      typeof value.leadId !== "string" ||
      typeof value.emailHash !== "string" ||
      typeof value.issuedAt !== "number" ||
      (typeof value.expiresAt !== "number" && value.expiresAt !== null)
    ) {
      return null;
    }
    return value as PublicUnsubscribeTokenClaims;
  } catch {
    return null;
  }
}

function timingSafeStringEqual(actual: string, expected: string): boolean {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.byteLength !== expectedBuffer.byteLength) return false;
  return timingSafeEqual(actualBuffer, expectedBuffer);
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}
