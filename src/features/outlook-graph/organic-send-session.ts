import { randomUUID } from "node:crypto";
import type { OutlookApprovedSendPayload, OutlookSendResult } from "./types";
import type { OutlookGraphEmailProvider } from "./outlook-graph-provider";
import { isOutlookLiveSendAllowed, readOutlookGraphConfig } from "./config";
import { assertOutlookServerOnlyModule } from "./server-only";

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

export type OrganicSessionItem = {
  id: string;
  payload: OutlookApprovedSendPayload;
  status: OrganicSessionItemStatus;
  nextEligibleAt: string | null;
  result: OutlookSendResult | null;
  snapshotHash: string;
  idempotencyKey: string;
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

export function createOrganicSendSession(
  items: OutlookApprovedSendPayload[],
  config: Partial<OrganicSendSessionConfig> = {}
): OrganicSendSessionSnapshot {
  if (activeSession && activeSession.status === "running") {
    throw new Error("organic_session_already_running");
  }
  const merged = { ...DEFAULT_CONFIG, ...config };
  const sessionId = randomUUID();
  const now = new Date().toISOString();
  const limited = items.slice(0, merged.maxMessagesPerSession);
  activeSession = {
    sessionId,
    status: merged.enabled ? "running" : "paused",
    config: merged,
    items: limited.map((payload, index) => ({
      id: randomUUID(),
      payload,
      status: merged.enabled ? "queued" : "paused",
      nextEligibleAt: computeNextEligibleAt(merged, index, new Date()),
      result: null,
      snapshotHash: payload.approvedDraftVersion,
      idempotencyKey: buildOrganicIdempotencyKey(payload)
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

export async function processOrganicSendSessionTick(
  provider: OutlookGraphEmailProvider,
  now = new Date()
): Promise<OrganicSendSessionSnapshot | null> {
  if (!activeSession || activeSession.status !== "running") return activeSession;
  if (processingLock) return structuredClone(activeSession);
  if (!isOutlookLiveSendAllowed(readOutlookGraphConfig())) return structuredClone(activeSession);
  if (!isWithinBusinessHours(activeSession.config, now)) return structuredClone(activeSession);

  const nextItem = activeSession.items.find(
    (item) =>
      item.status === "queued" &&
      (!item.nextEligibleAt || new Date(item.nextEligibleAt) <= now)
  );
  if (!nextItem) {
    finalizeIfComplete();
    return structuredClone(activeSession);
  }

  if (submittedIdempotencyKeys.has(nextItem.idempotencyKey)) {
    nextItem.status = "skipped";
    activeSession.skippedCount += 1;
    finalizeIfComplete();
    return structuredClone(activeSession);
  }

  processingLock = true;
  nextItem.status = "submitting";
  submittedIdempotencyKeys.add(nextItem.idempotencyKey);

  try {
    const result = await provider.sendApprovedMessage(nextItem.payload);
    nextItem.result = result;
    activeSession.processedCount += 1;
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

  finalizeIfComplete();
  return structuredClone(activeSession);
}

export function isOrganicIdempotencyKeySubmitted(key: string): boolean {
  return submittedIdempotencyKeys.has(key);
}

export function buildOrganicIdempotencyKey(payload: OutlookApprovedSendPayload): string {
  return [
    "organic",
    payload.campaignId,
    payload.recipientId,
    payload.approvedDraftVersion
  ].join(":");
}

function finalizeIfComplete(): void {
  if (!activeSession) return;
  const pending = activeSession.items.some(
    (item) => item.status === "queued" || item.status === "submitting" || item.status === "paused"
  );
  if (!pending && activeSession.status === "running") {
    activeSession.status = "completed";
    activeSession.completedAt = new Date().toISOString();
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
