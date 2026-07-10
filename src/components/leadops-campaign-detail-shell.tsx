"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  refreshCampaignRecipients
} from "@/application/campaign-segmentation-service";
import {
  cancelSendJob,
  pauseSendJob,
  processNextCampaignBatch,
  resumeSendJob
} from "@/application/campaign-send-job-service";
import { CampaignQueueSendPanel } from "@/components/campaign-queue-send-panel";
import { HostedCampaignSendPanel } from "@/components/hosted-campaign-send-panel";
import { CampaignTemplateDraftsPanel } from "@/components/campaign-template-drafts-panel";
import {
  CampaignWorkflowStepper,
  deriveActiveWorkflowStep
} from "@/components/campaign-workflow-stepper";
import { useCampaignQueueProcessor } from "@/components/use-campaign-queue-processor";
import { AppFrame, panelClass } from "@/components/app-frame";
import {
  buildApprovalContentHash,
  computeCampaignProgress,
  deriveCampaignStatus
} from "@/application/campaign-approval-service";
import { loadSenderContext } from "@/application/campaign-sender-context";
import type { CampaignRecipient, OutreachCampaign } from "@/domain/campaign-types";
import type {
  EmailDeliveryRequest,
  EmailProviderDiagnostic,
  OutreachProviderEvent
} from "@/domain/email-delivery-types";
import type {
  OutreachSendJob,
  OutreachSendJobRecipient,
  SendJobDeliveryProvider
} from "@/domain/send-job-types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { usePersistence } from "@/persistence/provider";

type LeadOpsCampaignDetailShellProps = {
  dictionary: Dictionary;
  locale: Locale;
  campaignId: string;
};

type HostedTenantMembership = {
  tenantId: string;
  roles: string[];
  permissions: string[];
};

type HostedPreparationStatus = {
  activity: Array<{ action: string; occurredAt: string; title: string }>;
  campaignId: string;
  preparedAt: string | null;
  preparedBy: string | null;
  preparedRecipients: number;
  snapshotFingerprint: string | null;
  status: "not_prepared" | "prepared";
};

type HostedPreparationUiState = "not_prepared" | "loading" | "preparing" | "prepared" | "failed" | "stale";

