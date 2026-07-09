"use client";

import { useEffect, useRef } from "react";
import type { HostedSendJobSummary } from "@/features/outreach/hosted-send-job-client";
import { processHostedSendJobBatch } from "@/features/outreach/hosted-send-job-client";

const POLL_MS = 2_000;

type UseHostedSendJobProcessorInput = {
  enabled: boolean;
  hostedJob: HostedSendJobSummary | null;
  onBatchProcessed: () => Promise<void>;
  selectedTenantId: string;
};

export function useHostedSendJobProcessor({
  enabled,
  hostedJob,
  onBatchProcessed,
  selectedTenantId
}: UseHostedSendJobProcessorInput) {
  const processingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !hostedJob || !selectedTenantId) return;
    if (hostedJob.status !== "QUEUED" && hostedJob.status !== "PROCESSING") return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const schedule = (delayMs: number) => {
      if (cancelled) return;
      timeoutId = setTimeout(() => {
        void tick();
      }, delayMs);
    };

    const tick = async () => {
      if (cancelled || processingRef.current) {
        schedule(POLL_MS);
        return;
      }
      processingRef.current = true;
      try {
        const { payload } = await processHostedSendJobBatch(hostedJob.id, selectedTenantId);
        await onBatchProcessed();
        if (cancelled) return;
        const stopReason = payload?.ok ? payload.result.stopReason : "provider_invalid";
        if (stopReason === "completed" || stopReason === "cancelled" || stopReason === "paused") {
          return;
        }
        schedule(POLL_MS);
      } finally {
        processingRef.current = false;
      }
    };

    schedule(POLL_MS);
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [enabled, hostedJob, onBatchProcessed, selectedTenantId]);
}
