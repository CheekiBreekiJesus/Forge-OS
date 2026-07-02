import { buildApprovalContentHash } from "@/application/campaign-approval-service";
import { loadSenderContext } from "@/application/campaign-sender-context";
import { isEmailSuppressed } from "@/application/suppression-service";
import type { EmailDeliveryRequest, EmailDeliveryResponse } from "@/domain/email-delivery-types";
import type {
  OutreachSendJob,
  OutreachSendJobAttemptStatus,
  OutreachSendJobRecipient,
  ProcessBatchInput,
  ProcessBatchResult,
  QueueSendJobInput,
  SendJobDeliveryProvider,
  SendJobEligibilityResult,
  SendJobEligibleRecipient,
  SendJobExclusionReason
} from "@/domain/send-job-types";
import { isValidEmailSyntax, normalizeEmail } from "@/features/leadops/import-normalization";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";
import { PersistenceError } from "@/persistence/interfaces";

const DEFAULT_BATCH_SIZE = 5;
const DEFAULT_DAILY_LIMIT = 25;
const DEFAULT_MAX_RETRIES = 2;
const LOCK_TTL_MS = 60_000;
const TERMINAL_JOB_STATUSES = new Set(["COMPLETED", "FAILED", "CANCELLED"]);
const RETRYABLE_CODES = new Set(["timeout", "rate_limited", "provider_unavailable", "network_error"]);

function nowIso(): string {
  return new Date().toISOString();
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function clampNumber(value: number | undefined, fallback: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.trunc(value!), min), max);
}

function buildCampaignSendIdempotencyKey(input: {
  tenantId: string;
  campaignId: string;
  campaignRecipientId: string;
  approvedContentVersion: string;
  deliveryMode: string;
}): string {
  return [
    "campaign-send",
    input.tenantId,
    input.campaignId,
    input.campaignRecipientId,
    input.approvedContentVersion,
    input.deliveryMode
  ].join(":");
}

