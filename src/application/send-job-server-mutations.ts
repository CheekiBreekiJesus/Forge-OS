import {
  cancelSendJob,
  pauseSendJob,
  processNextCampaignBatch,
  queueCampaignSendJob,
  resumeSendJob
} from "@/application/campaign-send-job-service";
import type { OutreachSendJob, OutreachSendJobAttempt, OutreachSendJobRecipient, SendJobDeliveryProvider } from "@/domain/send-job-types";
import type { ActivityAction } from "@/domain/types";
import {
  requireSendJobPermission,
  type SendJobPermission
} from "@/features/email-delivery/send-job-authorization";
import type { TrustedSendJobActorContext } from "@/features/email-delivery/send-job-actor-context";
import { MAX_QUEUE_DELAY_MS } from "@/features/leadops/campaign-workflow";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";
import { PersistenceError } from "@/persistence/interfaces";

export type SendJobServerMutationDependencies = {
  repos: LocalRepositoryBundle;
  provider: SendJobDeliveryProvider;
};

export type SendJobServerStatus = {
  jobId: string;
  campaignId: string;
  status: OutreachSendJob["status"];
  provider: OutreachSendJob["provider"];
  deliveryMode: OutreachSendJob["deliveryMode"];
  counters: {
    processed: number;
    sent: number;
    failed: number;
    retryPending: number;
    skipped: number;
    remaining: number;
  };
  limits: {
    batchSize: number;
    delayMs: number;
    dailyLimit: number;
    maxRetries: number;
  };
  timestamps: {
    createdAt: string;
    queuedAt: string | null;
    startedAt: string | null;
    pausedAt: string | null;
    resumedAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    lastProcessedAt: string | null;
  };
  lock: {
    locked: boolean;
    expiresAt: string | null;
  };
  recipientStatusCounts: Record<OutreachSendJobRecipient["status"], number>;
  recentErrors: Array<{
    recipientId: string;
    status: OutreachSendJobAttempt["status"];
    code: string | null;
    message: string | null;
    retryable: boolean;
    completedAt: string;
  }>;
};

export class SendJobServerMutationError extends Error {
  constructor(
    public readonly code:
      | "bad_request"
      | "forbidden"
      | "not_found"
      | "invalid_transition"
      | "unsupported_provider"
      | "server_persistence_unavailable",
    message: string,
    public readonly status = 400
  ) {
    super(message);
    this.name = "SendJobServerMutationError";
  }
}

type QueueRequest = {
  campaignId: string;
  provider?: "simulation";
  deliveryMode?: "simulation";
  batchSize?: number;
  delayMs?: number;
  dailyLimit?: number;
  maxRetries?: number;
  confirmation: "QUEUE SIMULATION";
};

type JobIdRequest = {
  jobId: string;
};

type ReasonRequest = JobIdRequest & {
  reason?: string;
};

type RetryRequest = {
  jobId: string;
  recipientId: string;
  reason: string;
};

export async function queueCampaignThroughServer(
  deps: SendJobServerMutationDependencies,
  actor: TrustedSendJobActorContext,
  rawInput: unknown
) {
  await requirePermission(actor, "send_job:queue", deps, undefined);
  const input = parseQueueRequest(rawInput);
  await assertCampaignVisible(deps, actor, input.campaignId);
  await audit(deps, actor, "send_job_queue_requested", input.campaignId, {
    campaignId: input.campaignId,
    correlationId: actor.correlationId
  });

  const result = await mapPersistenceErrors(async () =>
    queueCampaignSendJob(deps.repos, {
      actorId: actor.userId,
      batchSize: input.batchSize,
      campaignId: input.campaignId,
      confirmation: input.confirmation,
      dailyLimit: input.dailyLimit,
      delayMs: input.delayMs,
      deliveryMode: "simulation",
      maxRetries: input.maxRetries,
      provider: "simulation",
      tenantId: actor.tenantId
    })
  );

  await audit(deps, actor, "send_job_queued", result.job.id, {
    alreadyQueued: result.alreadyQueued,
    campaignId: input.campaignId,
    correlationId: actor.correlationId,
    eligibleRecipients: result.eligibility.eligibleRecipients.length
  });

  return {
    alreadyQueued: result.alreadyQueued,
    eligibility: {
      canQueue: result.eligibility.canQueue,
      eligibleRecipients: result.eligibility.eligibleRecipients.length,
      excludedRecipients: result.eligibility.excludedRecipients.length,
      reasons: result.eligibility.reasons
    },
    job: summarizeJob(result.job)
  };
}

