import { buildApprovalContentHash } from "@/application/campaign-approval-service";
import type { CampaignRecipient, OutreachCampaign } from "@/domain/campaign-types";
import type {
  EmailDeliveryResponse,
  EmailProviderDiagnostic,
  OutreachSendAttemptStatus
} from "@/domain/email-delivery-types";
import {
  buildTestSendIdempotencyKey,
  PROTECTED_TEST_SEND_CONFIRMATION
} from "@/features/outreach/protected-test-send-shared";
import { sendProtectedTestEmailViaApi } from "@/features/outreach/protected-test-send-client";
import { isValidEmailSyntax, normalizeEmail } from "@/features/leadops/import-normalization";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";

export type ProtectedTestSendFlowInput = {
  campaign: OutreachCampaign;
  recipient: CampaignRecipient;
  tenantId: string;
  testRecipientEmail: string;
  confirmation: string;
  initiatedBy?: string;
};

export type ProtectedTestSendFlowResult =
  | { ok: true; alreadyProcessed: boolean; delivery: EmailDeliveryResponse }
  | { ok: false; errorCode: string; message: string };

export async function fetchEmailProviderDiagnostic(): Promise<EmailProviderDiagnostic | null> {
  const response = await fetch("/api/leadops/email-provider/diagnostic");
  if (!response.ok) return null;
  return (await response.json()) as EmailProviderDiagnostic;
}

export function isProtectedTestSendReady(diagnostic: EmailProviderDiagnostic | null): boolean {
  if (!diagnostic) return false;
  return (
    diagnostic.provider === "brevo" &&
    diagnostic.configured &&
    diagnostic.testSendEnabled &&
    diagnostic.allowlistConfigured
  );
}

export async function executeProtectedTestSendFlow(
  repos: LocalRepositoryBundle,
  input: ProtectedTestSendFlowInput
): Promise<ProtectedTestSendFlowResult> {
  if (input.confirmation !== PROTECTED_TEST_SEND_CONFIRMATION) {
    return { ok: false, errorCode: "invalid_confirmation", message: "Protected test confirmation is required." };
  }

  const testRecipientEmail = normalizeEmail(input.testRecipientEmail);
  if (!isValidEmailSyntax(testRecipientEmail)) {
    return { ok: false, errorCode: "invalid_email", message: "A valid test recipient email is required." };
  }

  if (input.recipient.draftStatus !== "APPROVED") {
    return { ok: false, errorCode: "not_approved", message: "Recipient draft must be approved first." };
  }

  if (!input.recipient.approvalContentHash) {
    return { ok: false, errorCode: "not_approved", message: "Recipient approval hash is missing." };
  }

  if (buildApprovalContentHash(input.recipient) !== input.recipient.approvalContentHash) {
    return { ok: false, errorCode: "approval_stale", message: "Approved content changed since approval." };
  }

  const idempotencyKey = buildTestSendIdempotencyKey(
    input.campaign.id,
    input.recipient,
    testRecipientEmail
  );
  const existing = await repos.outreachSendAttempts.getByIdempotencyKey(input.tenantId, idempotencyKey);
  if (existing) {
    return {
      ok: true,
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

  const initiatedBy = input.initiatedBy ?? "local-user";
  const toName = `${input.recipient.snapshotContactName || input.recipient.snapshotCompanyName} (test)`;
  const { response, result } = await sendProtectedTestEmailViaApi({
    approvedContentHash: input.recipient.approvalContentHash,
    campaignId: input.campaign.id,
    campaignRecipientId: input.recipient.id,
    confirmation: PROTECTED_TEST_SEND_CONFIRMATION,
    html: input.recipient.personalizedHtml,
    idempotencyKey,
    initiatedBy,
    language: input.campaign.language || "pt-PT",
    leadId: input.recipient.leadId,
    mode: "provider_test",
    plainText: input.recipient.personalizedPlainText,
    snapshotEmail: input.recipient.snapshotEmail,
    subject: input.recipient.personalizedSubject,
    tenantId: input.tenantId,
    toEmail: testRecipientEmail,
    toName
  });

  if (!response.ok && result.status !== "blocked" && result.status !== "already_processed") {
    return {
      ok: false,
      errorCode: result.errorCode ?? "provider_error",
      message: result.errorMessage ?? "Protected test send failed."
    };
  }

  const startedAt = new Date().toISOString();
  await repos.outreachSendAttempts.create({
    actualDestinationEmail: testRecipientEmail,
    approvedContentHash: input.recipient.approvalContentHash,
    campaignId: input.campaign.id,
    campaignRecipientId: input.recipient.id,
    completedAt: new Date().toISOString(),
    deliveryMode: result.mode,
    idempotencyKey,
    initiatedBy,
    leadId: input.recipient.leadId,
    provider: result.provider,
    providerMessageId: result.providerMessageId,
    retryable: result.retryable,
    sanitizedErrorCode: result.errorCode,
    sanitizedErrorMessage: result.errorMessage,
    startedAt,
    status: mapAttemptStatus(result.status),
    tenantId: input.tenantId
  });

  await repos.activities.append(input.tenantId, {
    entityType: "campaign",
    entityId: input.campaign.id,
    action: "campaign_test_email_attempted",
    title: `Protected test email: ${input.recipient.snapshotCompanyName}`,
    metadata: {
      campaignRecipientId: input.recipient.id,
      deliveryMode: result.mode,
      provider: result.provider,
      status: result.status
    }
  });

  return { ok: true, alreadyProcessed: result.status === "already_processed", delivery: result };
}

function mapAttemptStatus(status: EmailDeliveryResponse["status"]): OutreachSendAttemptStatus {
  if (status === "accepted") return "TEST_SENT";
  if (status === "already_processed") return "TEST_ALREADY_PROCESSED";
  if (status === "blocked") return "TEST_BLOCKED";
  return "TEST_FAILED";
}
