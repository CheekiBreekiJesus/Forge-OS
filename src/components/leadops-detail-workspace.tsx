"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppFrame, panelClass } from "@/components/app-frame";
import { getLocalizedLeadOpsHref } from "@/features/leadops/lookup";
import {
  appendEvent,
  buildSequencePreview,
  generatePtPtEmail,
  getCompanyContext,
  leadOpsProductCatalog,
  markMessageEdited,
  queueApprovedMessage,
  recommendProductsForLead,
  simulateSend,
  validateQueue
} from "@/features/leadops/workflow";
import type {
  LeadOpsActivity,
  LeadOpsCampaign,
  LeadOpsGeneratedMessage,
  LeadOpsLead,
  LeadOpsProductKey,
  LeadOpsTone,
  LeadOpsWorkflowState
} from "@/features/leadops/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type LeadOpsDetailWorkspaceProps = {
  campaigns: LeadOpsCampaign[];
  dictionary: Dictionary;
  lead: LeadOpsLead;
  locale: Locale;
};

export function LeadOpsDetailWorkspace({
  campaigns,
  dictionary,
  lead,
  locale
}: LeadOpsDetailWorkspaceProps) {
  const context = useMemo(() => getCompanyContext(lead), [lead]);
  const recommendations = useMemo(() => recommendProductsForLead(lead), [lead]);
  const [tone, setTone] = useState<LeadOpsTone>("professional");
  const [selectedProducts, setSelectedProducts] = useState<LeadOpsProductKey[]>(
    recommendations.slice(0, 2).map((item) => item.key)
  );
  const [selectedCampaignId, setSelectedCampaignId] = useState(
    lead.campaignId ?? campaigns.find((campaign) => campaign.status === "active")?.id ?? campaigns[0]?.id
  );
  const selectedCampaign =
    campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? campaigns[0] ?? null;
  const [message, setMessage] = useState<LeadOpsGeneratedMessage | null>(null);
  const [leadState, setLeadState] = useState<LeadOpsLead>(lead);
  const [campaignState, setCampaignState] = useState<LeadOpsCampaign | null>(selectedCampaign);
  const [providerState, setProviderState] = useState(lead.providerState ?? "not_ready");
  const [queuedAt, setQueuedAt] = useState<string | null>(null);
  const [sentAt, setSentAt] = useState<string | null>(null);
  const [metricsUpdated, setMetricsUpdated] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [activities, setActivities] = useState<LeadOpsActivity[]>([]);
  const sequence = buildSequencePreview(message);
  const queueValidation = validateQueue(currentWorkflowState());

  function currentWorkflowState(): LeadOpsWorkflowState {
    return {
      activities,
      campaign: campaignState,
      lead: leadState,
      message,
      metricsUpdated,
      providerState,
      queuedAt,
      sentAt
    };
  }

  function generateMessage() {
    if (!selectedCampaign) {
      return;
    }

    const nextMessage = generatePtPtEmail({
      campaign: selectedCampaign,
      context,
      lead: leadState,
      productKeys: selectedProducts,
      tone
    });
    setMessage(nextMessage);
    setProviderState("draft");
    setActivities((current) => appendEvent(current, leadState, "message-generated"));
    setFeedback({ kind: "success", message: dictionary.leadops.detailWorkspace.success });
  }

  function editMessage(field: "subject" | "body", value: string) {
    if (!message) {
      return;
    }

    const edited = markMessageEdited({
      ...message,
      [field]: value
    });
    setMessage(edited);
    setProviderState("draft");
    setActivities((current) =>
      current.some((event) => event.kind === "message-edited")
        ? current
        : appendEvent(current, leadState, "message-edited")
    );
  }

  function approveMessage() {
    if (!message?.subject || !message.body) {
      setFeedback({ kind: "error", message: dictionary.leadops.detailWorkspace.incompleteMessage });
      return;
    }

    setMessage({ ...message, approved: true });
    setProviderState("approved");
    setActivities((current) => appendEvent(current, leadState, "message-approved"));
    setFeedback({ kind: "success", message: dictionary.leadops.detailWorkspace.success });
  }

  function assignCampaign(value: string) {
    const nextCampaign = campaigns.find((campaign) => campaign.id === value) ?? null;
    setSelectedCampaignId(value);
    setCampaignState(nextCampaign);
    setLeadState((current) => ({ ...current, campaignId: value }));
    setActivities((current) => appendEvent(current, leadState, "campaign-assigned"));
  }

  function queueMessage() {
    const state = currentWorkflowState();
    const validation = validateQueue(state);

    if (!validation.ok) {
      setProviderState("blocked");
      setFeedback({ kind: "error", message: validation.message });
      return;
    }

    const next = queueApprovedMessage(state);
    applyWorkflowState(next);
    setFeedback({ kind: "success", message: validation.message });
  }

  function sendMessage() {
    const next = simulateSend(currentWorkflowState());
    applyWorkflowState(next);
    setFeedback({
      kind: next.providerState === "sent" ? "success" : "error",
      message:
        next.providerState === "sent"
          ? dictionary.leadops.detailWorkspace.success
          : dictionary.leadops.detailWorkspace.queueRequired
    });
  }

  function applyWorkflowState(next: LeadOpsWorkflowState) {
    setActivities(next.activities);
    setCampaignState(next.campaign);
    setLeadState(next.lead);
    setMetricsUpdated(next.metricsUpdated);
    setProviderState(next.providerState);
    setQueuedAt(next.queuedAt);
    setSentAt(next.sentAt);
  }

  function toggleProduct(key: LeadOpsProductKey) {
    setSelectedProducts((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  }

  return (
    <AppFrame
      activeModule="marketing"
      dictionary={dictionary}
      locale={locale}
      supplementalRoute={`leadops/${lead.id}`}
    >
      <section className="mb-5">
        <Link
          className="text-sm font-semibold text-blue-300 hover:text-blue-200"
          href={getLocalizedLeadOpsHref(locale)}
        >
          {dictionary.leadops.backToDashboard}
        </Link>
        <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-orange-300">
          {dictionary.leadops.detailEyebrow}
        </p>
        <div className="mt-2 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{leadState.companyName}</h1>
            <p className="mt-2 text-sm text-slate-400">
              {leadState.industry} - {leadState.location}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Status>{dictionary.leadops.statuses[leadState.status]}</Status>
            <Status>{dictionary.leadops.qualities[leadState.quality]}</Status>
            <Status>{dictionary.leadops.providerStates[providerState]}</Status>
            <Status>
              {campaignState
                ? dictionary.leadops.campaignStatuses[campaignState.status]
                : dictionary.leadops.detailWorkspace.noCampaign}
            </Status>
          </div>
        </div>
      </section>

      {feedback ? (
        <div
          className={
            feedback.kind === "success"
              ? "mb-4 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-200"
              : "mb-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200"
          }
        >
          {feedback.message}
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.2fr]">
        <div className="grid gap-4">
          <Panel title={dictionary.leadops.detailWorkspace.contactPanel}>
            <Field label={dictionary.leadops.detailFields.contact} value={leadState.contactName} />
            <Field label={dictionary.leadops.detailFields.email} value={leadState.email || "-"} />
            <Field
              label={dictionary.leadops.detailWorkspace.phone}
              value={dictionary.leadops.detailWorkspace.hiddenDemoValue}
            />
            <Field label={dictionary.leadops.detailFields.website} value={leadState.website ?? "-"} />
            <Field label={dictionary.leadops.detailFields.sourceDatabase} value={leadState.sourceDatabase} />
            <Field label={dictionary.leadops.detailFields.language} value={leadState.language} />
          </Panel>

          <Panel title={dictionary.leadops.detailWorkspace.contextPanel}>
            <Status>
              {context.hasWebsiteContext
                ? dictionary.leadops.detailWorkspace.websiteContextAvailable
                : dictionary.leadops.detailWorkspace.noWebsiteContext}
            </Status>
            <p className="mt-4 text-sm leading-6 text-slate-300">{context.summary}</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-400">
              {context.personalizationNotes.map((note) => (
                <li key={note}>- {note}</li>
              ))}
            </ul>
          </Panel>

          <Panel title={dictionary.leadops.detailWorkspace.importSummary}>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label={dictionary.leadops.detailWorkspace.importTotal} value="2,536" />
              <Field label={dictionary.leadops.detailWorkspace.importValid} value="2,536" />
              <Field label={dictionary.leadops.detailWorkspace.importReview} value="101" />
              <Field label={dictionary.leadops.detailWorkspace.importReady} value="2" />
            </div>
          </Panel>
        </div>

        <div className="grid gap-4">
          <Panel title={dictionary.leadops.detailWorkspace.productsPanel}>
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(leadOpsProductCatalog).map(([key, product]) => {
                const productKey = key as LeadOpsProductKey;
                const recommendation = recommendations.find((item) => item.key === productKey);

                return (
                  <label
                    className={
                      selectedProducts.includes(productKey)
                        ? "rounded-lg border border-orange-400/40 bg-orange-500/10 p-3"
                        : "rounded-lg border border-slate-800 bg-slate-950/40 p-3"
                    }
                    key={key}
                  >
                    <input
                      checked={selectedProducts.includes(productKey)}
                      className="mr-2"
                      onChange={() => toggleProduct(productKey)}
                      type="checkbox"
                    />
                    <span className="font-semibold">
                      {locale === "pt-PT" ? product.ptLabel : product.label}
                    </span>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      {recommendation?.reason ?? dictionary.leadops.detailWorkspace.manualProductReason}
                    </p>
                  </label>
                );
              })}
            </div>
          </Panel>

          <Panel title={dictionary.leadops.detailWorkspace.composerPanel}>
            {!context.hasWebsiteContext ? (
              <div className="mb-3 rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                {dictionary.leadops.detailWorkspace.personalizationWarning}
              </div>
            ) : null}
            <div className="mb-4 flex flex-wrap gap-3">
              <label className="grid gap-1 text-sm">
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  {dictionary.leadops.detailWorkspace.tone}
                </span>
                <select
                  className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                  onChange={(event) => setTone(event.target.value as LeadOpsTone)}
                  value={tone}
                >
                  <option value="professional">{dictionary.leadops.detailWorkspace.professional}</option>
                  <option value="friendly">{dictionary.leadops.detailWorkspace.friendly}</option>
                  <option value="direct">{dictionary.leadops.detailWorkspace.direct}</option>
                </select>
              </label>
              <button
                className="self-end rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white"
                onClick={generateMessage}
                type="button"
              >
                {dictionary.leadops.detailWorkspace.generate}
              </button>
              <BadgeLine label={dictionary.leadops.detailWorkspace.method} value={message?.generationMethod ?? "-"} />
              <BadgeLine
                label={dictionary.leadops.detailWorkspace.edited}
                value={message?.edited ? dictionary.leadops.detailWorkspace.edited : "-"}
              />
              <BadgeLine
                label={dictionary.leadops.detailWorkspace.approved}
                value={message?.approved ? dictionary.leadops.detailWorkspace.approved : dictionary.leadops.detailWorkspace.notApproved}
              />
            </div>
            <label className="grid gap-2 text-sm">
              <span className="text-xs uppercase tracking-wide text-slate-500">
                {dictionary.leadops.detailWorkspace.subject}
              </span>
              <input
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                onChange={(event) => message && editMessage("subject", event.target.value)}
                value={message?.subject ?? ""}
              />
            </label>
            <label className="mt-3 grid gap-2 text-sm">
              <span className="text-xs uppercase tracking-wide text-slate-500">
                {dictionary.leadops.detailWorkspace.body}
              </span>
              <textarea
                className="min-h-64 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 leading-6 text-slate-100"
                onChange={(event) => message && editMessage("body", event.target.value)}
                value={message?.body ?? ""}
              />
            </label>
          </Panel>

          <section className="grid gap-4 xl:grid-cols-2">
            <Panel title={dictionary.leadops.detailWorkspace.campaignPanel}>
              <select
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                onChange={(event) => assignCampaign(event.target.value)}
                value={selectedCampaignId}
              >
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
              {campaignState ? (
                <div className="mt-4 text-sm text-slate-300">
                  <div className="font-semibold">{campaignState.name}</div>
                  <div className="mt-1 text-slate-400">
                    {dictionary.leadops.campaignStatuses[campaignState.status]} - {campaignState.sentCount}/{campaignState.totalCount}
                  </div>
                </div>
              ) : null}
            </Panel>

            <Panel title={dictionary.leadops.detailWorkspace.sequencePanel}>
              <div className="space-y-3">
                {sequence.map((step) => (
                  <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3" key={step.id}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{step.title}</span>
                      <span className="text-xs text-slate-400">{step.delay}</span>
                    </div>
                    <p className="mt-2 line-clamp-4 text-sm leading-6 text-slate-400">{step.preview}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </section>

          <Panel title={dictionary.leadops.detailWorkspace.providerState}>
            <div className="flex flex-wrap gap-3">
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white" onClick={approveMessage} type="button">
                {dictionary.leadops.detailWorkspace.approve}
              </button>
              <button
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!queueValidation.ok}
                onClick={queueMessage}
                type="button"
              >
                {dictionary.leadops.detailWorkspace.queue}
              </button>
              <button
                className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-100"
                onClick={sendMessage}
                type="button"
              >
                {dictionary.leadops.detailWorkspace.simulateSend}
              </button>
            </div>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <Field label={dictionary.leadops.detailWorkspace.providerState} value={dictionary.leadops.providerStates[providerState]} />
              <Field label={dictionary.leadops.detailWorkspace.queuedAt} value={queuedAt ?? "-"} />
              <Field label={dictionary.leadops.detailWorkspace.sentAt} value={sentAt ?? "-"} />
            </div>
            {!queueValidation.ok ? (
              <p className="mt-3 text-sm text-amber-300">{queueValidation.message}</p>
            ) : null}
          </Panel>

          <Panel title={dictionary.leadops.detailWorkspace.activityPanel}>
            <div className="space-y-3">
              {activities.map((activity) => (
                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3" key={activity.id}>
                  <div className="font-semibold">{dictionary.leadops.activities[activity.kind]}</div>
                  <div className="mt-1 text-xs text-slate-500">{activity.occurredAt}</div>
                </div>
              ))}
              {activities.length === 0 ? (
                <p className="text-sm text-slate-400">
                  {dictionary.leadops.detailWorkspace.emptyActivity}
                </p>
              ) : null}
            </div>
          </Panel>
        </div>
      </section>
    </AppFrame>
  );
}

function Panel({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <article className={`${panelClass} p-5`}>
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-slate-200">{value}</dd>
    </div>
  );
}

function Status({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-200">
      {children}
    </span>
  );
}

function BadgeLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="self-end rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs">
      <span className="text-slate-500">{label}: </span>
      <span className="font-semibold text-slate-200">{value}</span>
    </div>
  );
}