export async function processNextBatchThroughServer(
  deps: SendJobServerMutationDependencies,
  actor: TrustedSendJobActorContext,
  rawInput: unknown
) {
  await requirePermission(actor, "send_job:process", deps, undefined);
  const input = parseJobIdRequest(rawInput);
  const job = await loadJob(deps, actor, input.jobId);
  if (job.status !== "QUEUED" && job.status !== "PROCESSING") {
    await auditInvalidTransition(deps, actor, job.id, "process", job.status);
    throw new SendJobServerMutationError(
      "invalid_transition",
      `Cannot process send job from status ${job.status}.`,
      409
    );
  }
  await audit(deps, actor, "send_job_process_requested", job.id, {
    campaignId: job.campaignId,
    correlationId: actor.correlationId
  });

  const result = await mapPersistenceErrors(() =>
    processNextCampaignBatch(deps.repos, deps.provider, {
      actorId: actor.userId,
      sendJobId: job.id,
      tenantId: actor.tenantId
    })
  );

  await audit(deps, actor, "send_job_batch_processed", job.id, {
    correlationId: actor.correlationId,
    processed: result.processed,
    stopReason: result.stopReason
  });

  return {
    failed: result.failed,
    job: summarizeJob(result.job),
    processed: result.processed,
    retryPending: result.retryPending,
    sent: result.sent,
    skipped: result.skipped,
    stopReason: result.stopReason,
    suppressed: result.suppressed
  };
}

export async function pauseJobThroughServer(
  deps: SendJobServerMutationDependencies,
  actor: TrustedSendJobActorContext,
  rawInput: unknown
) {
  await requirePermission(actor, "send_job:pause", deps, undefined);
  const input = parseReasonRequest(rawInput);
  const job = await loadJob(deps, actor, input.jobId);
  if (job.status !== "QUEUED" && job.status !== "PROCESSING") {
    await auditInvalidTransition(deps, actor, job.id, "pause", job.status);
    throw new SendJobServerMutationError("invalid_transition", `Cannot pause send job from status ${job.status}.`, 409);
  }
  await audit(deps, actor, "send_job_pause_requested", job.id, {
    correlationId: actor.correlationId,
    reason: sanitizeReason(input.reason)
  });
  const updated = await mapPersistenceErrors(() =>
    pauseSendJob(deps.repos, actor.tenantId, job.id, actor.userId, sanitizeReason(input.reason) || "operator_pause")
  );
  await audit(deps, actor, "send_job_paused", job.id, { correlationId: actor.correlationId });
  return { job: summarizeJob(updated) };
}

export async function resumeJobThroughServer(
  deps: SendJobServerMutationDependencies,
  actor: TrustedSendJobActorContext,
  rawInput: unknown
) {
  await requirePermission(actor, "send_job:resume", deps, undefined);
  const input = parseJobIdRequest(rawInput);
  const job = await loadJob(deps, actor, input.jobId);
  if (job.status !== "PAUSED") {
    await auditInvalidTransition(deps, actor, job.id, "resume", job.status);
    throw new SendJobServerMutationError("invalid_transition", `Cannot resume send job from status ${job.status}.`, 409);
  }
  await audit(deps, actor, "send_job_resume_requested", job.id, { correlationId: actor.correlationId });
  const updated = await mapPersistenceErrors(() => resumeSendJob(deps.repos, actor.tenantId, job.id, actor.userId));
  await audit(deps, actor, "send_job_resumed", job.id, { correlationId: actor.correlationId });
  return { job: summarizeJob(updated) };
}

export async function cancelJobThroughServer(
  deps: SendJobServerMutationDependencies,
  actor: TrustedSendJobActorContext,
  rawInput: unknown
) {
  await requirePermission(actor, "send_job:cancel", deps, undefined);
  const input = parseReasonRequest(rawInput);
  const job = await loadJob(deps, actor, input.jobId);
  if (job.status === "COMPLETED" || job.status === "CANCELLED" || job.status === "FAILED") {
    await auditInvalidTransition(deps, actor, job.id, "cancel", job.status);
    throw new SendJobServerMutationError("invalid_transition", `Cannot cancel send job from status ${job.status}.`, 409);
  }
  await audit(deps, actor, "send_job_cancel_requested", job.id, {
    correlationId: actor.correlationId,
    reason: sanitizeReason(input.reason)
  });
  const updated = await mapPersistenceErrors(() =>
    cancelSendJob(deps.repos, actor.tenantId, job.id, actor.userId, sanitizeReason(input.reason) || "operator_cancel")
  );
  await audit(deps, actor, "send_job_cancelled", job.id, { correlationId: actor.correlationId });
  return { job: summarizeJob(updated) };
}

