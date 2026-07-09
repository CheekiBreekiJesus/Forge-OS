import { createHash } from "node:crypto";
import type { EmailDeliveryRequest } from "@/domain/email-delivery-types";
import type { CampaignRecipient } from "@/domain/campaign-types";
import type { OutreachSendJob, OutreachSendJobRecipient } from "@/domain/send-job-types";
import { normalizeEmail } from "@/features/leadops/import-normalization";
import { readEmailDeliveryConfig } from "./config";
import { assertServerOnlyModule } from "./server-only";
import { buildUnsubscribeUrl, createUnsubscribeToken } from "./unsubscribe-token";

assertServerOnlyModule();

export type BuildCampaignDeliveryRequestInput = {
  job: OutreachSendJob;
  recipient: CampaignRecipient;
  jobRecipient: OutreachSendJobRecipient;
  actorId: string;
  language?: string;
};

export function buildServerCampaignDeliveryRequest(
  input: BuildCampaignDeliveryRequestInput
): EmailDeliveryRequest {
  const { job, recipient, jobRecipient, actorId } = input;
  const config = readEmailDeliveryConfig();

  if (job.deliveryMode === "simulation") {
    return {
      approvedContentHash: jobRecipient.approvedContentVersion,
      campaignId: job.campaignId,
      campaignRecipientId: recipient.id,
      html: recipient.personalizedHtml,
      idempotencyKey: jobRecipient.idempotencyKey,
      initiatedBy: actorId,
      leadId: recipient.leadId,
      mode: "simulation",
      plainText: recipient.personalizedPlainText,
      subject: recipient.personalizedSubject,
      tenantId: job.tenantId,
      toEmail: jobRecipient.normalizedEmail,
      toName: recipient.snapshotContactName || recipient.snapshotCompanyName
    };
  }

  const emailHash = hashNormalizedEmail(job.tenantId, recipient.snapshotEmail);
  const unsubscribeToken = createUnsubscribeToken(
    {
      campaignId: job.campaignId,
      campaignRecipientId: recipient.id,
      emailHash,
      leadId: recipient.leadId,
      tenantId: job.tenantId
    },
    config.unsubscribeSigningSecret
  );
  const language = input.language?.trim() || "pt-PT";

  return {
    approvedContentHash: jobRecipient.approvedContentVersion,
    campaignId: job.campaignId,
    campaignRecipientId: recipient.id,
    html: recipient.personalizedHtml,
    idempotencyKey: jobRecipient.idempotencyKey,
    initiatedBy: actorId,
    leadId: recipient.leadId,
    mode: "real_send",
    plainText: recipient.personalizedPlainText,
    subject: recipient.personalizedSubject,
    tenantId: job.tenantId,
    toEmail: jobRecipient.normalizedEmail,
    toName: recipient.snapshotContactName || recipient.snapshotCompanyName,
    unsubscribeUrl: buildUnsubscribeUrl(config.publicBaseUrl, language, unsubscribeToken)
  };
}

function hashNormalizedEmail(tenantId: string, email: string): string {
  return createHash("sha256")
    .update(`${tenantId}:${normalizeEmail(email)}`)
    .digest("hex");
}
