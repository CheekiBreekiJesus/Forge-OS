import { randomUUID } from "node:crypto";
import type { OutlookApprovedSendPayload, OutlookSendResult } from "./types";
import type { OutlookSendServerDependencies } from "./server-dependencies";
import { isOutlookLiveSendAllowed } from "./config";
import { assertOutlookServerOnlyModule } from "./server-only";
import {
  buildOutlookDurableIdempotencyKey,
  isBlockingOutlookAttemptStatus,
  type OutlookDurableSendAttemptStore
} from "./durable-send-attempt-store";
import { ensureOutlookSendRecoveryOnStartup } from "./send-recovery";
import { appendOutlookAuditEvent } from "./outlook-audit";
import { mapClassificationToErrorCode } from "./classify-error";
import { OUTLOOK_DURABLE_PROVIDER } from "@/domain/outlook-send-types";
import type { OutlookDurableSendAttemptStatus } from "@/domain/outlook-send-types";

assertOutlookServerOnlyModule();

export type OrganicSessionItemStatus =
  | "queued"
  | "submitting"
  | "accepted"
  | "failed"
  | "throttled"
  | "uncertain"
  | "skipped"
  | "paused";

export type OrganicSendSessionStatus =
  | "idle"
  | "running"
  | "paused"
  | "completed";

export type OrganicSessionCommand = {
  campaignId: string;
  recipientId: string;
  idempotencyKey: string;
  snapshotHash: string;
  payload: OutlookApprovedSendPayload;
};

export type OrganicSessionItem = {
  id: string;
  campaignId: string;
  recipientId: string;
  payload: OutlookApprovedSendPayload;
  status: OrganicSessionItemStatus;
  nextEligibleAt: string | null;
  result: OutlookSendResult | null;
  snapshotHash: string;
  idempotencyKey: string;
  attemptId: string | null;
};

export type OrganicSendSessionConfig = {
  enabled: boolean;
  maxMessagesPerSession: number;
  concurrentSends: number;
  delayMinSeconds: number;
  delayMaxSeconds: number;
  timezone: string;
  businessHourStart: number;
  businessHourEnd: number;
};

export type OrganicSendSessionSnapshot = {
  sessionId: string;
  tenantId: string;
  campaignId: string;
  status: OrganicSendSessionStatus;
  config: OrganicSendSessionConfig;
  items: OrganicSessionItem[];
  startedAt: string | null;
  completedAt: string | null;
  pausedAt: string | null;
  processedCount: number;
  acceptedCount: number;
  failedCount: number;
  uncertainCount: number;
  throttledCount: number;
  skippedCount: number;
};

const DEFAULT_CONFIG: OrganicSendSessionConfig = {
  enabled: false,
  maxMessagesPerSession: 5,
  concurrentSends: 1,
  delayMinSeconds: 180,
  delayMaxSeconds: 420,
  timezone: "Europe/Lisbon",
  businessHourStart: 9,
  businessHourEnd: 18
};

let activeSession: OrganicSendSessionSnapshot | null = null;
let processingLock = false;
const submittedIdempotencyKeys = new Set<string>();

export function getOrganicSendSessionSnapshot(): OrganicSendSessionSnapshot | null {
  return activeSession ? structuredClone(activeSession) : null;
}

export function resetOrganicSendSessionForTests(): void {
  activeSession = null;
  processingLock = false;
  submittedIdempotencyKeys.clear();
}

export function createOrganicSendSessionFromCommands(
  commands: OrganicSessionCommand[],
  options: {
    enabled?: boolean;
    campaignId: string;
    tenantId: string;
    config?: Partial<OrganicSendSessionConfig>;
  }
): OrganicSendSessionSnapshot {
  if (activeSession && activeSession.status === "running") {
    throw new Error("organic_session_already_running");
  }
  const merged: OrganicSendSessionConfig = {
    ...DEFAULT_CONFIG,
    ...options.config,
    enabled: options.enabled ?? options.config?.enabled ?? DEFAULT_CONFIG.enabled
  };
  const sessionId = randomUUID();
  const now = new Date().toISOString();
  const limited = commands.slice(0, merged.maxMessagesPerSession);
  activeSession = {
    sessionId,
    tenantId: options.tenantId,
    campaignId: options.campaignId,
    status: merged.enabled ? "running" : "paused",
    config: merged,
    items: limited.map((command, index) => ({
      id: randomUUID(),
      attemptId: null,
      campaignId: command.campaignId,
      idempotencyKey: command.idempotencyKey,
      payload: command.payload,
      recipientId: command.recipientId,
      result: null,
      snapshotHash: command.snapshotHash,
      status: merged.enabled ? "queued" : "paused",
      nextEligibleAt: computeNextEligibleAt(merged, index, new Date())
    })),
    startedAt: now,
    completedAt: null,
    pausedAt: merged.enabled ? null : now,
    processedCount: 0,
    acceptedCount: 0,
    failedCount: 0,
    uncertainCount: 0,
    throttledCount: 0,
    skippedCount: 0
  };
  return structuredClone(activeSession);
}