export async function retryEligibleFailureThroughServer(
  deps: SendJobServerMutationDependencies,
  actor: TrustedSendJobActorContext,
  rawInput: unknown
) {
  await requirePermission(actor, "send_job:retry", deps, undefined);
  const input = parseRetryRequest(rawInput);
  const job = await loadJob(deps, actor, input.jobId);
  const recipient = await deps.repos.outreachSendJobRecipients.getById(actor.tenantId, input.recipientId);
  if (!recipient || recipient.sendJobId !== job.id || recipient.campaignId !== job.campaignId) {
    throw new SendJobServerMutationError("not_found", "Send job recipient not found.", 404);
  }
  const attempts = await deps.repos.outreachSendJobAttempts.listForJob(actor.tenantId, job.id);
  const latest = attempts
    .filter((attempt) => attempt.sendJobRecipientId === recipient.id)
    .toSorted((a, b) => b.completedAt.localeCompare(a.completedAt))[0];

  await audit(deps, actor, "send_job_retry_requested", job.id, {
    correlationId: actor.correlationId,
    recipientId: recipient.id,
    reason: sanitizeReason(input.reason)
  });

  if (recipient.status !== "RETRY_PENDING" && !(recipient.status === "FAILED" && latest?.retryable)) {
    await auditInvalidTransition(deps, actor, job.id, "retry", recipient.status);
    throw new SendJobServerMutationError("invalid_transition", "Recipient failure is not retryable.", 409);
  }
  if (recipient.attemptCount > job.maxRetries) {
    await auditInvalidTransition(deps, actor, job.id, "retry", "max_retries_exceeded");
    throw new SendJobServerMutationError("invalid_transition", "Recipient retry limit has been reached.", 409);
  }

  const updated = await deps.repos.outreachSendJobRecipients.update(actor.tenantId, recipient.id, {
    nextAttemptAt: new Date().toISOString(),
    status: "RETRY_PENDING"
  });
  await deps.repos.outreachSendJobs.update(actor.tenantId, job.id, {
    retryPendingCount: job.retryPendingCount + (recipient.status === "RETRY_PENDING" ? 0 : 1),
    status: job.status === "PAUSED" ? "PAUSED" : "QUEUED"
  });
  await audit(deps, actor, "send_job_retry_accepted", job.id, {
    correlationId: actor.correlationId,
    recipientId: recipient.id
  });
  return { recipient: summarizeRecipient(updated) };
}

export async function getSendJobStatusThroughServer(
  deps: SendJobServerMutationDependencies,
  actor: TrustedSendJobActorContext,
  rawInput: unknown
): Promise<SendJobServerStatus> {
  await requirePermission(actor, "send_job:view", deps, undefined);
  const input = parseJobIdRequest(rawInput);
  const job = await loadJob(deps, actor, input.jobId);
  return buildStatus(deps, actor, job);
}

async function buildStatus(
  deps: SendJobServerMutationDependencies,
  actor: TrustedSendJobActorContext,
  job: OutreachSendJob
): Promise<SendJobServerStatus> {
  const [recipients, attempts] = await Promise.all([
    deps.repos.outreachSendJobRecipients.listForJob(actor.tenantId, job.id),
    deps.repos.outreachSendJobAttempts.listForJob(actor.tenantId, job.id)
  ]);
  const counts = buildRecipientStatusCounts(recipients);
  const canViewErrors = hasPermissionWithoutAudit(actor, "send_job:view_errors");
  const recentErrors = attempts
    .filter((attempt) => attempt.status === "FAILED" || attempt.status === "BLOCKED")
    .toSorted((a, b) => b.completedAt.localeCompare(a.completedAt))
    .slice(0, 5)
    .map((attempt) => ({
      code: canViewErrors ? attempt.sanitizedErrorCode : null,
      completedAt: attempt.completedAt,
      message: canViewErrors ? attempt.sanitizedErrorMessage : null,
      recipientId: attempt.sendJobRecipientId,
      retryable: attempt.retryable,
      status: attempt.status
    }));

  return {
    campaignId: job.campaignId,
    counters: {
      failed: job.failedCount,
      processed: job.processedCount,
      remaining: job.remainingCount,
      retryPending: job.retryPendingCount,
      sent: job.sentCount,
      skipped: job.skippedCount
    },
    deliveryMode: job.deliveryMode,
    jobId: job.id,
    limits: {
      batchSize: job.batchSize,
      dailyLimit: job.dailyLimit,
      delayMs: job.delayMs,
      maxRetries: job.maxRetries
    },
    lock: {
      expiresAt: job.lockExpiresAt,
      locked: Boolean(job.lockOwner && job.lockExpiresAt && job.lockExpiresAt > new Date().toISOString())
    },
    provider: job.provider,
    recentErrors,
    recipientStatusCounts: counts,
    status: job.status,
    timestamps: {
      cancelledAt: job.cancelledAt,
      completedAt: job.completedAt,
      createdAt: job.createdAt,
      lastProcessedAt: job.lastProcessedAt,
      pausedAt: job.pausedAt,
      queuedAt: job.queuedAt,
      resumedAt: job.resumedAt,
      startedAt: job.startedAt
    }
  };
}

