import { randomUUID } from "node:crypto";
import {
  loadCanonicalOutlookSendContext,
  OutlookCanonicalSendError,
  toOutlookApprovedPayload
} from "@/features/outlook-graph/canonical-send";
import { mapClassificationToErrorCode } from "@/features/outlook-graph/classify-error";
import {
  isOutlookLiveSendAllowed,
  isOutlookTestRecipientAllowed,
  readOutlookGraphConfig
} from "@/features/outlook-graph/config";
import type { OutlookGraphEmailProvider } from "@/features/outlook-graph/outlook-graph-provider";
import { appendOutlookAuditEvent } from "@/features/outlook-graph/outlook-audit";
import {
  buildOutlookDurableIdempotencyKey,
  isBlockingOutlookAttemptStatus,
  type OutlookDurableSendAttemptStore
} from "@/features/outlook-graph/durable-send-attempt-store";
import { ensureOutlookSendRecoveryOnStartup } from "@/features/outlook-graph/send-recovery";
import type { OutlookSendServerDependencies } from "@/features/outlook-graph/server-dependencies";
import type { TrustedSendJobActorContext } from "@/features/email-delivery/send-job-actor-context";
import type { OutlookDurableSendAttemptStatus } from "@/domain/outlook-send-types";
import {
  OUTLOOK_DURABLE_PROVIDER,
  OUTLOOK_ORGANIC_SESSION_CONFIRMATION,
  OUTLOOK_TEST_SEND_CONFIRMATION
} from "@/domain/outlook-send-types";
import type { OutlookSendResult } from "@/features/outlook-graph/types";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";
import type { CampaignRecipient } from "@/domain/campaign-types";
import { loadSenderContext } from "@/application/campaign-sender-context";
import { evaluateRecipientApproval } from "@/application/campaign-approval-service";
import { loadCachedTokens } from "@/features/outlook-graph/token-service";

