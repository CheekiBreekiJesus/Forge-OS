import { NextResponse } from "next/server";
import type { EmailDeliveryRequest } from "@/domain/email-delivery-types";
import { buildProtectedTestSendRequest } from "@/features/email-delivery/build-protected-test-send-request";
import { createEmailDeliveryProvider } from "@/features/email-delivery/provider";
import { resolveForgeOSSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { requireOutreachPermission, ForgeOSAuthError } from "@/lib/auth/types";
import { getForgeOSPersistenceMode } from "@/lib/auth/membership";

type ProtectedTestSendPayload = EmailDeliveryRequest & {
  confirmation?: string;
  snapshotEmail?: string;
  language?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    if (getForgeOSPersistenceMode() === "supabase") {
      const session = await resolveForgeOSSession(request);
      requireOutreachPermission(session, "deliver");
      const limit = checkRateLimit(`protected-test-send:${session.userId}`, 10, 60_000);
      if (!limit.allowed) {
        return NextResponse.json(
          { error: "Rate limit exceeded." },
          { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } }
        );
      }
    }

    const payload = await request.json().catch(() => null);
    const parsed = parsePayload(payload);

    if (!parsed) {
      return NextResponse.json({ error: "Invalid protected test-email request." }, { status: 400 });
    }

    const provider = createEmailDeliveryProvider();
    const result = await provider.send(parsed);
    const status =
      result.status === "failed"
        ? 502
        : result.status === "blocked"
          ? 403
          : 200;

    return NextResponse.json(result, { status });
  } catch (error) {
    if (error instanceof ForgeOSAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

function parsePayload(payload: unknown): EmailDeliveryRequest | null {
  if (!payload || typeof payload !== "object") return null;
  const value = payload as ProtectedTestSendPayload;
  if (value.confirmation !== "SEND TEST") return null;
  if (value.mode !== "provider_test") return null;
  if (!value.tenantId || !value.campaignId || !value.campaignRecipientId || !value.leadId) {
    return null;
  }
  if (!value.approvedContentHash || !value.idempotencyKey) return null;
  if (!EMAIL_RE.test(value.toEmail)) return null;
  if (!value.subject.trim() || !value.plainText.trim()) return null;

  if (value.unsubscribeUrl?.trim()) {
    return {
      approvedContentHash: value.approvedContentHash,
      campaignId: value.campaignId,
      campaignRecipientId: value.campaignRecipientId,
      html: value.html,
      idempotencyKey: value.idempotencyKey,
      initiatedBy: value.initiatedBy,
      leadId: value.leadId,
      mode: "provider_test",
      plainText: value.plainText,
      subject: value.subject,
      tenantId: value.tenantId,
      toEmail: value.toEmail,
      toName: value.toName,
      unsubscribeUrl: value.unsubscribeUrl
    };
  }

  if (!value.snapshotEmail || !value.language) return null;

  return buildProtectedTestSendRequest({
    approvedContentHash: value.approvedContentHash,
    campaignId: value.campaignId,
    campaignRecipientId: value.campaignRecipientId,
    html: value.html,
    idempotencyKey: value.idempotencyKey,
    initiatedBy: value.initiatedBy,
    language: value.language,
    leadId: value.leadId,
    plainText: value.plainText,
    snapshotEmail: value.snapshotEmail,
    subject: value.subject,
    tenantId: value.tenantId,
    toEmail: value.toEmail,
    toName: value.toName
  });
}