async function loadJob(
  deps: SendJobServerMutationDependencies,
  actor: TrustedSendJobActorContext,
  jobId: string
): Promise<OutreachSendJob> {
  const job = await deps.repos.outreachSendJobs.getById(actor.tenantId, jobId);
  if (!job) throw new SendJobServerMutationError("not_found", "Send job not found.", 404);
  return job;
}

async function assertCampaignVisible(
  deps: SendJobServerMutationDependencies,
  actor: TrustedSendJobActorContext,
  campaignId: string
) {
  const campaign = await deps.repos.campaigns.getById(actor.tenantId, campaignId);
  if (!campaign) throw new SendJobServerMutationError("not_found", "Campaign not found.", 404);
  return campaign;
}

async function requirePermission(
  actor: TrustedSendJobActorContext,
  permission: SendJobPermission,
  deps: SendJobServerMutationDependencies,
  entityId: string | undefined
) {
  try {
    requireSendJobPermission(actor, permission);
  } catch {
    await audit(deps, actor, "send_job_authorization_denied", entityId ?? "send-job", {
      correlationId: actor.correlationId,
      deniedPermission: permission
    });
    throw new SendJobServerMutationError("forbidden", "Actor is not authorized for this operation.", 403);
  }
}

function hasPermissionWithoutAudit(actor: TrustedSendJobActorContext, permission: SendJobPermission): boolean {
  try {
    requireSendJobPermission(actor, permission);
    return true;
  } catch {
    return false;
  }
}

async function auditInvalidTransition(
  deps: SendJobServerMutationDependencies,
  actor: TrustedSendJobActorContext,
  entityId: string,
  operation: string,
  currentState: string
) {
  await audit(deps, actor, "send_job_invalid_transition", entityId, {
    correlationId: actor.correlationId,
    currentState,
    operation
  });
}

async function audit(
  deps: SendJobServerMutationDependencies,
  actor: TrustedSendJobActorContext,
  action: ActivityAction,
  entityId: string,
  metadata: Record<string, string | number | boolean>
) {
  await deps.repos.activities.append(actor.tenantId, {
    action,
    entityId,
    entityType: "send_job",
    metadata: {
      ...metadata,
      actorId: actor.userId,
      authSource: actor.source
    },
    title: action.replaceAll("_", " ")
  });
}

function parseQueueRequest(input: unknown): QueueRequest {
  const row = expectObject(input);
  rejectUnknown(row, [
    "campaignId",
    "provider",
    "deliveryMode",
    "batchSize",
    "delayMs",
    "dailyLimit",
    "maxRetries",
    "confirmation"
  ]);
  const provider = optionalString(row.provider, "provider") ?? "simulation";
  const deliveryMode = optionalString(row.deliveryMode, "deliveryMode") ?? "simulation";
  if (provider !== "simulation" || deliveryMode !== "simulation") {
    throw new SendJobServerMutationError("unsupported_provider", "Only durable simulation is enabled in Step 7C.", 400);
  }
  const confirmation = requiredString(row.confirmation, "confirmation");
  if (confirmation !== "QUEUE SIMULATION") {
    throw new SendJobServerMutationError("bad_request", "Queue confirmation is invalid.", 400);
  }
  return {
    batchSize: optionalNumber(row.batchSize, "batchSize", 1, 100),
    campaignId: requiredId(row.campaignId, "campaignId"),
    confirmation,
    dailyLimit: optionalNumber(row.dailyLimit, "dailyLimit", 0, 1000),
    delayMs: optionalNumber(row.delayMs, "delayMs", 0, MAX_QUEUE_DELAY_MS),
    deliveryMode,
    maxRetries: optionalNumber(row.maxRetries, "maxRetries", 0, 10),
    provider
  };
}

