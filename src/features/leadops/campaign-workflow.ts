export const CAMPAIGN_WORKFLOW_STEPS = [
  "draft",
  "approve",
  "queue",
  "delivery"
] as const;

export type CampaignWorkflowStep = (typeof CAMPAIGN_WORKFLOW_STEPS)[number];

export const MIN_QUEUE_INTERVAL_MINUTES = 0;
export const MAX_QUEUE_INTERVAL_MINUTES = 60;
export const MAX_QUEUE_DELAY_MS = MAX_QUEUE_INTERVAL_MINUTES * 60_000;

export type QueueIntervalValidationResult =
  | { valid: true; delayMs: number }
  | { valid: false; reason: "below_min" | "above_max" | "not_finite" };

export function validateQueueIntervalMinutes(minutes: number): QueueIntervalValidationResult {
  if (!Number.isFinite(minutes)) {
    return { reason: "not_finite", valid: false };
  }
  const rounded = Math.trunc(minutes);
  if (rounded < MIN_QUEUE_INTERVAL_MINUTES) {
    return { reason: "below_min", valid: false };
  }
  if (rounded > MAX_QUEUE_INTERVAL_MINUTES) {
    return { reason: "above_max", valid: false };
  }
  return { delayMs: rounded * 60_000, valid: true };
}

export function minutesFromDelayMs(delayMs: number): number {
  return Math.round(delayMs / 60_000);
}

export function clampQueueBatchSize(value: number | undefined, fallback = 5): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.trunc(value!), 1), 100);
}

export function buildScheduledStartIso(localDateTime: string): string | null {
  const parsed = new Date(localDateTime);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}
