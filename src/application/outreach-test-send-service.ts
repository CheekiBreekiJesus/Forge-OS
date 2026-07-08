import type { EmailDeliveryProvider } from "@/features/email-delivery/provider";
import type {
  EmailDeliveryResponse,
  OutreachSendAttemptStatus
} from "@/domain/email-delivery-types";
import type { CampaignRecipient } from "@/domain/campaign-types";
import { isEmailSuppressed } from "@/application/suppression-service";
import { buildApprovalContentHash } from "@/application/campaign-approval-service";
import { buildProtectedTestSendRequest } from "@/features/email-delivery/build-protected-test-send-request";
import { assertServerOnlyModule } from "@/features/email-delivery/server-only";
import { buildTestSendIdempotencyKey } from "@/features/outreach/protected-test-send-shared";
import { isValidEmailSyntax, normalizeEmail } from "@/features/leadops/import-normalization";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";
import { PersistenceError } from "@/persistence/interfaces";

assertServerOnlyModule();

export type ProtectedTestEmailInput = {
  tenantId: string;
  campaignId: string;
  recipientId: string;
  testRecipientEmail: string;
  confirmation: string;
  initiatedBy?: string;
};

export type ProtectedTestEmailResult = {
  delivery: EmailDeliveryResponse;
  alreadyProcessed: boolean;
};

function nowIso(): string {
  return new Date().toISOString();
}

export { buildTestSendIdempotencyKey } from "@/features/outreach/protected-test-send-shared";

export async function sendProtectedTestEmail(
  repos: LocalRepositoryBundle,
  provider: EmailDeliveryProvider,
  input: ProtectedTestEmailInput
): Promise<ProtectedTestEmailResult> {
  if (input.confirmation !== "SEND TEST") {
    throw new PersistenceError("invalid_transition", "Protected test confirmation is required.");
  }

  const testRecipientEmail = normalizeEmail(input.testRecipientEmail);
  if (!isValidEmailSyntax(testRecipientEmail)) {
    throw new PersistenceError("invalid_transition", "A valid test recipient email is required.");
  }

  const campaign = await repos.campaigns.getById(input.tenantId, input.campaignId);
  if (!campaign) throw new PersistenceError("not_found", "Campaign not found.");

  const recipient = await repos.campaignRecipients.getById(input.tenantId, input.recipientId);
  if (!recipient || recipient.campaignId !== campaign.id) {
    throw new PersistenceError("not_found", "Campaign recipient not found.");
  }

  validateApprovedRecipient(recipient);

  const suppressed = await isEmailSuppressed(repos, input.tenantId, recipient.snapshotEmail);
  if (suppressed) {
    throw new PersistenceError("invalid_transition", "Approved recipient is suppressed.");
  }

  const idempotencyKey = buildTestSendIdempotencyKey(campaign.id, recipient, testRecipientEmail);
  const existing = await repos.outreachSendAttempts.getByIdempotencyKey(
    input.tenantId,
    idempotencyKey
  );
  if (existing) {
    return {
      alreadyProcessed: true,
      delivery: {
        provider: existing.provider,
        mode: existing.deliveryMode,
        status: "already_processed",
        providerMessageId: existing.providerMessageId,
        retryable: existing.retryable,
        errorCode: "already_processed",
        errorMessage: "A test send attempt for this approved content and destination already exists."
      }
    };
  }

  const startedAt = nowIso();
  const request = buildProtectedTestSendRequest({
    approvedContentHash: recipient.approvalContentHash!,
    campaignId: campaign.id,
    campaignRecipientId: recipient.id,
    html: recipient.personalizedHtml,
    idempotencyKey,
    initiatedBy: input.initiatedBy ?? "local-user",
    language: campaign.language || "pt-PT",
    leadId: recipient.leadId,
    plainText: recipient.personalizedPlainText,
    snapshotEmail: recipient.snapshotEmail,
    subject: recipient.personalizedSubject,
    tenantId: input.tenantId,
    toEmail: testRecipientEmail,
    toName: `${recipient.snapshotContactName || recipient.snapshotCompanyName} (test)`
  });
  const delivery = await provider.send(request);
  const completedAt = nowIso();

  await repos.outreachSendAttempts.create({
    actualDestinationEmail: testRecipientEmail,
    approvedContentHash: recipient.approvalContentHash!,
    campaignId: campaign.id,
    campaignRecipientId: recipient.id,
    completedAt,
    deliveryMode: delivery.mode,
    idempotencyKey,
    initiatedBy: request.initiatedBy,
    leadId: recipient.leadId,
    provider: delivery.provider,
    providerMessageId: delivery.providerMessageId,
    retryable: delivery.retryable,
    sanitizedErrorCode: delivery.errorCode,
    sanitizedErrorMessage: delivery.errorMessage,
    startedAt,
    status: mapAttemptStatus(delivery.status),
    tenantId: input.tenantId
  });

  await repos.activities.append(input.tenantId, {
    entityType: "campaign",
    entityId: campaign.id,
    action: "campaign_test_email_attempted",
    title: `Protected test email: ${recipient.snapshotCompanyName}`,
    metadata: {
      campaignRecipientId: recipient.id,
      deliveryMode: delivery.mode,
      provider: delivery.provider,
      status: delivery.status
    }
  });

  return { alreadyProcessed: false, delivery };
}

function validateApprovedRecipient(recipient: CampaignRecipient): void {
  if (recipient.draftStatus !== "APPROVED") {
    throw new PersistenceError("invalid_transition", "Recipient draft must be approved first.");
  }
  if (!recipient.approvalContentHash) {
    throw new PersistenceError("invalid_transition", "Recipient approval hash is missing.");
  }
  if (buildApprovalContentHash(recipient) !== recipient.approvalContentHash) {
    throw new PersistenceError("invalid_transition", "Approved content changed since approval.");
  }
}

function mapAttemptStatus(status: EmailDeliveryResponse["status"]): OutreachSendAttemptStatus {
  if (status === "accepted") return "TEST_SENT";
  if (status === "already_processed") return "TEST_ALREADY_PROCESSED";
  if (status === "blocked") return "TEST_BLOCKED";
  return "TEST_FAILED";
}
