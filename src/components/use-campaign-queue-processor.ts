"use client";

import { useEffect, useRef } from "react";
import { processNextCampaignBatch } from "@/application/campaign-send-job-service";
import type { OutreachSendJob } from "@/domain/send-job-types";
import type { SendJobDeliveryProvider } from "@/domain/send-job-types";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";

const POLL_MS = 2_000;

type UseCampaignQueueProcessorInput = {
  enabled: boolean;
  latestSendJob: OutreachSendJob | null;
  onBatchProcessed: () => Promise<void>;
  provider: SendJobDeliveryProvider;
  repos: LocalRepositoryBundle | null;
  tenantId: string;
};

export function useCampaignQueueProcessor({
  enabled,
  latestSendJob,
  onBatchProcessed,
  provider,
  repos,
  tenantId
}: UseCampaignQueueProcessorInput) {
  const processingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !latestSendJob || !repos) return;
    if (latestSendJob.status !== "QUEUED" && latestSendJob.status !== "PROCESSING") return;

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
        const result = await processNextCampaignBatch(repos, provider, {
          sendJobId: latestSendJob.id,
          tenantId
        });
        await onBatchProcessed();
        if (cancelled) return;
        if (result.stopReason === "completed" || result.stopReason === "cancelled" || result.stopReason === "paused") {
          return;
        }
        const waitMs =
          result.stopReason === "scheduled"
            ? POLL_MS
            : Math.max(latestSendJob.delayMs, POLL_MS);
        schedule(waitMs);
      } finally {
        processingRef.current = false;
      }
    };

    schedule(POLL_MS);
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [enabled, latestSendJob, onBatchProcessed, provider, repos, tenantId]);
}