function parseJobIdRequest(input: unknown): JobIdRequest {
  const row = expectObject(input);
  rejectUnknown(row, ["jobId"]);
  return { jobId: requiredId(row.jobId, "jobId") };
}

function parseReasonRequest(input: unknown): ReasonRequest {
  const row = expectObject(input);
  rejectUnknown(row, ["jobId", "reason"]);
  return {
    jobId: requiredId(row.jobId, "jobId"),
    reason: optionalString(row.reason, "reason")
  };
}

function parseRetryRequest(input: unknown): RetryRequest {
  const row = expectObject(input);
  rejectUnknown(row, ["jobId", "recipientId", "reason"]);
  return {
    jobId: requiredId(row.jobId, "jobId"),
    reason: requiredString(row.reason, "reason"),
    recipientId: requiredId(row.recipientId, "recipientId")
  };
}

function expectObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new SendJobServerMutationError("bad_request", "Request body must be an object.", 400);
  }
  return input as Record<string, unknown>;
}

function rejectUnknown(row: Record<string, unknown>, allowed: string[]) {
  const allowedSet = new Set(allowed);
  const unknown = Object.keys(row).filter((key) => !allowedSet.has(key));
  if (unknown.length > 0) {
    throw new SendJobServerMutationError("bad_request", `Unknown fields: ${unknown.join(", ")}.`, 400);
  }
}

function requiredId(value: unknown, field: string): string {
  const text = requiredString(value, field);
  if (!/^[A-Za-z0-9_:-]{1,128}$/.test(text)) {
    throw new SendJobServerMutationError("bad_request", `${field} is malformed.`, 400);
  }
  return text;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new SendJobServerMutationError("bad_request", `${field} is required.`, 400);
  }
  return value.trim();
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new SendJobServerMutationError("bad_request", `${field} must be a string.`, 400);
  }
  return value.trim();
}

function optionalNumber(
  value: unknown,
  field: string,
  min: number,
  max: number
): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    throw new SendJobServerMutationError("bad_request", `${field} must be an integer from ${min} to ${max}.`, 400);
  }
  return value;
}

function sanitizeReason(reason: string | undefined): string {
  return (reason ?? "").trim().slice(0, 160);
}

function summarizeJob(job: OutreachSendJob) {
  return {
    campaignId: job.campaignId,
    deliveryMode: job.deliveryMode,
    failedCount: job.failedCount,
    id: job.id,
    processedCount: job.processedCount,
    provider: job.provider,
    remainingCount: job.remainingCount,
    retryPendingCount: job.retryPendingCount,
    sentCount: job.sentCount,
    skippedCount: job.skippedCount,
    status: job.status
  };
}

function summarizeRecipient(recipient: OutreachSendJobRecipient) {
  return {
    attemptCount: recipient.attemptCount,
    id: recipient.id,
    nextAttemptAt: recipient.nextAttemptAt,
    sendJobId: recipient.sendJobId,
    status: recipient.status
  };
}

function buildRecipientStatusCounts(
  recipients: OutreachSendJobRecipient[]
): Record<OutreachSendJobRecipient["status"], number> {
  return {
    CANCELLED: recipients.filter((row) => row.status === "CANCELLED").length,
    DELIVERED: recipients.filter((row) => row.status === "DELIVERED").length,
    FAILED: recipients.filter((row) => row.status === "FAILED").length,
    PROCESSING: recipients.filter((row) => row.status === "PROCESSING").length,
    QUEUED: recipients.filter((row) => row.status === "QUEUED").length,
    RETRY_PENDING: recipients.filter((row) => row.status === "RETRY_PENDING").length,
    SENT: recipients.filter((row) => row.status === "SENT").length,
    SKIPPED: recipients.filter((row) => row.status === "SKIPPED").length,
    SUPPRESSED: recipients.filter((row) => row.status === "SUPPRESSED").length
  };
}

async function mapPersistenceErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof PersistenceError) {
      const status = error.code === "not_found" ? 404 : error.code === "forbidden" ? 403 : 409;
      throw new SendJobServerMutationError(error.code === "not_found" ? "not_found" : "invalid_transition", error.message, status);
    }
    throw error;
  }
}