export class OutlookSendServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
    public readonly details?: Record<string, string | null>
  ) {
    super(message);
    this.name = "OutlookSendServiceError";
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function mapGraphResultToAttemptStatus(result: OutlookSendResult): OutlookDurableSendAttemptStatus {
  switch (result.classification) {
    case "accepted":
      return "accepted";
    case "throttled":
      return "throttled";
    case "uncertain":
      return "uncertain";
    case "reconnect_required":
      return "reconnect_required";
    case "temporary_provider_failure":
      return "temporary_failure";
    case "blocked":
    case "permission_failure":
    case "permanent_request_failure":
      return "permanent_failure";
    default: {
      const _exhaustive: never = result.classification;
      return _exhaustive;
    }
  }
}

async function persistAttemptResult(
  store: OutlookDurableSendAttemptStore,
  tenantId: string,
  attemptId: string,
  result: OutlookSendResult
): Promise<void> {
  const status = mapGraphResultToAttemptStatus(result);
  const timestamp = nowIso();
  await store.update(tenantId, attemptId, {
    acceptedAt: status === "accepted" ? timestamp : null,
    failedAt:
      status === "permanent_failure" ||
      status === "temporary_failure" ||
      status === "reconnect_required"
        ? timestamp
        : null,
    httpStatus: result.httpStatus,
    providerMessageId: result.providerMessageId,
    retryable: result.retryable,
    sanitizedErrorCode: mapClassificationToErrorCode(result.classification),
    sanitizedErrorMessage: result.errorMessage,
    status,
    uncertainAt: status === "uncertain" ? timestamp : null
  });
}

async function auditAttemptOutcome(
  repos: LocalRepositoryBundle,
  tenantId: string,
  campaignId: string,
  attemptId: string,
  status: OutlookDurableSendAttemptStatus
): Promise<void> {
  const actionByStatus: Partial<Record<OutlookDurableSendAttemptStatus, Parameters<typeof appendOutlookAuditEvent>[2]>> =
    {
      accepted: "outlook_send_attempt_accepted",
      permanent_failure: "outlook_send_attempt_failed",
      temporary_failure: "outlook_send_attempt_failed",
      throttled: "outlook_send_attempt_throttled",
      uncertain: "outlook_send_attempt_uncertain"
    };
  const action = actionByStatus[status];
  if (!action) return;
  await appendOutlookAuditEvent(repos, tenantId, action, campaignId, `Outlook send attempt ${status}`, {
    attemptId,
    status
  });
}

export type OutlookTestSendCommand = {
  campaignId: string;
  recipientId: string;
  confirmation: string;
};

export type OutlookTestSendResult = {
  attemptId: string;
  result: OutlookSendResult;
  acceptedByGraph: boolean;
  deliveryNote: string | null;
  blockedByExistingAttempt: boolean;
};

export async function executeOutlookTestSend(
  deps: OutlookSendServerDependencies,
  actor: TrustedSendJobActorContext,
  command: OutlookTestSendCommand
): Promise<OutlookTestSendResult> {
  await ensureOutlookSendRecoveryOnStartup(deps.attemptStore);

  if (command.confirmation !== OUTLOOK_TEST_SEND_CONFIRMATION) {
    throw new OutlookSendServiceError("confirmation_required", "Confirmation required.");
  }
  if (!isOutlookLiveSendAllowed(deps.config)) {
    throw new OutlookSendServiceError(
      "live_send_disabled",
      "Live send disabled.",
      403
    );
  }

  if (!command.campaignId || !command.recipientId) {
    throw new OutlookSendServiceError("bad_request", "campaignId and recipientId are required.");
  }

  let context: Awaited<ReturnType<typeof loadCanonicalOutlookSendContext>>;
  try {
    context = await loadCanonicalOutlookSendContext(
      deps.repos,
      actor.tenantId,
      command.campaignId,
      command.recipientId,
      {
        attemptStore: deps.attemptStore,
        outlookConfig: deps.config,
        requireTestRecipientAllowlist: true,
        testRecipientAllowlist: deps.config.testRecipients
      }
    );
  } catch (error) {
    if (error instanceof OutlookCanonicalSendError && error.code === "duplicate_blocked") {
      const recipient = await deps.repos.campaignRecipients.getById(actor.tenantId, command.recipientId);
      const hash = recipient?.approvalContentHash ?? "";
      const idempotencyKey = buildOutlookDurableIdempotencyKey(
        command.campaignId,
        command.recipientId,
        hash
      );
      const existing = await deps.attemptStore.getByIdempotencyKey(actor.tenantId, idempotencyKey);
      return {
        acceptedByGraph: existing?.status === "accepted",
        attemptId: existing?.id ?? "",
        blockedByExistingAttempt: true,
        deliveryNote:
          existing?.status === "accepted"
            ? "HTTP 202 means accepted by Microsoft Graph, not confirmed delivery."
            : null,
        result: {
          classification:
            existing?.status === "accepted"
              ? "accepted"
              : existing?.status === "uncertain"
                ? "uncertain"
                : "blocked",
          errorMessage: "Duplicate send blocked by durable attempt.",
          httpStatus: existing?.httpStatus ?? null,
          providerMessageId: existing?.providerMessageId ?? null,
          retryable: false
        }
      };
    }
    throw mapCanonicalError(error);
  }

  if (!isOutlookTestRecipientAllowed(deps.config, context.recipientEmail)) {
    throw new OutlookSendServiceError(
      "recipient_not_allowed",
      "Recipient not in test allowlist.",
      403
    );
  }

  return submitCanonicalOutlookSend(deps, actor, context);
}

async function submitCanonicalOutlookSend(
  deps: OutlookSendServerDependencies,
  actor: TrustedSendJobActorContext,
  context: Awaited<ReturnType<typeof loadCanonicalOutlookSendContext>>
): Promise<OutlookTestSendResult> {
  const attemptId = randomUUID();
  const createdAt = nowIso();

  const { attempt, created } = await deps.attemptStore.createSubmitting({
    approvedDraftVersion: context.approvedDraftVersion,
    campaignId: context.campaign.id,
    campaignRecipientId: context.recipient.id,
    createdAt,
    failedAt: null,
    httpStatus: null,
    idempotencyKey: context.idempotencyKey,
    initiatedBy: actor.userId,
    provider: OUTLOOK_DURABLE_PROVIDER,
    providerMessageId: null,
    retryable: false,
    sanitizedErrorCode: null,
    sanitizedErrorMessage: null,
    status: "submitting",
    submittingAt: createdAt,
    acceptedAt: null,
    uncertainAt: null,
    cancelledAt: null,
    tenantId: actor.tenantId
  });

  if (!created && isBlockingOutlookAttemptStatus(attempt.status)) {
    return {
      acceptedByGraph: attempt.status === "accepted",
      attemptId: attempt.id,
      blockedByExistingAttempt: true,
      deliveryNote:
        attempt.status === "accepted"
          ? "HTTP 202 means accepted by Microsoft Graph, not confirmed delivery."
          : null,
      result: {
        classification:
          attempt.status === "accepted"
            ? "accepted"
            : attempt.status === "uncertain"
              ? "uncertain"
              : "blocked",
        errorMessage: "Duplicate send blocked by durable attempt.",
        httpStatus: attempt.httpStatus,
        providerMessageId: attempt.providerMessageId,
        retryable: false
      }
    };
  }

  await appendOutlookAuditEvent(
    deps.repos,
    actor.tenantId,
    "outlook_send_attempt_created",
    context.campaign.id,
    "Outlook send attempt created",
    {
      attemptId: attempt.id,
      campaignRecipientId: context.recipient.id,
      status: "submitting"
    }
  );

  const payload = toOutlookApprovedPayload(attempt.id, context);
  const result = await deps.provider.sendApprovedMessage(payload);
  await persistAttemptResult(deps.attemptStore, actor.tenantId, attempt.id, result);
  await auditAttemptOutcome(deps.repos, actor.tenantId, context.campaign.id, attempt.id, mapGraphResultToAttemptStatus(result));

  return {
    acceptedByGraph: result.classification === "accepted",
    attemptId: attempt.id,
    blockedByExistingAttempt: false,
    deliveryNote:
      result.classification === "accepted"
        ? "HTTP 202 means accepted by Microsoft Graph, not confirmed delivery."
        : null,
    result
  };
}

export { submitCanonicalOutlookSend };

export async function selectOrganicEligibleRecipients(
  deps: OutlookSendServerDependencies,
  actor: TrustedSendJobActorContext,
  campaignId: string,
  requestedMaximum: number
): Promise<CampaignRecipient[]> {
  await ensureOutlookSendRecoveryOnStartup(deps.attemptStore);

  const campaign = await deps.repos.campaigns.getById(actor.tenantId, campaignId);
  if (!campaign) {
    throw new OutlookSendServiceError("not_found", "Campaign not found.", 404);
  }

  const cachedTokens = await loadCachedTokens(deps.config);
  const connectedMailbox = (cachedTokens?.mailboxAddress ?? "").trim().toLowerCase();
  const senderContext = await loadSenderContext(deps.repos, actor.tenantId, campaign);
  const expectedSender = (senderContext.sender.fromEmail || senderContext.sender.replyToEmail)
    .trim()
    .toLowerCase();

  const recipients = await deps.repos.campaignRecipients.listForCampaign(actor.tenantId, campaignId);
  const eligible: CampaignRecipient[] = [];

  for (const recipient of recipients) {
    if (eligible.length >= requestedMaximum) break;
    if (recipient.draftStatus !== "APPROVED" || recipient.sentAt) continue;

    const approval = await evaluateRecipientApproval(
      deps.repos,
      actor.tenantId,
      campaign,
      recipient,
      senderContext
    );
    if (!approval.canApprove) continue;

    const approvedDraftVersion = recipient.approvalContentHash;
    if (!approvedDraftVersion) continue;

    const idempotencyKey = buildOutlookDurableIdempotencyKey(
      campaignId,
      recipient.id,
      approvedDraftVersion
    );
    const existing = await deps.attemptStore.getByIdempotencyKey(actor.tenantId, idempotencyKey);
    if (existing && isBlockingOutlookAttemptStatus(existing.status)) continue;

    if (!connectedMailbox || !expectedSender || connectedMailbox !== expectedSender) continue;

    eligible.push(recipient);
  }

  return eligible;
}

export function mapCanonicalError(error: unknown): OutlookSendServiceError {
  if (error instanceof OutlookSendServiceError) return error;
  if (error instanceof OutlookCanonicalSendError) {
    const status =
      error.code === "not_found"
        ? 404
        : error.code === "recipient_not_allowed"
          ? 403
          : error.code === "mailbox_mismatch"
            ? 409
            : error.code === "duplicate_blocked"
              ? 409
              : 400;
    return new OutlookSendServiceError(error.code, error.message, status, error.details);
  }
  if (error instanceof Error) {
    return new OutlookSendServiceError("internal_error", error.message, 500);
  }
  return new OutlookSendServiceError("internal_error", "Unexpected Outlook send error.", 500);
}

export { OUTLOOK_ORGANIC_SESSION_CONFIRMATION, OUTLOOK_TEST_SEND_CONFIRMATION };