export async function evaluateCampaignQueueEligibility(
  repos: LocalRepositoryBundle,
  input: Omit<QueueSendJobInput, "confirmation">
): Promise<SendJobEligibilityResult> {
  const provider = input.provider ?? "simulation";
  const deliveryMode = input.deliveryMode ?? "simulation";
  const campaign = await repos.campaigns.getById(input.tenantId, input.campaignId);
  if (!campaign) throw new PersistenceError("not_found", "Campaign not found.");

  const recipients = await repos.campaignRecipients.listForCampaign(input.tenantId, campaign.id);
  const senderContext = await loadSenderContext(repos, input.tenantId, campaign);
  const providerReady =
    provider === "simulation" ||
    (process.env.OUTREACH_REAL_SEND_ENABLED === "true" &&
      Boolean(process.env.BREVO_API_KEY) &&
      Boolean(process.env.BREVO_SENDER_EMAIL) &&
      Boolean(process.env.BREVO_SENDER_NAME));
  const unsubscribeReady =
    deliveryMode === "simulation" ||
    (Boolean(process.env.FORGEOS_PUBLIC_BASE_URL) &&
      (process.env.OUTREACH_UNSUBSCRIBE_SECRET?.length ?? 0) >= 32);

  const eligibleRecipients: SendJobEligibleRecipient[] = [];
  const excludedRecipients: SendJobEligibilityResult["excludedRecipients"] = [];
  const suppressedRecipients: SendJobEligibilityResult["suppressedRecipients"] = [];
  const invalidRecipients: SendJobEligibilityResult["invalidRecipients"] = [];
  const staleApprovalRecipients: SendJobEligibilityResult["staleApprovalRecipients"] = [];
  const alreadySentRecipients: SendJobEligibilityResult["alreadySentRecipients"] = [];
  const duplicateRecipients: SendJobEligibilityResult["duplicateRecipients"] = [];
  const otherExcludedRecipients: SendJobEligibilityResult["otherExcludedRecipients"] = [];
  const seenEmails = new Set<string>();

  for (const recipient of recipients) {
    const normalizedEmail = normalizeEmail(recipient.snapshotEmail);
    const base = {
      campaignRecipientId: recipient.id,
      email: normalizedEmail,
      leadId: recipient.leadId
    };
    const push = (reason: SendJobExclusionReason) => {
      const row = { ...base, reason };
      excludedRecipients.push(row);
      if (reason === "suppressed") suppressedRecipients.push(row);
      else if (reason === "missing_email" || reason === "invalid_email") invalidRecipients.push(row);
      else if (reason === "approval_stale") staleApprovalRecipients.push(row);
      else if (reason === "already_sent") alreadySentRecipients.push(row);
      else if (reason === "duplicate_email") duplicateRecipients.push(row);
      else otherExcludedRecipients.push(row);
    };

    if (campaign.status === "cancelled" || campaign.status === "completed") {
      push("campaign_terminal");
      continue;
    }
    if (campaign.status !== "approved") {
      push("campaign_not_approved");
      continue;
    }
    if (recipient.status !== "included") {
      push("recipient_not_included");
      continue;
    }
    if (recipient.draftStatus !== "APPROVED") {
      push("recipient_not_approved");
      continue;
    }
    if (!normalizedEmail) {
      push("missing_email");
      continue;
    }
    if (!isValidEmailSyntax(normalizedEmail)) {
      push("invalid_email");
      continue;
    }
    if (await isEmailSuppressed(repos, input.tenantId, normalizedEmail)) {
      push("suppressed");
      continue;
    }
    if (!recipient.approvalContentHash || buildApprovalContentHash(recipient) !== recipient.approvalContentHash) {
      push("approval_stale");
      continue;
    }
    if (recipient.sentAt) {
      push("already_sent");
      continue;
    }
    if (seenEmails.has(normalizedEmail)) {
      push("duplicate_email");
      continue;
    }
    if (!providerReady) {
      push("provider_not_ready");
      continue;
    }
    if (!unsubscribeReady) {
      push("unsubscribe_not_ready");
      continue;
    }
    const approvedContentVersion = recipient.approvalContentHash;
    eligibleRecipients.push({
      approvedContentVersion,
      campaignRecipientId: recipient.id,
      contactId: recipient.contactId,
      idempotencyKey: buildCampaignSendIdempotencyKey({
        approvedContentVersion,
        campaignId: campaign.id,
        campaignRecipientId: recipient.id,
        deliveryMode,
        tenantId: input.tenantId
      }),
      leadId: recipient.leadId,
      normalizedEmail
    });
    seenEmails.add(normalizedEmail);
  }

  const reasons = Array.from(new Set(excludedRecipients.map((row) => row.reason)));
  if (!senderContext.ready) reasons.push("provider_not_ready");

  return {
    alreadySentRecipients,
    approvedRecipients: recipients.filter((row) => row.draftStatus === "APPROVED").length,
    campaignId: campaign.id,
    canQueue:
      campaign.status === "approved" &&
      senderContext.ready &&
      providerReady &&
      unsubscribeReady &&
      eligibleRecipients.length > 0,
    deliveryMode,
    duplicateRecipients,
    eligibleRecipients,
    excludedRecipients,
    invalidRecipients,
    otherExcludedRecipients,
    provider,
    providerReady,
    reasons,
    senderReady: senderContext.ready,
    staleApprovalRecipients,
    suppressedRecipients,
    totalSnapshotRecipients: recipients.length,
    unsubscribeReady
  };
}

