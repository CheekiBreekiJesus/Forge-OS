import {
  EMAIL_DELIVERY_SELF_TEST_SENTINEL,
  buildSelfTestIdempotencyKey
} from "@/application/email-delivery-self-test-service";
import type {
  EmailDeliverySelfTestResult,
  OutreachSendAttemptStatus
} from "@/domain/email-delivery-types";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";

export async function persistEmailDeliverySelfTestResult(
  repos: LocalRepositoryBundle,
  tenantId: string,
  input: {
    recipientEmail: string;
    subject: string;
    messageBody: string;
    initiatedBy: string;
  },
  result: EmailDeliverySelfTestResult
): Promise<void> {
  const startedAt = new Date().toISOString();
  const completedAt = new Date().toISOString();
  const idempotencyKey =
    result.idempotencyKey ??
    buildSelfTestIdempotencyKey(input.recipientEmail, input.subject, input.messageBody);

  const attempt = await repos.outreachSendAttempts.create({
    actualDestinationEmail: input.recipientEmail.trim().toLowerCase(),
    approvedContentHash: idempotencyKey,
    campaignId: EMAIL_DELIVERY_SELF_TEST_SENTINEL,
    campaignRecipientId: EMAIL_DELIVERY_SELF_TEST_SENTINEL,
    completedAt,
    deliveryMode: "delivery_self_test",
    idempotencyKey,
    initiatedBy: input.initiatedBy,
    leadId: EMAIL_DELIVERY_SELF_TEST_SENTINEL,
    provider: result.provider,
    providerMessageId: result.providerMessageId,
    retryable: result.retryable,
    sanitizedErrorCode: result.errorCode,
    sanitizedErrorMessage: result.errorMessage,
    startedAt,
    status: mapAttemptStatus(result.status),
    tenantId
  });

  await repos.outreachProviderEvents.create({
    campaignId: null,
    campaignRecipientId: null,
    duplicate: false,
    effect: result.status === "accepted" ? "none" : "marked_failed",
    errorMessage: result.errorMessage,
    eventFingerprint: `self-test:${idempotencyKey}:${result.status}`,
    eventType: result.status === "accepted" ? "sent" : "failed",
    leadId: null,
    normalizedEmail: input.recipientEmail.trim().toLowerCase(),
    occurredAt: completedAt,
    processingStatus: result.status === "accepted" ? "processed" : "failed",
    provider: result.provider,
    providerEventId: null,
    providerMessageId: result.providerMessageId,
    receivedAt: completedAt,
    sanitizedMetadata: {
      errorCode: result.errorCode,
      mode: "delivery_self_test",
      retryable: result.retryable,
      subjectPresent: Boolean(input.subject.trim())
    },
    sendAttemptId: attempt.id,
    tenantId
  });
}

function mapAttemptStatus(status: EmailDeliverySelfTestResult["status"]): OutreachSendAttemptStatus {
  if (status === "accepted") return "TEST_SENT";
  if (status === "already_processed") return "TEST_ALREADY_PROCESSED";
  if (status === "blocked") return "TEST_BLOCKED";
  return "TEST_FAILED";
}
