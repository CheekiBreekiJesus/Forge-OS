"use client";

import React, { useMemo, useState } from "react";
import { evaluateCampaignQueueEligibility, queueCampaignSendJob } from "@/application/campaign-send-job-service";
import { panelClass } from "@/components/app-frame";
import type { OutreachCampaign } from "@/domain/campaign-types";
import type { SendJobEligibilityResult } from "@/domain/send-job-types";
import {
  buildScheduledStartIso,
  clampQueueBatchSize,
  validateQueueIntervalMinutes
} from "@/features/leadops/campaign-workflow";
import type { Dictionary } from "@/i18n/dictionaries";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";

type CampaignQueueSendPanelProps = {
  campaign: OutreachCampaign;
  campaignId: string;
  dictionary: Dictionary;
  approvedCount: number;
  canQueue: boolean;
  onQueued: (message: string) => Promise<void>;
  repos: LocalRepositoryBundle;
  tenantId: string;
};

type StartMode = "now" | "scheduled";

export function CampaignQueueSendPanel({
  campaign,
  campaignId,
  dictionary,
  approvedCount,
  canQueue,
  onQueued,
  repos,
  tenantId
}: CampaignQueueSendPanelProps) {
  const copy = dictionary.leadops.sendJobs.queueSend;
  const [batchSize, setBatchSize] = useState(5);
  const [intervalMinutes, setIntervalMinutes] = useState(5);
  const [startMode, setStartMode] = useState<StartMode>("now");
  const [scheduledLocalTime, setScheduledLocalTime] = useState("");
  const [eligibility, setEligibility] = useState<SendJobEligibilityResult | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [queueing, setQueueing] = useState(false);

  const intervalValidation = useMemo(
    () => validateQueueIntervalMinutes(intervalMinutes),
    [intervalMinutes]
  );

  const scheduledStartIso = useMemo(() => {
    if (startMode !== "scheduled" || !scheduledLocalTime.trim()) return null;
    return buildScheduledStartIso(scheduledLocalTime);
  }, [scheduledLocalTime, startMode]);

  const scheduleInvalid = startMode === "scheduled" && scheduledLocalTime.trim() && !scheduledStartIso;

  async function refreshEligibility() {
    const next = await evaluateCampaignQueueEligibility(repos, {
      batchSize,
      campaignId,
      delayMs: intervalValidation.valid ? intervalValidation.delayMs : undefined,
      deliveryMode: "simulation",
      provider: "simulation",
      tenantId
    });
    setEligibility(next);
    return next;
  }

  async function handleQueue() {
    if (!canQueue || !intervalValidation.valid || scheduleInvalid) return;
    setQueueing(true);
    setFeedback(null);
    try {
      const nextEligibility = await refreshEligibility();
      if (!nextEligibility.canQueue) {
        setFeedback(copy.notEligible);
        return;
      }
      const result = await queueCampaignSendJob(repos, {
        batchSize: clampQueueBatchSize(batchSize),
        campaignId,
        confirmation: "QUEUE SIMULATION",
        delayMs: intervalValidation.delayMs,
        deliveryMode: "simulation",
        provider: "simulation",
        scheduledStartAt: startMode === "scheduled" ? scheduledStartIso : null,
        tenantId
      });
      setEligibility(result.eligibility);
      await onQueued(result.alreadyQueued ? dictionary.leadops.sendJobs.alreadyQueued : copy.queued);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : copy.queueFailed);
    } finally {
      setQueueing(false);
    }
  }

  return (
    <section className={`${panelClass} p-5 xl:col-span-2`} data-testid="campaign-workflow-step-queue">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-300">{copy.stepLabel}</p>
          <h2 className="mt-1 text-lg font-bold">{copy.title}</h2>
          <p className="mt-2 text-sm text-slate-400">{copy.description}</p>
        </div>
      </div>

      <p
        className="mt-4 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-400"
        data-testid="queue-local-mvp-notice"
      >
        {copy.localMvpNotice}
      </p>

      <p
        className="mt-3 rounded border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200"
        data-testid="queue-real-send-warning"
      >
        {copy.realSendDisabledWarning}
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm">
          <span className="text-slate-400">{copy.batchSize}</span>
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
            data-testid="queue-batch-size"
            max={100}
            min={1}
            onChange={(event) => setBatchSize(Number(event.target.value))}
            type="number"
            value={batchSize}
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">{copy.intervalMinutes}</span>
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
            data-testid="queue-interval-minutes"
            max={60}
            min={0}
            onChange={(event) => setIntervalMinutes(Number(event.target.value))}
            type="number"
            value={intervalMinutes}
          />
          {!intervalValidation.valid ? (
            <span className="mt-1 block text-xs text-red-300" data-testid="queue-interval-error">
              {copy.intervalError}
            </span>
          ) : null}
        </label>
        <fieldset className="text-sm md:col-span-2">
          <legend className="text-slate-400">{copy.startTime}</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2">
              <input
                checked={startMode === "now"}
                data-testid="queue-start-now"
                name="queue-start-mode"
                onChange={() => setStartMode("now")}
                type="radio"
                value="now"
              />
              <span>{copy.startNow}</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                checked={startMode === "scheduled"}
                data-testid="queue-start-scheduled"
                name="queue-start-mode"
                onChange={() => setStartMode("scheduled")}
                type="radio"
                value="scheduled"
              />
              <span>{copy.startScheduled}</span>
            </label>
          </div>
          {startMode === "scheduled" ? (
            <input
              className="mt-2 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
              data-testid="queue-scheduled-time"
              onChange={(event) => setScheduledLocalTime(event.target.value)}
              type="datetime-local"
              value={scheduledLocalTime}
            />
          ) : null}
          {scheduleInvalid ? (
            <p className="mt-1 text-xs text-red-300" data-testid="queue-schedule-error">
              {copy.scheduleError}
            </p>
          ) : null}
        </fieldset>
      </div>

      <div
        className="mt-4 rounded border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300"
        data-testid="queue-safety-summary"
      >
        <p className="font-semibold text-slate-100">{copy.safetyTitle}</p>
        <p className="mt-2" data-testid="queue-approved-count">
          {copy.approvedDrafts.replace("{count}", String(approvedCount))}
        </p>
        <p className="mt-1" data-testid="queue-eligible-count">
          {copy.eligibleRecipients.replace(
            "{count}",
            String(eligibility?.eligibleRecipients.length ?? approvedCount)
          )}
        </p>
        {eligibility && eligibility.excludedRecipients.length > 0 ? (
          <p className="mt-1 text-amber-300" data-testid="queue-excluded-summary">
            {copy.excludedRecipients.replace("{count}", String(eligibility.excludedRecipients.length))}
          </p>
        ) : null}
        {!canQueue ? <p className="mt-2 text-orange-300">{copy.needsApproval}</p> : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="rounded border border-slate-700 px-3 py-1 text-sm text-slate-300"
          data-testid="queue-refresh-eligibility"
          onClick={() => void refreshEligibility()}
          type="button"
        >
          {copy.refreshEligibility}
        </button>
        <button
          className="rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="queue-campaign-send"
          disabled={
            !canQueue ||
            queueing ||
            !intervalValidation.valid ||
            scheduleInvalid ||
            campaign.status !== "approved"
          }
          onClick={() => void handleQueue()}
          type="button"
        >
          {queueing ? copy.queueing : copy.queueAction}
        </button>
      </div>

      {feedback ? (
        <p className="mt-3 text-sm text-green-400" data-testid="queue-send-feedback">
          {feedback}
        </p>
      ) : null}
    </section>
  );
}