export async function queueCampaignSendJob(
  repos: LocalRepositoryBundle,
  input: QueueSendJobInput
): Promise<{ job: OutreachSendJob; eligibility: SendJobEligibilityResult; alreadyQueued: boolean }> {
  const provider = input.provider ?? "simulation";
  const deliveryMode = input.deliveryMode ?? "simulation";
  const expectedConfirmation = deliveryMode === "brevo" ? "QUEUE BREVO" : "QUEUE SIMULATION";
  if (input.confirmation !== expectedConfirmation) {
    throw new PersistenceError("invalid_transition", "Explicit queue confirmation is required.");
  }

  const existing = await repos.outreachSendJobs.findActiveForCampaign(input.tenantId, input.campaignId, deliveryMode);
  const eligibility = await evaluateCampaignQueueEligibility(repos, {
    ...input,
    deliveryMode,
    provider
  });
  if (existing) return { alreadyQueued: true, eligibility, job: existing };
  if (!eligibility.canQueue) {
    throw new PersistenceError("invalid_transition", `Campaign is not queueable: ${eligibility.reasons.join(", ")}`);
  }

  const timestamp = nowIso();
  const job = await repos.outreachSendJobs.create({
    approvedBy: input.actorId ?? "local-user",
    batchSize: clampNumber(input.batchSize, DEFAULT_BATCH_SIZE, 1, 100),
    campaignId: input.campaignId,
    cancelledAt: null,
    cancelledBy: null,
    cancelReason: null,
    completedAt: null,
    createdAt: timestamp,
    createdBy: input.actorId ?? "local-user",
    dailyLimit: clampNumber(input.dailyLimit, DEFAULT_DAILY_LIMIT, 0, 1000),
    delayMs: clampNumber(input.delayMs, 0, 0, 5000),
    deliveryMode,
    lastProcessedAt: null,
    lastStopReason: null,
    maxRetries: clampNumber(input.maxRetries, DEFAULT_MAX_RETRIES, 0, 10),
    pausedAt: null,
    pausedBy: null,
    pauseReason: null,
    provider,
    queuedAt: timestamp,
    remainingCount: eligibility.eligibleRecipients.length,
    resumedAt: null,
    resumedBy: null,
    startedAt: null,
    status: "QUEUED",
    tenantId: input.tenantId
  });

  await repos.outreachSendJobRecipients.createMany(
    eligibility.eligibleRecipients.map((recipient) => ({
      approvedContentVersion: recipient.approvedContentVersion,
      attemptCount: 0,
      campaignId: input.campaignId,
      campaignRecipientId: recipient.campaignRecipientId,
      completedAt: null,
      contactId: recipient.contactId,
      createdAt: timestamp,
      idempotencyKey: recipient.idempotencyKey,
      lastErrorCode: null,
      lastErrorMessage: null,
      leadId: recipient.leadId,
      nextAttemptAt: null,
      normalizedEmail: recipient.normalizedEmail,
      processingStartedAt: null,
      providerMessageId: null,
      queuedAt: timestamp,
      sendJobId: job.id,
      sentAt: null,
      status: "QUEUED",
      tenantId: input.tenantId,
      updatedAt: timestamp
    }))
  );

  await repos.activities.append(input.tenantId, {
    action: "send_job_created",
    entityId: input.campaignId,
    entityType: "campaign",
    metadata: {
      deliveryMode,
      eligibleRecipients: eligibility.eligibleRecipients.length,
      provider,
      sendJobId: job.id
    },
    title: `Send job created: ${input.campaignId}`
  });
  return { alreadyQueued: false, eligibility, job };
}

