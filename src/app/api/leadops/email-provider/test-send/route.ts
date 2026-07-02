import { NextResponse } from "next/server";
import type { EmailDeliveryRequest } from "@/domain/email-delivery-types";
import { createEmailDeliveryProvider } from "@/features/email-delivery/provider";

type ProtectedTestSendPayload = EmailDeliveryRequest & {
  confirmation?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
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

  return {
    approvedContentHash: value.approvedContentHash,
    campaignId: value.campaignId,
    campaignRecipientId: value.campaignRecipientId,
    html: value.html,
    idempotencyKey: value.idempotencyKey,
    initiatedBy: value.initiatedBy || "local-user",
    leadId: value.leadId,
    mode: "provider_test",
    plainText: value.plainText,
    subject: value.subject,
    tenantId: value.tenantId,
    toEmail: value.toEmail.trim().toLowerCase(),
    toName: value.toName || value.toEmail
  };
}