export function LeadOpsCampaignDetailShell({
  dictionary,
  locale,
  campaignId
}: LeadOpsCampaignDetailShellProps) {
  const copy = dictionary.leadops;
  const { state, tenantId, dataVersion, notifyDataChanged } = usePersistence();
  const [campaign, setCampaign] = useState<OutreachCampaign | null>(null);
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);
  const [providerEvents, setProviderEvents] = useState<OutreachProviderEvent[]>([]);
  const [sendJobs, setSendJobs] = useState<OutreachSendJob[]>([]);
  const [sendJobRecipients, setSendJobRecipients] = useState<OutreachSendJobRecipient[]>([]);
  const [sendJobResult, setSendJobResult] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [refreshDiff, setRefreshDiff] = useState<string | null>(null);
  const [confirmRefresh, setConfirmRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hostedMemberships, setHostedMemberships] = useState<HostedTenantMembership[]>([]);
  const [selectedHostedTenantId, setSelectedHostedTenantId] = useState("");
  const [hostedPreparationStatus, setHostedPreparationStatus] = useState<HostedPreparationStatus | null>(null);
  const [hostedPreparationUiState, setHostedPreparationUiState] =
    useState<HostedPreparationUiState>("loading");
  const [hostedPreparationMessage, setHostedPreparationMessage] = useState<string | null>(null);
  const [senderLabel, setSenderLabel] = useState("");

  useEffect(() => {
    if (state.status !== "ready") return;
    let cancelled = false;
    void (async () => {
      const row = await state.repos.campaigns.getById(tenantId, campaignId);
      const snapshot = await state.repos.campaignRecipients.listForCampaign(tenantId, campaignId);
      const events = await state.repos.outreachProviderEvents.listRecent(tenantId, 25);
      const jobs = await state.repos.outreachSendJobs.listForCampaign(tenantId, campaignId);
      const latestJob = jobs.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      const jobRecipients = latestJob
        ? await state.repos.outreachSendJobRecipients.listForJob(tenantId, latestJob.id)
        : [];
      if (cancelled) return;
      setCampaign(row);
      setRecipients(snapshot);
      setProviderEvents(events.filter((event) => event.campaignId === campaignId));
      setSendJobs(jobs);
      setSendJobRecipients(jobRecipients);
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId, dataVersion, state, tenantId]);

  const reloadSnapshot = useCallback(async () => {
    if (state.status !== "ready") return;
    const row = await state.repos.campaigns.getById(tenantId, campaignId);
    const snapshot = await state.repos.campaignRecipients.listForCampaign(tenantId, campaignId);
    const events = await state.repos.outreachProviderEvents.listRecent(tenantId, 25);
    const jobs = await state.repos.outreachSendJobs.listForCampaign(tenantId, campaignId);
    const latestJob = jobs.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const jobRecipients = latestJob
      ? await state.repos.outreachSendJobRecipients.listForJob(tenantId, latestJob.id)
      : [];
    setCampaign(row);
    setRecipients(snapshot);
    setProviderEvents(events.filter((event) => event.campaignId === campaignId));
    setSendJobs(jobs);
    setSendJobRecipients(jobRecipients);
  }, [campaignId, state, tenantId]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/outreach/send-jobs/tenant-memberships");
        const payload = (await response.json().catch(() => null)) as
          | { ok: true; result: { memberships: HostedTenantMembership[]; selectedTenantId: string | null } }
          | { ok: false; error?: { message?: string } }
          | null;
        if (cancelled) return;
        if (!response.ok || !payload || !payload.ok) {
          setHostedPreparationUiState("failed");
          setHostedPreparationMessage(hostedErrorMessage(payload) ?? copy.sendJobs.hostedPreparation.authUnavailable);
          return;
        }
        setHostedMemberships(payload.result.memberships);
        setSelectedHostedTenantId(payload.result.selectedTenantId ?? payload.result.memberships[0]?.tenantId ?? "");
      } catch {
        if (!cancelled) {
          setHostedPreparationUiState("failed");
          setHostedPreparationMessage(copy.sendJobs.hostedPreparation.authUnavailable);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [copy.sendJobs.hostedPreparation.authUnavailable]);

  const refreshHostedPreparationStatus = useCallback(async (
    tenantIdForSelection = selectedHostedTenantId,
    options: { cancelled?: boolean; preserveMessage?: boolean } = {}
  ) => {
    if (!campaign || !tenantIdForSelection) return;
    try {
      const response = await fetch(
        `/api/outreach/send-jobs/prepare-campaign/status?campaignId=${encodeURIComponent(campaign.id)}`,
        { headers: { "x-forgeos-selected-tenant-id": tenantIdForSelection } }
      );
      const payload = (await response.json().catch(() => null)) as
        | { ok: true; result: HostedPreparationStatus }
        | { ok: false; error?: { message?: string } }
        | null;
      if (options.cancelled) return;
      if (!response.ok || !payload || !payload.ok) {
        setHostedPreparationStatus(null);
        setHostedPreparationUiState("failed");
        setHostedPreparationMessage(hostedErrorMessage(payload) ?? copy.sendJobs.hostedPreparation.statusFailed);
        return;
      }
      setHostedPreparationStatus(payload.result);
      if (!options.preserveMessage) setHostedPreparationMessage(null);
      setHostedPreparationUiState(payload.result.status === "prepared" ? "prepared" : "not_prepared");
    } catch {
      if (!options.cancelled) {
        setHostedPreparationStatus(null);
        setHostedPreparationUiState("failed");
        setHostedPreparationMessage(copy.sendJobs.hostedPreparation.statusFailed);
      }
    }
  }, [campaign, copy.sendJobs.hostedPreparation.statusFailed, selectedHostedTenantId]);

  useEffect(() => {
    if (!campaign || !selectedHostedTenantId) return;
    const cancellation = { cancelled: false };
    queueMicrotask(() => {
      if (cancellation.cancelled) return;
      setHostedPreparationUiState("loading");
      void refreshHostedPreparationStatus(selectedHostedTenantId, cancellation);
    });
    return () => {
      cancellation.cancelled = true;
    };
  }, [campaign, campaignId, selectedHostedTenantId, refreshHostedPreparationStatus]);

  useEffect(() => {
    if (state.status !== "ready" || !campaign) return;
    let cancelled = false;
    void (async () => {
      const senderContext = await loadSenderContext(state.repos, tenantId, campaign);
      if (cancelled) return;
      setSenderLabel(senderContext.sender.displayName || senderContext.sender.fromEmail || "");
    })();
    return () => {
      cancelled = true;
    };
  }, [campaign, state, tenantId]);

  const included = useMemo(() => recipients.filter((row) => row.status === "included"), [recipients]);
  const excluded = useMemo(() => recipients.filter((row) => row.status === "excluded"), [recipients]);
  const progress = useMemo(() => computeCampaignProgress(recipients), [recipients]);
  const progressCopy = copy.campaigns.progress;
  const latestSendJob = useMemo(
    () => sendJobs.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null,
    [sendJobs]
  );
  const sendJobCopy = copy.sendJobs;
  const derivedCampaignStatus = useMemo(
    () => (campaign ? deriveCampaignStatus(campaign, recipients) : null),
    [campaign, recipients]
  );
  const approvedIncludedRecipients = useMemo(
    () => included.filter((recipient) => recipient.draftStatus === "APPROVED"),
    [included]
  );
  const staleApprovedRecipients = useMemo(
    () =>
      approvedIncludedRecipients.filter(
        (recipient) => !recipient.approvalContentHash || buildApprovalContentHash(recipient) !== recipient.approvalContentHash
      ),
    [approvedIncludedRecipients]
  );
  const hostedPreparationCopy = sendJobCopy.hostedPreparation;
  const canPrepareForHostedSending =
    Boolean(campaign) &&
    derivedCampaignStatus === "approved" &&
    campaign?.deliveryMode === "simulation" &&
    approvedIncludedRecipients.length > 0 &&
    staleApprovedRecipients.length === 0 &&
    Boolean(selectedHostedTenantId);
  const effectiveHostedPreparationUiState =
    hostedPreparationUiState === "prepared" &&
    hostedPreparationStatus &&
    hostedPreparationStatus.preparedRecipients !== approvedIncludedRecipients.length
      ? "stale"
      : hostedPreparationUiState;

  const draftedCount = useMemo(
    () => included.filter((recipient) => recipient.draftStatus !== "PENDING").length,
    [included]
  );
  const activeWorkflowStep = useMemo(
    () =>
      deriveActiveWorkflowStep({
        approvedCount: approvedIncludedRecipients.length,
        hasDrafts: draftedCount > 0,
        hasQueuedJob: Boolean(latestSendJob),
        includedCount: included.length,
        jobCompleted: latestSendJob?.status === "COMPLETED"
      }),
    [approvedIncludedRecipients.length, draftedCount, included.length, latestSendJob]
  );

  const handleBatchProcessed = useCallback(async () => {
    notifyDataChanged();
    await reloadSnapshot();
  }, [notifyDataChanged, reloadSnapshot]);

  const simulationProvider = useMemo(() => new LocalSimulationProvider(), []);

  useCampaignQueueProcessor({
    enabled: state.status === "ready",
    latestSendJob,
    onBatchProcessed: handleBatchProcessed,
    provider: simulationProvider,
    repos: state.status === "ready" ? state.repos : null,
    tenantId
  });

  async function handleRefresh() {
    if (state.status !== "ready" || !campaign || campaign.status !== "draft") return;
    setRefreshing(true);
    try {
      const { diff } = await refreshCampaignRecipients(state.repos, tenantId, campaignId);
      notifyDataChanged();
      await reloadSnapshot();
      setRefreshDiff(
        copy.campaigns.refreshSummary
          .replace("{added}", String(diff.added))
          .replace("{removed}", String(diff.removed))
          .replace("{suppressed}", String(diff.newlySuppressed))
          .replace("{invalid}", String(diff.newlyInvalid))
      );
      setConfirmRefresh(false);
    } finally {
      setRefreshing(false);
    }
  }

  async function handlePrepareForHostedSending() {
    if (state.status !== "ready" || !campaign || !canPrepareForHostedSending) return;
    setHostedPreparationUiState("preparing");
    setHostedPreparationMessage(null);
    try {
      const senderContext = await loadSenderContext(state.repos, tenantId, campaign);
      if (!senderContext.ready) {
        setHostedPreparationUiState("failed");
        setHostedPreparationMessage(hostedPreparationCopy.senderIncomplete);
        return;
      }
      const response = await fetch("/api/outreach/send-jobs/prepare-campaign", {
        body: JSON.stringify({
          campaign,
          company: {
            generalEmail: senderContext.company.generalEmail,
            legalFooter: senderContext.company.legalFooter,
            legalName: senderContext.company.legalName,
            tradingName: senderContext.company.tradingName,
            websiteUrl: senderContext.company.websiteUrl
          },
          recipients: approvedIncludedRecipients,
          sender: {
            displayName: senderContext.sender.displayName,
            fromEmail: senderContext.sender.fromEmail,
            id: senderContext.sender.id,
            replyToEmail: senderContext.sender.replyToEmail,
            signatureHtml: senderContext.sender.signatureHtml,
            signatureText: senderContext.sender.signatureText
          }
        }),
        headers: {
          "content-type": "application/json",
          "x-forgeos-selected-tenant-id": selectedHostedTenantId
        },
        method: "POST"
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            ok: true;
            result: {
              preparedAt: string;
              preparedRecipients: number;
              reused: boolean;
            };
          }
        | { ok: false; error?: { message?: string } }
        | null;
      if (!response.ok || !payload || !payload.ok) {
        setHostedPreparationUiState("failed");
        setHostedPreparationMessage(hostedErrorMessage(payload) ?? hostedPreparationCopy.prepareFailed);
        return;
      }
      setHostedPreparationUiState("prepared");
      setHostedPreparationMessage(
        payload.result.reused
          ? hostedPreparationCopy.reusedPrepared
          : hostedPreparationCopy.createdPrepared.replace("{count}", String(payload.result.preparedRecipients))
      );
      await refreshHostedPreparationStatus(selectedHostedTenantId, { preserveMessage: true });
    } catch {
      setHostedPreparationUiState("failed");
      setHostedPreparationMessage(hostedPreparationCopy.prepareFailed);
    }
  }

  async function handleQueueComplete(message: string) {
    setSendJobResult(message);
    notifyDataChanged();
    await reloadSnapshot();
  }

  async function handleProcessBatch() {
    if (state.status !== "ready" || !latestSendJob) return;
    const result = await processNextCampaignBatch(state.repos, new LocalSimulationProvider(), {
      sendJobId: latestSendJob.id,
      tenantId
    });
    setSendJobResult(`${result.stopReason}: ${result.processed}`);
    notifyDataChanged();
    await reloadSnapshot();
  }

  async function handlePauseJob() {
    if (state.status !== "ready" || !latestSendJob) return;
    if (!window.confirm(sendJobCopy.confirmPause)) return;
    await pauseSendJob(state.repos, tenantId, latestSendJob.id, "local-user", "operator_pause");
    setSendJobResult(sendJobCopy.pausedResult);
    notifyDataChanged();
    await reloadSnapshot();
  }

  async function handleResumeJob() {
    if (state.status !== "ready" || !latestSendJob) return;
    await resumeSendJob(state.repos, tenantId, latestSendJob.id, "local-user");
    setSendJobResult(sendJobCopy.resumedResult);
    notifyDataChanged();
    await reloadSnapshot();
  }

  async function handleCancelJob() {
    if (state.status !== "ready" || !latestSendJob) return;
    if (!window.confirm(sendJobCopy.confirmCancel)) return;
    await cancelSendJob(state.repos, tenantId, latestSendJob.id, "local-user", "operator_cancel");
    setSendJobResult(sendJobCopy.cancelledResult);
    notifyDataChanged();
    await reloadSnapshot();
  }

  if (!campaign) {
    return (
      <AppFrame activeModule="marketing" dictionary={dictionary} locale={locale} supplementalRoute="leadops">
        <div className={`${panelClass} p-8 text-center text-slate-400`}>{dictionary.demoWorkflow.persistence.loading}</div>
      </AppFrame>
    );
  }

  return (
    <AppFrame activeModule="marketing" dictionary={dictionary} locale={locale} supplementalRoute="leadops">
      <section className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-300">{copy.campaigns.eyebrow}</p>
        <h1 className="mt-2 text-2xl font-bold" data-testid="campaign-detail-name">
          {campaign.name}
        </h1>
        <p className="mt-2 text-sm text-slate-400">{campaign.description || copy.campaigns.noDescription}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <a className="text-orange-300 hover:underline" href={`/${locale}/leadops/campaigns`}>
            {copy.campaigns.backToList}
          </a>
          <a className="text-orange-300 hover:underline" href={`/${locale}/leadops`}>
            {copy.backToDashboard}
          </a>
        </div>
      </section>

      <CampaignWorkflowStepper activeStep={activeWorkflowStep} dictionary={dictionary} />

      <div className="grid gap-4 xl:grid-cols-2">
        {state.status === "ready" ? (
          <CampaignTemplateDraftsPanel
            campaign={campaign}
            campaignId={campaignId}
            dictionary={dictionary}
            locale={locale}
            onCampaignUpdated={setCampaign}
            onNotify={notifyDataChanged}
            onRecipientsUpdated={setRecipients}
            recipients={recipients}
            repos={state.repos}
            tenantId={tenantId}
          />
        ) : null}

        {state.status === "ready" ? (
          <CampaignQueueSendPanel
            approvedCount={approvedIncludedRecipients.length}
            campaign={campaign}
            campaignId={campaignId}
            canQueue={derivedCampaignStatus === "approved" && staleApprovedRecipients.length === 0}
            dictionary={dictionary}
            onQueued={handleQueueComplete}
            repos={state.repos}
            tenantId={tenantId}
          />
        ) : null}

        <section
          className={`${panelClass} p-5 xl:col-span-2`}
          data-testid="campaign-workflow-step-delivery"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-300">
            {copy.campaigns.workflow.steps.delivery}
          </p>
          <div className="mt-3" data-testid="send-job-panel">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{sendJobCopy.title}</h2>
                <p className="mt-2 text-sm text-slate-400">{sendJobCopy.description}</p>
                <p
                  className="mt-2 rounded border border-orange-500/40 bg-orange-500/10 px-3 py-2 text-xs text-orange-200"
                  data-testid="send-job-simulation-banner"
                >
                  {sendJobCopy.simulationBanner}
                </p>
                <p
                  className="mt-2 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-400"
                  data-testid="send-job-local-mvp-notice"
                >
                  {sendJobCopy.localMvpNotice}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded border border-slate-700 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  data-testid="process-next-send-batch"
                  disabled={
                    !latestSendJob ||
                    latestSendJob.status === "COMPLETED" ||
                    latestSendJob.status === "CANCELLED" ||
                    latestSendJob.status === "PAUSED"
                  }
                  onClick={() => void handleProcessBatch()}
                  type="button"
                >
                  {sendJobCopy.processNextBatch}
                </button>
                <button
                  className="rounded border border-slate-700 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  data-testid="pause-send-job"
                  disabled={!latestSendJob || latestSendJob.status !== "QUEUED"}
                  onClick={() => void handlePauseJob()}
                  type="button"
                >
                  {sendJobCopy.pause}
                </button>
                <button
                  className="rounded border border-slate-700 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  data-testid="resume-send-job"
                  disabled={!latestSendJob || latestSendJob.status !== "PAUSED"}
                  onClick={() => void handleResumeJob()}
                  type="button"
                >
                  {sendJobCopy.resume}
                </button>
                <button
                  className="rounded border border-red-500 px-3 py-1 text-sm text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                  data-testid="cancel-send-job"
                  disabled={!latestSendJob || latestSendJob.status === "COMPLETED" || latestSendJob.status === "CANCELLED"}
                  onClick={() => void handleCancelJob()}
                  type="button"
                >
                  {sendJobCopy.cancel}
                </button>
              </div>
            </div>
            {latestSendJob ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ProgressItem label={sendJobCopy.status} testId="send-job-status" value={latestSendJob.status} />
                <ProgressItem label={sendJobCopy.batchSize} testId="send-job-batch-size" value={latestSendJob.batchSize} />
                <ProgressItem
                  label={sendJobCopy.intervalMinutes}
                  testId="send-job-interval-minutes"
                  value={Math.round(latestSendJob.delayMs / 60_000)}
                />
                <ProgressItem label={sendJobCopy.processed} testId="send-job-processed" value={latestSendJob.processedCount} />
                <ProgressItem label={sendJobCopy.sent} testId="send-job-sent" value={latestSendJob.sentCount} />
                <ProgressItem label={sendJobCopy.failed} testId="send-job-failed" value={latestSendJob.failedCount} />
                <ProgressItem label={sendJobCopy.retryPending} testId="send-job-retry" value={latestSendJob.retryPendingCount} />
                <ProgressItem label={sendJobCopy.skipped} testId="send-job-skipped" value={latestSendJob.skippedCount} />
                <ProgressItem label={sendJobCopy.remaining} testId="send-job-remaining" value={latestSendJob.remainingCount} />
                <ProgressItem label={sendJobCopy.lock} value={latestSendJob.lockOwner ? sendJobCopy.processing : sendJobCopy.queued} />
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">{sendJobCopy.empty}</p>
            )}
            {latestSendJob ? (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-slate-400">
                    <tr>
                      <th className="px-3 py-2">{copy.table.email}</th>
                      <th className="px-3 py-2">{sendJobCopy.status}</th>
                      <th className="px-3 py-2">{sendJobCopy.provider}</th>
                      <th className="px-3 py-2">{sendJobCopy.lastProcessed}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sendJobRecipients.slice(0, 8).map((recipient) => (
                      <tr className="border-t border-slate-800" key={recipient.id}>
                        <td className="px-3 py-2">{recipient.normalizedEmail}</td>
                        <td className="px-3 py-2">{recipient.status}</td>
                        <td className="px-3 py-2">{latestSendJob.provider}</td>
                        <td className="px-3 py-2">
                          {recipient.completedAt ? formatCampaignDateTime(recipient.completedAt, locale) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            {sendJobResult ? (
              <p className="mt-3 text-sm text-green-400">
                {sendJobCopy.result}: {sendJobResult}
              </p>
            ) : (
              <p className="mt-3 text-xs text-slate-500">{sendJobCopy.autoProcessingHint}</p>
            )}
          </div>

          <div className="mt-6" data-testid="provider-events-panel">
            <h3 className="text-base font-bold">{copy.providerEvents.title}</h3>
            <p className="mt-2 text-sm text-slate-400">{copy.providerEvents.description}</p>
            {providerEvents.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">{copy.providerEvents.empty}</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-slate-400">
                    <tr>
                      <th className="px-3 py-2">{copy.providerEvents.eventType}</th>
                      <th className="px-3 py-2">{copy.providerEvents.status}</th>
                      <th className="px-3 py-2">{copy.providerEvents.effect}</th>
                      <th className="px-3 py-2">{copy.providerEvents.message}</th>
                      <th className="px-3 py-2">{copy.providerEvents.receivedAt}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providerEvents.map((event) => (
                      <tr className="border-t border-slate-800" key={event.id}>
                        <td className="px-3 py-2">{event.eventType}</td>
                        <td className="px-3 py-2">{event.processingStatus}</td>
                        <td className="px-3 py-2">{event.effect}</td>
                        <td className="px-3 py-2">{event.providerMessageId ? "recorded" : "unmatched"}</td>
                        <td className="px-3 py-2">{formatCampaignDateTime(event.receivedAt, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6" data-testid="campaign-progress-panel">
            <h3 className="text-base font-bold">{progressCopy.title}</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <ProgressItem label={progressCopy.total} value={progress.total} />
              <ProgressItem label={progressCopy.drafted} value={progress.drafted} />
              <ProgressItem label={progressCopy.needsReview} value={progress.needsReview} />
              <ProgressItem label={progressCopy.approved} value={progress.approved} />
              <ProgressItem label={progressCopy.openedExternally} value={progress.openedExternally} />
              <ProgressItem label={progressCopy.manuallySent} value={progress.manuallySent} />
              <ProgressItem label={progressCopy.excluded} value={progress.excluded} />
              <ProgressItem label={progressCopy.suppressed} value={progress.suppressed} />
              <ProgressItem label={progressCopy.skipped} value={progress.skipped} />
            </div>
          </div>
        </section>

        <section className={`${panelClass} p-5 xl:col-span-2`} data-testid="campaign-advanced-details">
          <button
            className="flex w-full items-center justify-between text-left"
            data-testid="campaign-advanced-toggle"
            onClick={() => setAdvancedOpen((open) => !open)}
            type="button"
          >
            <span className="text-lg font-bold">{copy.campaigns.advanced.title}</span>
            <span className="text-sm text-slate-400">{advancedOpen ? copy.campaigns.advanced.hide : copy.campaigns.advanced.show}</span>
          </button>
          {advancedOpen ? (
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <section className="rounded-lg border border-slate-800 p-4">
                <h3 className="font-bold">{copy.campaigns.metadataTitle}</h3>
                <dl className="mt-4 space-y-2 text-sm">
                  <DetailRow label={copy.campaigns.status} value={copy.campaignStatuses[campaign.status]} />
                  <DetailRow label={copy.campaigns.language} value={campaign.language} />
                  <DetailRow label={copy.campaigns.deliveryMode} value={copy.campaigns.deliveryModes[campaign.deliveryMode]} />
                  <DetailRow
                    label={copy.campaigns.recipientCount}
                    testId="campaign-recipient-count"
                    value={String(campaign.recipientSnapshotCount)}
                  />
                  <DetailRow
                    label={copy.campaigns.snapshotCreated}
                    value={
                      campaign.recipientSnapshotCreatedAt
                        ? formatCampaignDateTime(campaign.recipientSnapshotCreatedAt, locale)
                        : "—"
                    }
                  />
                </dl>
              </section>

              <section className="rounded-lg border border-slate-800 p-4">
                <h3 className="font-bold">{copy.campaigns.exclusionsTitle}</h3>
                <p className="mt-2 text-sm text-slate-400" data-testid="campaign-exclusion-count">
                  {copy.campaigns.excludedCount.replace("{count}", String(excluded.length))}
                </p>
              </section>

              <section className="rounded-lg border border-slate-800 p-4 xl:col-span-2" data-testid="campaign-segment-definition">
                <h3 className="font-bold">{copy.campaigns.segmentDefinitionTitle}</h3>
                <p className="mt-2 text-sm text-slate-500">{copy.campaigns.advanced.segmentHint}</p>
                <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-400">
                  {JSON.stringify(campaign.segmentDefinition, null, 2)}
                </pre>
              </section>

              <section className="rounded-lg border border-slate-800 p-4 xl:col-span-2" data-testid="campaign-recipient-snapshot">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-bold">{copy.campaigns.snapshotTitle}</h3>
                  {campaign.status === "draft" ? (
                    confirmRefresh ? (
                      <div className="flex gap-2">
                        <button
                          className="rounded border border-slate-700 px-3 py-1 text-sm"
                          onClick={() => setConfirmRefresh(false)}
                          type="button"
                        >
                          {copy.import.cancel}
                        </button>
                        <button
                          className="rounded bg-orange-500 px-3 py-1 text-sm font-semibold text-slate-950 disabled:opacity-50"
                          data-testid="confirm-refresh-recipients"
                          disabled={refreshing}
                          onClick={() => void handleRefresh()}
                          type="button"
                        >
                          {copy.campaigns.confirmRefresh}
                        </button>
                      </div>
                    ) : (
                      <button
                        className="rounded border border-orange-400 px-3 py-1 text-sm text-orange-300"
                        data-testid="refresh-recipients"
                        onClick={() => setConfirmRefresh(true)}
                        type="button"
                      >
                        {copy.campaigns.refreshRecipients}
                      </button>
                    )
                  ) : null}
                </div>
                {refreshDiff ? <p className="mt-3 text-sm text-green-400">{refreshDiff}</p> : null}
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-slate-400">
                      <tr>
                        <th className="px-3 py-2">{copy.table.company}</th>
                        <th className="px-3 py-2">{copy.table.contact}</th>
                        <th className="px-3 py-2">{copy.table.email}</th>
                        <th className="px-3 py-2">{copy.campaigns.inclusionReason}</th>
                        <th className="px-3 py-2">{copy.campaigns.recipientStatus}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipients.map((recipient) => (
                        <tr className="border-t border-slate-800" key={recipient.id}>
                          <td className="px-3 py-2">{recipient.snapshotCompanyName}</td>
                          <td className="px-3 py-2">{recipient.snapshotContactName}</td>
                          <td className="px-3 py-2">{recipient.snapshotEmail || "—"}</td>
                          <td className="px-3 py-2">{recipient.inclusionReason}</td>
                          <td className="px-3 py-2">{recipient.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  {copy.campaigns.includedCount.replace("{count}", String(included.length))}
                </p>
              </section>

              <section className="rounded-lg border border-slate-800 p-4 xl:col-span-2" data-testid="hosted-preparation-panel">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{hostedPreparationCopy.title}</h3>
                    <p className="mt-2 text-sm text-slate-400">{hostedPreparationCopy.description}</p>
                  </div>
                  <button
                    className="rounded border border-orange-400 px-3 py-1 text-sm font-semibold text-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
                    data-testid="prepare-server-send"
                    disabled={!canPrepareForHostedSending || hostedPreparationUiState === "preparing"}
                    onClick={() => void handlePrepareForHostedSending()}
                    type="button"
                  >
                    {hostedPreparationUiState === "preparing" ? hostedPreparationCopy.preparing : hostedPreparationCopy.prepare}
                  </button>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <ProgressItem
                    label={hostedPreparationCopy.approvalState}
                    testId="hosted-preparation-approval"
                    value={copy.campaignStatuses[campaign.status]}
                  />
                  <ProgressItem
                    label={hostedPreparationCopy.approvedRecipients}
                    testId="hosted-preparation-recipients"
                    value={approvedIncludedRecipients.length}
                  />
                  <ProgressItem
                    label={hostedPreparationCopy.staleApprovals}
                    testId="hosted-preparation-stale"
                    value={staleApprovedRecipients.length}
                  />
                  <ProgressItem
                    label={hostedPreparationCopy.status}
                    testId="hosted-preparation-status"
                    value={hostedPreparationCopy.states[effectiveHostedPreparationUiState]}
                  />
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <label className="block text-sm">
                    <span className="text-slate-400">{hostedPreparationCopy.tenant}</span>
                    <select
                      className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                      data-testid="hosted-tenant-select"
                      disabled={hostedMemberships.length <= 1}
                      onChange={(event) => setSelectedHostedTenantId(event.target.value)}
                      value={selectedHostedTenantId}
                    >
                      {hostedMemberships.length === 0 ? (
                        <option value="">{hostedPreparationCopy.noTenants}</option>
                      ) : (
                        hostedMemberships.map((membership) => (
                          <option key={membership.tenantId} value={membership.tenantId}>
                            {membership.tenantId}
                          </option>
                        ))
                      )}
                    </select>
                  </label>
                  <div className="rounded border border-slate-800 bg-slate-950 p-3 text-sm text-slate-400">
                    <p>
                      {hostedPreparationCopy.eligibility}:{" "}
                      <span className={canPrepareForHostedSending ? "text-green-300" : "text-orange-300"}>
                        {canPrepareForHostedSending ? hostedPreparationCopy.eligible : hostedPreparationCopy.notEligible}
                      </span>
                    </p>
                    {derivedCampaignStatus !== "approved" ? <p>{hostedPreparationCopy.needsApproval}</p> : null}
                    {staleApprovedRecipients.length > 0 ? <p>{hostedPreparationCopy.hasStaleApprovals}</p> : null}
                    {approvedIncludedRecipients.length === 0 ? <p>{hostedPreparationCopy.emptySnapshot}</p> : null}
                  </div>
                </div>
                {hostedPreparationStatus?.preparedAt ? (
                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                    <DetailRow
                      label={hostedPreparationCopy.preparedAt}
                      testId="hosted-preparation-prepared-at"
                      value={formatCampaignDateTime(hostedPreparationStatus.preparedAt, locale)}
                    />
                    <DetailRow
                      label={hostedPreparationCopy.preparedBy}
                      testId="hosted-preparation-prepared-by"
                      value={hostedPreparationStatus.preparedBy ?? "-"}
                    />
                  </div>
                ) : null}
                {hostedPreparationMessage ? (
                  <p
                    className={`mt-3 text-sm ${hostedPreparationUiState === "failed" ? "text-red-300" : "text-green-400"}`}
                    data-testid="hosted-preparation-message"
                  >
                    {hostedPreparationMessage}
                  </p>
                ) : null}
                {hostedPreparationStatus?.activity.length ? (
                  <div className="mt-4 text-xs text-slate-500" data-testid="hosted-preparation-audit">
                    <p className="font-semibold text-slate-400">{hostedPreparationCopy.audit}</p>
                    <ul className="mt-2 space-y-1">
                      {hostedPreparationStatus.activity.map((event) => (
                        <li key={`${event.action}:${event.occurredAt}`}>
                          {formatCampaignDateTime(event.occurredAt, locale)} - {event.title}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <button
                  className="mt-4 rounded border border-slate-700 px-3 py-1 text-sm text-slate-300"
                  data-testid="refresh-hosted-preparation"
                  onClick={() => void refreshHostedPreparationStatus()}
                  type="button"
                >
                  {hostedPreparationCopy.refresh}
                </button>
              </section>

              <HostedCampaignSendPanel
                approvedCount={approvedIncludedRecipients.length}
                campaignId={campaignId}
                canQueue={derivedCampaignStatus === "approved" && staleApprovedRecipients.length === 0}
                dictionary={dictionary}
                isPrepared={effectiveHostedPreparationUiState === "prepared"}
                selectedHostedTenantId={selectedHostedTenantId}
                senderLabel={senderLabel}
                tenantReady={hostedMemberships.length > 0 && Boolean(selectedHostedTenantId)}
              />
            </div>
          ) : null}
        </section>
      </div>
    </AppFrame>
  );
}

class LocalSimulationProvider implements SendJobDeliveryProvider {
  diagnostic(): Pick<EmailProviderDiagnostic, "configured" | "realSendEnabled"> {
    return { configured: true, realSendEnabled: false };
  }

  async send(request: EmailDeliveryRequest) {
    return {
      errorCode: null,
      errorMessage: null,
      mode: request.mode,
      provider: "simulation" as const,
      providerMessageId: `simulation-${request.idempotencyKey}`,
      retryable: false,
      status: "accepted" as const
    };
  }
}

function formatCampaignDateTime(iso: string, locale: Locale): string {
  const tag = locale === "pt-PT" ? "pt-PT" : "en-GB";
  return new Intl.DateTimeFormat(tag, {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
    year: "numeric"
  }).format(new Date(iso));
}

function ProgressItem({
  label,
  testId,
  value
}: {
  label: string;
  testId?: string;
  value: number | string;
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

function DetailRow({
  label,
  value,
  testId
}: {
  label: string;
  value: string;
  testId?: string;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-400">{label}</dt>
      <dd data-testid={testId}>{value}</dd>
    </div>
  );
}

function hostedErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const error = (payload as { error?: unknown }).error;
  if (!error || typeof error !== "object") return null;
  const message = (error as { message?: unknown }).message;
  return typeof message === "string" && message.trim() ? message : null;
}