export async function processNextCampaignBatch(
  repos: LocalRepositoryBundle,
  provider: SendJobDeliveryProvider,
  input: ProcessBatchInput
): Promise<ProcessBatchResult> {
  const owner = `${input.actorId ?? "local-user"}:${crypto.randomUUID()}`;
  const now = nowIso();
  const expiresAt = new Date(Date.now() + (input.lockTtlMs ?? LOCK_TTL_MS)).toISOString();
  const locked = await repos.outreachSendJobs.acquireLock(input.tenantId, input.sendJobId, owner, expiresAt, now);
  if (!locked) {
    const job = await repos.outreachSendJobs.getById(input.tenantId, input.sendJobId);
    if (!job) throw new PersistenceError("not_found", "Send job not found.");
    return emptyResult(job, "lock_busy");
  }

  try {
    let job = await repos.outreachSendJobs.getById(input.tenantId, input.sendJobId);
    if (!job) throw new PersistenceError("not_found", "Send job not found.");

    if (job.status === "PAUSED") return emptyResult(job, "paused");
    if (job.status === "CANCELLED") return emptyResult(job, "cancelled");
    if (job.status === "COMPLETED") return emptyResult(job, "completed");
    if (TERMINAL_JOB_STATUSES.has(job.status)) return emptyResult(job, "completed");

    const diagnostic = provider.diagnostic();
    if (job.deliveryMode === "brevo" && (!diagnostic.configured || !diagnostic.realSendEnabled)) {
      job = await repos.outreachSendJobs.update(input.tenantId, job.id, {
        lastStopReason: "provider_invalid",
        status: "QUEUED"
      });
      return emptyResult(job, "provider_invalid");
    }

    if (job.deliveryMode === "brevo" && job.dailyLimit > 0) {
      const usage = await repos.outreachSendJobDailyUsage.get(input.tenantId, "brevo", todayIsoDate());
      if ((usage?.realSendCount ?? 0) >= job.dailyLimit) {
        job = await repos.outreachSendJobs.update(input.tenantId, job.id, {
          lastStopReason: "daily_limit_reached",
          status: "QUEUED"
        });
        return emptyResult(job, "daily_limit_reached");
      }
    }

    job = await repos.outreachSendJobs.update(input.tenantId, job.id, {
      lastStopReason: null,
      startedAt: job.startedAt ?? now,
      status: "PROCESSING"
    });

    const recipients = await repos.outreachSendJobRecipients.listForJob(input.tenantId, job.id);
    const processable = recipients
      .filter((recipient) => recipient.status === "QUEUED" || recipient.status === "RETRY_PENDING")
      .filter((recipient) => !recipient.nextAttemptAt || recipient.nextAttemptAt <= now)
      .slice(0, job.batchSize);

    if (processable.length === 0) {
      const completed = await refreshJobCounters(repos, input.tenantId, job.id, true);
      return emptyResult(completed, completed.status === "COMPLETED" ? "completed" : "nothing_to_process");
    }

    let sent = 0;
    let failed = 0;
    let retryPending = 0;
    let suppressed = 0;
    let skipped = 0;

    for (const jobRecipient of processable) {
      const result = await processOneRecipient(repos, provider, job, jobRecipient, input.actorId ?? "local-user");
      if (result === "sent") sent += 1;
      else if (result === "failed") failed += 1;
      else if (result === "retry") retryPending += 1;
      else if (result === "suppressed") suppressed += 1;
      else skipped += 1;
    }

    const updated = await refreshJobCounters(repos, input.tenantId, job.id, true);
    return {
      failed,
      job: updated,
      processed: processable.length,
      retryPending,
      sent,
      skipped,
      stopReason: "processed_batch",
      suppressed
    };
  } finally {
    await repos.outreachSendJobs.releaseLock(input.tenantId, input.sendJobId, owner);
  }
}

