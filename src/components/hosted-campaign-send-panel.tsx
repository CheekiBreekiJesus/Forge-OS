"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { panelClass } from "@/components/app-frame";
import { useHostedSendJobProcessor } from "@/components/use-hosted-send-job-processor";
import type { EmailProviderDiagnostic } from "@/domain/email-delivery-types";
import { fetchEmailProviderDiagnostic } from "@/features/outreach/protected-test-send-client-flow";
import {
  cancelHostedSendJob,
  fetchHostedCampaignSendJobs,
  hostedSendJobErrorMessage,
  isRealCampaignSendReadyFromDiagnostic,
  pauseHostedSendJob,
  queueHostedCampaignSendJob,
  resumeHostedSendJob,
  type HostedSendJobSummary
} from "@/features/outreach/hosted-send-job-client";
import {
  clampQueueBatchSize,
  validateQueueIntervalMinutes
} from "@/features/leadops/campaign-workflow";
import type { Dictionary } from "@/i18n/dictionaries";

type HostedCampaignSendPanelProps = {
  approvedCount: number;
  campaignId: string;
  canQueue: boolean;
  dictionary: Dictionary;
  isPrepared: boolean;
  selectedHostedTenantId: string;
  senderLabel: string;
  tenantReady: boolean;
};

type QueueMode = "simulation" | "brevo";