/** @deprecated Client payloads are rejected at the API boundary. */
export function createOrganicSendSession(
  items: OutlookApprovedSendPayload[],
  config: Partial<OrganicSendSessionConfig> = {}
): OrganicSendSessionSnapshot {
  return createOrganicSendSessionFromCommands(
    items.map((payload) => ({
      campaignId: payload.campaignId,
      idempotencyKey: buildOrganicIdempotencyKey(payload),
      payload,
      recipientId: payload.recipientId,
      snapshotHash: payload.approvedDraftVersion
    })),
    { campaignId: items[0]?.campaignId ?? "", config, enabled: config.enabled, tenantId: "" }
  );
}

export function pauseOrganicSendSession(): OrganicSendSessionSnapshot | null {
  if (!activeSession) return null;
  activeSession.status = "paused";
  activeSession.pausedAt = new Date().toISOString();
  for (const item of activeSession.items) {
    if (item.status === "queued") item.status = "paused";
  }
  return structuredClone(activeSession);
}

export function resumeOrganicSendSession(): OrganicSendSessionSnapshot | null {
  if (!activeSession) return null;
  if (!activeSession.config.enabled) return structuredClone(activeSession);
  activeSession.status = "running";
  activeSession.pausedAt = null;
  for (const item of activeSession.items) {
    if (item.status === "paused") item.status = "queued";
  }
  return structuredClone(activeSession);
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

async function createDurableSubmittingAttempt(
  store: OutlookDurableSendAttemptStore,
  tenantId: string,
  item: OrganicSessionItem,
  initiatedBy: string
): Promise<{ blocked: boolean; attemptId: string }> {
  const now = new Date().toISOString();
  const { attempt, created } = await store.createSubmitting({
    approvedDraftVersion: item.snapshotHash,
    campaignId: item.campaignId,
    campaignRecipientId: item.recipientId,
    createdAt: now,
    failedAt: null,
    httpStatus: null,
    idempotencyKey: item.idempotencyKey,
    initiatedBy,
    provider: OUTLOOK_DURABLE_PROVIDER,
    providerMessageId: null,
    retryable: false,
    sanitizedErrorCode: null,
    sanitizedErrorMessage: null,
    status: "submitting",
    submittingAt: now,
    acceptedAt: null,
    uncertainAt: null,
    cancelledAt: null,
    tenantId
  });
  if (!created && isBlockingOutlookAttemptStatus(attempt.status)) {
    return { attemptId: attempt.id, blocked: true };
  }
  return { attemptId: attempt.id, blocked: false };
}

export async function processOrganicSendSessionTick(
  deps: OutlookSendServerDependencies,
  now = new Date(),
  initiatedBy = "organic-session"
): Promise<OrganicSendSessionSnapshot | null> {
  await ensureOutlookSendRecoveryOnStartup(deps.attemptStore);

  if (!activeSession || activeSession.status !== "running") return activeSession;
  if (processingLock) return structuredClone(activeSession);
  if (!isOutlookLiveSendAllowed(deps.config)) return structuredClone(activeSession);
  if (!isWithinBusinessHours(activeSession.config, now)) return structuredClone(activeSession);

  const nextItem = activeSession.items.find(
    (item) =>
      item.status === "queued" &&
      (!item.nextEligibleAt || new Date(item.nextEligibleAt) <= now)
  );
  if (!nextItem) {
    finalizeIfComplete(deps);
    return structuredClone(activeSession);
  }

  const existing = await deps.attemptStore.getByIdempotencyKey(
    activeSession.tenantId,
    nextItem.idempotencyKey
  );
  if (existing && isBlockingOutlookAttemptStatus(existing.status)) {
    nextItem.status = "skipped";
    activeSession.skippedCount += 1;
    finalizeIfComplete(deps);
    return structuredClone(activeSession);
  }

  if (submittedIdempotencyKeys.has(nextItem.idempotencyKey)) {
    nextItem.status = "skipped";
    activeSession.skippedCount += 1;
    finalizeIfComplete(deps);
    return structuredClone(activeSession);
  }

  processingLock = true;
  nextItem.status = "submitting";
  submittedIdempotencyKeys.add(nextItem.idempotencyKey);

  try {
    const tenantId = activeSession.tenantId;
    const durable = await createDurableSubmittingAttempt(
      deps.attemptStore,
      tenantId,
      nextItem,
      initiatedBy
    );
    if (durable.blocked) {
      nextItem.status = "skipped";
      activeSession.skippedCount += 1;
      return structuredClone(activeSession);
    }
    nextItem.attemptId = durable.attemptId;
    nextItem.payload.attemptId = durable.attemptId;

    const result = await deps.provider.sendApprovedMessage(nextItem.payload);
    nextItem.result = result;
    activeSession.processedCount += 1;

    const attemptStatus = mapGraphResultToAttemptStatus(result);
    const timestamp = new Date().toISOString();
    await deps.attemptStore.update(tenantId, durable.attemptId, {
      acceptedAt: attemptStatus === "accepted" ? timestamp : null,
      failedAt:
        attemptStatus === "permanent_failure" ||
        attemptStatus === "temporary_failure" ||
        attemptStatus === "reconnect_required"
          ? timestamp
          : null,
      httpStatus: result.httpStatus,
      providerMessageId: result.providerMessageId,
      retryable: result.retryable,
      sanitizedErrorCode: mapClassificationToErrorCode(result.classification),
      sanitizedErrorMessage: result.errorMessage,
      status: attemptStatus,
      uncertainAt: attemptStatus === "uncertain" ? timestamp : null
    });

    switch (result.classification) {
      case "accepted":
        nextItem.status = "accepted";
        activeSession.acceptedCount += 1;
        break;
      case "throttled":
        nextItem.status = "throttled";
        activeSession.throttledCount += 1;
        activeSession.status = "paused";
        break;
      case "uncertain":
        nextItem.status = "uncertain";
        activeSession.uncertainCount += 1;
        break;
      default:
        nextItem.status = "failed";
        activeSession.failedCount += 1;
        break;
    }
  } finally {
    processingLock = false;
  }

  finalizeIfComplete(deps);
  return structuredClone(activeSession);
}

export function isOrganicIdempotencyKeySubmitted(key: string): boolean {
  return submittedIdempotencyKeys.has(key);
}

export function buildOrganicIdempotencyKey(payload: OutlookApprovedSendPayload): string {
  return buildOutlookDurableIdempotencyKey(
    payload.campaignId,
    payload.recipientId,
    payload.approvedDraftVersion
  );
}

function finalizeIfComplete(deps: OutlookSendServerDependencies): void {
  if (!activeSession) return;
  const pending = activeSession.items.some(
    (item) => item.status === "queued" || item.status === "submitting" || item.status === "paused"
  );
  if (!pending && activeSession.status === "running") {
    activeSession.status = "completed";
    activeSession.completedAt = new Date().toISOString();
    void appendOutlookAuditEvent(
      deps.repos,
      activeSession.tenantId,
      "outlook_organic_session_completed",
      activeSession.campaignId,
      "Outlook organic session completed",
      { sessionId: activeSession.sessionId }
    );
  }
}

function computeNextEligibleAt(
  config: OrganicSendSessionConfig,
  index: number,
  base: Date
): string {
  if (index === 0) return base.toISOString();
  const delaySeconds =
    config.delayMinSeconds +
    Math.floor(Math.random() * (config.delayMaxSeconds - config.delayMinSeconds + 1));
  return new Date(base.getTime() + index * delaySeconds * 1000).toISOString();
}

export function isWithinBusinessHours(
  config: OrganicSendSessionConfig,
  date: Date
): boolean {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: config.timezone,
    hour: "numeric",
    hour12: false
  });
  const hour = Number(formatter.format(date));
  return hour >= config.businessHourStart && hour < config.businessHourEnd;
}