async function processOneRecipient(
  repos: LocalRepositoryBundle,
  provider: SendJobDeliveryProvider,
  job: OutreachSendJob,
  jobRecipient: OutreachSendJobRecipient,
  actorId: string
): Promise<"sent" | "failed" | "retry" | "suppressed" | "skipped"> {
  const timestamp = nowIso();
  const campaign = await repos.campaigns.getById(job.tenantId, job.campaignId);
  const recipient = await repos.campaignRecipients.getById(job.tenantId, jobRecipient.campaignRecipientId);
  if (!campaign || !recipient || campaign.status === "cancelled" || campaign.status === "completed") {
    await repos.outreachSendJobRecipients.update(job.tenantId, jobRecipient.id, {
      completedAt: timestamp,
      lastErrorCode: "invalid_request",
      lastErrorMessage: "Campaign or recipient is no longer available.",
      status: "SKIPPED"
    });
    return "skipped";
  }
  if (await isEmailSuppressed(repos, job.tenantId, jobRecipient.normalizedEmail)) {
    await repos.outreachSendJobRecipients.update(job.tenantId, jobRecipient.id, {
      completedAt: timestamp,
      status: "SUPPRESSED"
    });
    await repos.activities.append(job.tenantId, {
      action: "recipient_suppressed_before_send",
      entityId: job.campaignId,
      entityType: "campaign",
      metadata: { campaignRecipientId: recipient.id, sendJobId: job.id },
      title: `Recipient suppressed before send: ${recipient.snapshotCompanyName}`
    });
    return "suppressed";
  }
  if (
    recipient.draftStatus !== "APPROVED" ||
    !recipient.approvalContentHash ||
    recipient.approvalContentHash !== jobRecipient.approvedContentVersion ||
    buildApprovalContentHash(recipient) !== recipient.approvalContentHash
  ) {
    await repos.outreachSendJobRecipients.update(job.tenantId, jobRecipient.id, {
      completedAt: timestamp,
      lastErrorCode: "invalid_request",
      lastErrorMessage: "Approved content is stale.",
      status: "SKIPPED"
    });
    return "skipped";
  }

  const existingAttempt = await repos.outreachSendJobAttempts.getByIdempotencyKey(job.tenantId, jobRecipient.idempotencyKey);
  if (existingAttempt?.status === "ACCEPTED") {
    await repos.outreachSendJobRecipients.update(job.tenantId, jobRecipient.id, {
      completedAt: existingAttempt.completedAt,
      providerMessageId: existingAttempt.providerMessageId,
      sentAt: existingAttempt.completedAt,
      status: "SENT"
    });
    return "sent";
  }

  await repos.outreachSendJobRecipients.update(job.tenantId, jobRecipient.id, {
    processingStartedAt: timestamp,
    status: "PROCESSING"
  });

  const startedAt = nowIso();
  const response = await provider.send(buildDeliveryRequest(job, recipient, jobRecipient, actorId));
  const completedAt = nowIso();
  const attemptNumber = jobRecipient.attemptCount + 1;
  const attemptStatus = mapAttemptStatus(response);
  await repos.outreachSendJobAttempts.create({
    attemptNumber,
    campaignId: job.campaignId,
    campaignRecipientId: recipient.id,
    completedAt,
    deliveryMode: job.deliveryMode,
    idempotencyKey: jobRecipient.idempotencyKey,
    leadId: recipient.leadId,
    provider: response.provider,
    providerCategory: response.errorCode ?? "none",
    providerMessageId: response.providerMessageId,
    retryable: response.retryable,
    sanitizedErrorCode: response.errorCode,
    sanitizedErrorMessage: response.errorMessage,
    sendJobId: job.id,
    sendJobRecipientId: jobRecipient.id,
    startedAt,
    status: attemptStatus,
    tenantId: job.tenantId
  });

  if (response.status === "accepted") {
    await repos.outreachSendJobRecipients.update(job.tenantId, jobRecipient.id, {
      attemptCount: attemptNumber,
      completedAt,
      providerMessageId: response.providerMessageId,
      sentAt: completedAt,
      status: "SENT"
    });
    await repos.campaignRecipients.updateDraft(job.tenantId, recipient.id, {
      recipientDeliveryMode: job.deliveryMode === "simulation" ? "simulation" : "manual_external",
      sendIdempotencyKey: jobRecipient.idempotencyKey,
      sentAt: completedAt
    });
    if (job.deliveryMode === "brevo") {
      await repos.outreachSendJobDailyUsage.increment(job.tenantId, "brevo", todayIsoDate(), 1);
    }
    return "sent";
  }

  const retryable = shouldRetry(response, attemptNumber, job.maxRetries);
  await repos.outreachSendJobRecipients.update(job.tenantId, jobRecipient.id, {
    attemptCount: attemptNumber,
    lastErrorCode: response.errorCode,
    lastErrorMessage: response.errorMessage,
    nextAttemptAt: retryable ? new Date(Date.now() + 60 * 60 * 1000).toISOString() : null,
    status: retryable ? "RETRY_PENDING" : "FAILED"
  });
  return retryable ? "retry" : "failed";
}

function buildDeliveryRequest(
  job: OutreachSendJob,
  recipient: import("@/domain/campaign-types").CampaignRecipient,
  jobRecipient: OutreachSendJobRecipient,
  actorId: string
): EmailDeliveryRequest {
  return {
    approvedContentHash: jobRecipient.approvedContentVersion,
    campaignId: job.campaignId,
    campaignRecipientId: recipient.id,
    html: recipient.personalizedHtml,
    idempotencyKey: jobRecipient.idempotencyKey,
    initiatedBy: actorId,
    leadId: recipient.leadId,
    mode: job.deliveryMode === "brevo" ? "provider_test" : "simulation",
    plainText: recipient.personalizedPlainText,
    subject: recipient.personalizedSubject,
    tenantId: job.tenantId,
    toEmail: jobRecipient.normalizedEmail,
    toName: recipient.snapshotContactName || recipient.snapshotCompanyName,
    unsubscribeUrl: undefined
  };
}