export function HostedCampaignSendPanel({
  approvedCount,
  campaignId,
  canQueue,
  dictionary,
  isPrepared,
  selectedHostedTenantId,
  senderLabel,
  tenantReady
}: HostedCampaignSendPanelProps) {
  const copy = dictionary.leadops.sendJobs.hostedSend;
  const sendCopy = dictionary.leadops.sendJobs;
  const [batchSize, setBatchSize] = useState(5);
  const [intervalMinutes, setIntervalMinutes] = useState(5);
  const [dailyLimit, setDailyLimit] = useState(25);
  const [queueMode, setQueueMode] = useState<QueueMode>("simulation");
  const [confirmation, setConfirmation] = useState("");
  const [diagnostic, setDiagnostic] = useState<EmailProviderDiagnostic | null>(null);
  const [hostedJob, setHostedJob] = useState<HostedSendJobSummary | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [queueing, setQueueing] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const realSendReady = isRealCampaignSendReadyFromDiagnostic(diagnostic);
  const intervalValidation = useMemo(
    () => validateQueueIntervalMinutes(intervalMinutes),
    [intervalMinutes]
  );
  const expectedConfirmation = queueMode === "brevo" ? "QUEUE BREVO" : "QUEUE SIMULATION";
  const confirmationMatches = confirmation.trim() === expectedConfirmation;

  const refreshHostedJobs = useCallback(async () => {
    if (!tenantReady || !selectedHostedTenantId) return;
    setLoadingJobs(true);
    try {
      const jobs = await fetchHostedCampaignSendJobs(campaignId, selectedHostedTenantId);
      setHostedJob(jobs[0] ?? null);
    } finally {
      setLoadingJobs(false);
    }
  }, [campaignId, selectedHostedTenantId, tenantReady]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next = await fetchEmailProviderDiagnostic();
      if (!cancelled) setDiagnostic(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void refreshHostedJobs();
  }, [refreshHostedJobs]);

  useHostedSendJobProcessor({
    enabled: tenantReady && Boolean(hostedJob),
    hostedJob,
    onBatchProcessed: refreshHostedJobs,
    selectedTenantId: selectedHostedTenantId
  });

  async function handleQueue() {
    if (!canQueue || !isPrepared || !intervalValidation.valid || !confirmationMatches) return;
    if (queueMode === "brevo" && !realSendReady) return;

    const summary = copy.finalConfirmation
      .replace("{provider}", queueMode === "brevo" ? "Brevo" : copy.simulationProvider)
      .replace("{sender}", senderLabel || copy.unknownSender)
      .replace("{count}", String(approvedCount));

    if (!window.confirm(summary)) return;

    setQueueing(true);
    setFeedback(null);
    try {
      const { payload, response } = await queueHostedCampaignSendJob({
        batchSize: clampQueueBatchSize(batchSize),
        campaignId,
        confirmation: expectedConfirmation,
        dailyLimit: queueMode === "brevo" ? Math.min(Math.max(dailyLimit, 1), 25) : undefined,
        delayMs: intervalValidation.delayMs,
        deliveryMode: queueMode,
        provider: queueMode,
        selectedTenantId: selectedHostedTenantId
      });
      if (!response.ok || !payload?.ok) {
        setFeedback(hostedSendJobErrorMessage(payload) ?? copy.queueFailed);
        return;
      }
      setHostedJob(payload.result.job);
      setFeedback(payload.result.alreadyQueued ? sendCopy.alreadyQueued : copy.queued);
      setConfirmation("");
      await refreshHostedJobs();
    } catch {
      setFeedback(copy.queueFailed);
    } finally {
      setQueueing(false);
    }
  }

  async function handlePause() {
    if (!hostedJob || !window.confirm(sendCopy.confirmPause)) return;
    const { payload } = await pauseHostedSendJob(hostedJob.id, "operator_pause", selectedHostedTenantId);
    if (payload?.ok) {
      setHostedJob(payload.result.job);
      setFeedback(sendCopy.pausedResult);
    }
  }

  async function handleResume() {
    if (!hostedJob) return;
    const { payload } = await resumeHostedSendJob(hostedJob.id, selectedHostedTenantId);
    if (payload?.ok) {
      setHostedJob(payload.result.job);
      setFeedback(sendCopy.resumedResult);
    }
  }

  async function handleCancel() {
    if (!hostedJob || !window.confirm(sendCopy.confirmCancel)) return;
    const { payload } = await cancelHostedSendJob(hostedJob.id, "operator_cancel", selectedHostedTenantId);
    if (payload?.ok) {
      setHostedJob(payload.result.job);
      setFeedback(sendCopy.cancelledResult);
    }
  }

  if (!tenantReady) {
    return (
      <section className={`${panelClass} p-5`} data-testid="hosted-send-panel">
        <h3 className="font-bold">{copy.title}</h3>
        <p className="mt-2 text-sm text-slate-400">{copy.authUnavailable}</p>
      </section>
    );
  }

  return (
    <section className={`${panelClass} p-5`} data-testid="hosted-send-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-bold">{copy.title}</h3>
          <p className="mt-2 text-sm text-slate-400">{copy.description}</p>
        </div>
      </div>

      <p
        className="mt-4 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-400"
        data-testid="hosted-send-persistence-notice"
      >
        {copy.persistenceNotice}
      </p>

      {!isPrepared ? (
        <p className="mt-3 text-sm text-amber-300" data-testid="hosted-send-needs-preparation">
          {copy.needsPreparation}
        </p>
      ) : null}

      <fieldset className="mt-4 text-sm">
        <legend className="text-slate-400">{copy.deliveryMode}</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2">
            <input
              checked={queueMode === "simulation"}
              data-testid="hosted-send-mode-simulation"
              name="hosted-send-mode"
              onChange={() => setQueueMode("simulation")}
              type="radio"
              value="simulation"
            />
            <span>{copy.modes.simulation}</span>
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              checked={queueMode === "brevo"}
              data-testid="hosted-send-mode-brevo"
              disabled={!realSendReady}
              name="hosted-send-mode"
              onChange={() => setQueueMode("brevo")}
              type="radio"
              value="brevo"
            />
            <span>{copy.modes.brevo}</span>
          </label>
        </div>
        {!realSendReady ? (
          <p className="mt-2 text-xs text-amber-300" data-testid="hosted-send-brevo-unavailable">
            {copy.brevoUnavailable}
          </p>
        ) : (
          <p className="mt-2 text-xs text-amber-300" data-testid="hosted-send-brevo-warning">
            {copy.brevoWarning}
          </p>
        )}
      </fieldset>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm">
          <span className="text-slate-400">{copy.batchSize}</span>
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
            data-testid="hosted-send-batch-size"
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
            data-testid="hosted-send-interval-minutes"
            max={60}
            min={0}
            onChange={(event) => setIntervalMinutes(Number(event.target.value))}
            type="number"
            value={intervalMinutes}
          />
        </label>
        {queueMode === "brevo" ? (
          <label className="block text-sm">
            <span className="text-slate-400">{copy.dailyLimit}</span>
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
              data-testid="hosted-send-daily-limit"
              max={25}
              min={1}
              onChange={(event) => setDailyLimit(Number(event.target.value))}
              type="number"
              value={dailyLimit}
            />
          </label>
        ) : null}
        <label className="block text-sm md:col-span-2">
          <span className="text-slate-400">{copy.confirmationLabel.replace("{phrase}", expectedConfirmation)}</span>
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
            data-testid="hosted-send-confirmation"
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={expectedConfirmation}
            value={confirmation}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="rounded border border-slate-700 px-3 py-1 text-sm text-slate-300"
          data-testid="hosted-send-refresh"
          disabled={loadingJobs}
          onClick={() => void refreshHostedJobs()}
          type="button"
        >
          {copy.refresh}
        </button>
        <button
          className="rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          data-testid={queueMode === "brevo" ? "queue-brevo-campaign-send" : "queue-hosted-simulation-send"}
          disabled={
            !canQueue ||
            !isPrepared ||
            queueing ||
            !intervalValidation.valid ||
            !confirmationMatches ||
            (queueMode === "brevo" && !realSendReady)
          }
          onClick={() => void handleQueue()}
          type="button"
        >
          {queueing ? copy.queueing : queueMode === "brevo" ? copy.queueBrevo : copy.queueSimulation}
        </button>
        {hostedJob ? (
          <>
            <button
              className="rounded border border-slate-700 px-3 py-1 text-sm disabled:opacity-50"
              data-testid="hosted-send-pause"
              disabled={hostedJob.status !== "QUEUED"}
              onClick={() => void handlePause()}
              type="button"
            >
              {sendCopy.pause}
            </button>
            <button
              className="rounded border border-slate-700 px-3 py-1 text-sm disabled:opacity-50"
              data-testid="hosted-send-resume"
              disabled={hostedJob.status !== "PAUSED"}
              onClick={() => void handleResume()}
              type="button"
            >
              {sendCopy.resume}
            </button>
            <button
              className="rounded border border-red-500 px-3 py-1 text-sm text-red-300 disabled:opacity-50"
              data-testid="hosted-send-cancel"
              disabled={hostedJob.status === "COMPLETED" || hostedJob.status === "CANCELLED"}
              onClick={() => void handleCancel()}
              type="button"
            >
              {sendCopy.cancel}
            </button>
          </>
        ) : null}
      </div>

      {hostedJob ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="hosted-send-job-status">
          <StatusItem label={sendCopy.status} testId="hosted-send-job-status-value" value={hostedJob.status} />
          <StatusItem label={sendCopy.mode} value={hostedJob.deliveryMode} />
          <StatusItem label={sendCopy.provider} value={hostedJob.provider} />
          <StatusItem label={sendCopy.processed} testId="hosted-send-job-processed" value={String(hostedJob.processedCount)} />
          <StatusItem label={sendCopy.sent} testId="hosted-send-job-sent" value={String(hostedJob.sentCount)} />
          <StatusItem label={sendCopy.failed} value={String(hostedJob.failedCount)} />
          <StatusItem label={sendCopy.remaining} value={String(hostedJob.remainingCount)} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-500" data-testid="hosted-send-empty">
          {copy.empty}
        </p>
      )}

      {feedback ? (
        <p className="mt-3 text-sm text-green-400" data-testid="hosted-send-feedback">
          {feedback}
        </p>
      ) : (
        <p className="mt-3 text-xs text-slate-500">{copy.autoProcessingHint}</p>
      )}
    </section>
  );
}

function StatusItem({
  label,
  testId,
  value
}: {
  label: string;
  testId?: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold" data-testid={testId}>
        {value}
      </p>
    </div>
  );
}
