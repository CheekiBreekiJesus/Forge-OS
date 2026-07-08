import { createHash } from "node:crypto";
import type { EmailDeliveryRequest } from "@/domain/email-delivery-types";
import { normalizeEmail } from "@/features/leadops/import-normalization";
import { readEmailDeliveryConfig } from "./config";
import { assertServerOnlyModule } from "./server-only";
import { buildUnsubscribeUrl, createUnsubscribeToken } from "./unsubscribe-token";

assertServerOnlyModule();

export type BuildProtectedTestSendRequestInput = {
  tenantId: string;
  campaignId: string;
  campaignRecipientId: string;
  leadId: string;
  approvedContentHash: string;
  idempotencyKey: string;
  toEmail: string;
  toName: string;
  subject: string;
  plainText: string;
  html?: string;
  initiatedBy: string;
  snapshotEmail: string;
  language: string;
};

export function buildProtectedTestSendRequest(
  input: BuildProtectedTestSendRequestInput
): EmailDeliveryRequest {
  const config = readEmailDeliveryConfig();
  const emailHash = hashNormalizedEmail(input.tenantId, input.snapshotEmail);
  const unsubscribeToken = createUnsubscribeToken(
    {
      campaignId: input.campaignId,
      campaignRecipientId: input.campaignRecipientId,
      emailHash,
      leadId: input.leadId,
      tenantId: input.tenantId
    },
    config.unsubscribeSigningSecret
  );

  return {
    approvedContentHash: input.approvedContentHash,
    campaignId: input.campaignId,
    campaignRecipientId: input.campaignRecipientId,
    html: input.html,
    idempotencyKey: input.idempotencyKey,
    initiatedBy: input.initiatedBy,
    leadId: input.leadId,
    mode: "provider_test",
    plainText: input.plainText,
    subject: input.subject,
    tenantId: input.tenantId,
    toEmail: input.toEmail.trim().toLowerCase(),
    toName: input.toName,
    unsubscribeUrl: buildUnsubscribeUrl(config.publicBaseUrl, input.language || "pt-PT", unsubscribeToken)
  };
}

function hashNormalizedEmail(tenantId: string, email: string): string {
  return createHash("sha256")
    .update(`${tenantId}:${normalizeEmail(email)}`)
    .digest("hex");
}