function mapAttemptStatus(response: EmailDeliveryResponse): OutreachSendJobAttemptStatus {
  if (response.status === "accepted") return "ACCEPTED";
  if (response.status === "already_processed") return "ALREADY_PROCESSED";
  if (response.status === "blocked") return "BLOCKED";
  return "FAILED";
}

function shouldRetry(response: EmailDeliveryResponse, attemptNumber: number, maxRetries: number): boolean {
  return Boolean(
    response.retryable &&
      response.errorCode &&
      RETRYABLE_CODES.has(response.errorCode) &&
      attemptNumber <= maxRetries
  );
}

async function refreshJobCounters(
  repos: LocalRepositoryBundle,
  tenantId: string,
  jobId: string,
  allowComplete: boolean
): Promise<OutreachSendJob> {
  const job = await repos.outreachSendJobs.getById(tenantId, jobId);
  if (!job) throw new PersistenceError("not_found", "Send job not found.");
  const recipients = await repos.outreachSendJobRecipients.listForJob(tenantId, jobId);
  const remaining = recipients.filter((row) => row.status === "QUEUED" || row.status === "RETRY_PENDING").length;
  const sent = recipients.filter((row) => row.status === "SENT" || row.status === "DELIVERED").length;
  const failed = recipients.filter((row) => row.status === "FAILED").length;
  const retry = recipients.filter((row) => row.status === "RETRY_PENDING").length;
  const skipped = recipients.filter(
    (row) => row.status === "SKIPPED" || row.status === "SUPPRESSED" || row.status === "CANCELLED"
  ).length;
  const status = allowComplete && remaining === 0 ? "COMPLETED" : job.status === "PROCESSING" ? "QUEUED" : job.status;
  return repos.outreachSendJobs.update(tenantId, jobId, {
    completedAt: status === "COMPLETED" ? nowIso() : job.completedAt,
    failedCount: failed,
    lastProcessedAt: nowIso(),
    processedCount: recipients.length - remaining,
    remainingCount: remaining,
    retryPendingCount: retry,
    sentCount: sent,
    skippedCount: skipped,
    status
  });
}

function emptyResult(job: OutreachSendJob, stopReason: ProcessBatchResult["stopReason"]): ProcessBatchResult {
  return {
    failed: 0,
    job,
    processed: 0,
    retryPending: 0,
    sent: 0,
    skipped: 0,
    stopReason,
    suppressed: 0
  };
}

export async function pauseSendJob(
  repos: LocalRepositoryBundle,
  tenantId: string,
  sendJobId: string,
  actorId: string,
  reason: string
): Promise<OutreachSendJob> {
  return repos.outreachSendJobs.update(tenantId, sendJobId, {
    pausedAt: nowIso(),
    pausedBy: actorId,
    pauseReason: reason.trim() || "operator_pause",
    status: "PAUSED"
  });
}

export async function resumeSendJob(
  repos: LocalRepositoryBundle,
  tenantId: string,
  sendJobId: string,
  actorId: string
): Promise<OutreachSendJob> {
  return repos.outreachSendJobs.update(tenantId, sendJobId, {
    resumedAt: nowIso(),
    resumedBy: actorId,
    status: "QUEUED"
  });
}

export async function cancelSendJob(
  repos: LocalRepositoryBundle,
  tenantId: string,
  sendJobId: string,
  actorId: string,
  reason: string
): Promise<OutreachSendJob> {
  const timestamp = nowIso();
  const recipients = await repos.outreachSendJobRecipients.listForJob(tenantId, sendJobId);
  for (const recipient of recipients) {
    if (recipient.status === "QUEUED" || recipient.status === "RETRY_PENDING" || recipient.status === "PROCESSING") {
      await repos.outreachSendJobRecipients.update(tenantId, recipient.id, {
        completedAt: timestamp,
        status: "CANCELLED"
      });
    }
  }
  return repos.outreachSendJobs.update(tenantId, sendJobId, {
    cancelledAt: timestamp,
    cancelledBy: actorId,
    cancelReason: reason.trim() || "operator_cancel",
    status: "CANCELLED"
  });
}
