import type { OutlookDurableSendAttempt } from "@/domain/outlook-send-types";
import { OUTLOOK_SUBMITTING_STALE_THRESHOLD_MS } from "@/domain/outlook-send-types";
import {
  createOutlookDurableSendAttemptStore,
  isStaleSubmittingAttempt,
  type OutlookDurableSendAttemptStore
} from "@/features/outlook-graph/durable-send-attempt-store";
import { assertOutlookServerOnlyModule } from "./server-only";

assertOutlookServerOnlyModule();

export type OutlookSendRecoveryReport = {
  recoveredUncertain: number;
  scannedSubmitting: number;
};

export async function recoverStaleOutlookSendAttempts(
  store: OutlookDurableSendAttemptStore = createOutlookDurableSendAttemptStore(),
  now = Date.now(),
  thresholdMs = OUTLOOK_SUBMITTING_STALE_THRESHOLD_MS
): Promise<OutlookSendRecoveryReport> {
  const attempts = await store.listAll();
  let recoveredUncertain = 0;
  let scannedSubmitting = 0;

  for (const attempt of attempts) {
    if (attempt.status !== "submitting") continue;
    scannedSubmitting += 1;
    if (!isStaleSubmittingAttempt(attempt, now, thresholdMs)) continue;
    await store.update(attempt.tenantId, attempt.id, {
      failedAt: new Date(now).toISOString(),
      retryable: false,
      sanitizedErrorCode: "timeout",
      sanitizedErrorMessage: "Submitting attempt exceeded safe threshold after restart.",
      status: "uncertain",
      uncertainAt: new Date(now).toISOString()
    });
    recoveredUncertain += 1;
  }

  return { recoveredUncertain, scannedSubmitting };
}

export function isOutlookAttemptBlockingResend(attempt: OutlookDurableSendAttempt): boolean {
  return attempt.status === "accepted" || attempt.status === "uncertain" || attempt.status === "submitting";
}

let recoveryPromise: Promise<OutlookSendRecoveryReport> | null = null;

export async function ensureOutlookSendRecoveryOnStartup(
  store: OutlookDurableSendAttemptStore = createOutlookDurableSendAttemptStore()
): Promise<OutlookSendRecoveryReport> {
  if (!recoveryPromise) {
    recoveryPromise = recoverStaleOutlookSendAttempts(store);
  }
  return recoveryPromise;
}

export function resetOutlookSendRecoveryForTests(): void {
  recoveryPromise = null;
}
