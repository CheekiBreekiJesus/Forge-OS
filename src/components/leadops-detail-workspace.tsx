"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppFrame, panelClass } from "@/components/app-frame";
import { EmailBrandingPreview, EmailCopyActions } from "@/components/leadops-email-composer";
import { snapshotCompanyProfile, snapshotProducts, snapshotSenderIdentity } from "@/features/email-composition/renderer";
import { getLocalizedLeadOpsHref } from "@/features/leadops/lookup";
import {
  appendEvent,
  buildSequencePreview,
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
import { usePersistence } from "@/persistence/provider";
import type { OutreachMessage } from "@/domain/types";
import type { ProductEmailSnapshot } from "@/domain/product-types";
import {
  useCompanyProfile,
  useProducts,
  useSenderIdentities
} from "@/persistence/profile-hooks";

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
  const { state } = usePersistence();
  const { profile: companyProfile } = useCompanyProfile();
  const { identities: senderIdentities } = useSenderIdentities();
  const { products: tenantProducts } = useProducts();
  const [selectedSenderId, setSelectedSenderId] = useState<string>(() => "");

  const selectedSender = useMemo(
    () =>
      senderIdentities.find((s) => s.id === selectedSenderId) ??
      senderIdentities.find((s) => s.isDefault) ??
      senderIdentities[0] ??
      null,
    [senderIdentities, selectedSenderId]
  );

  const effectiveSenderId = selectedSenderId || selectedSender?.id || "";

  const productSnapshots = useMemo<ProductEmailSnapshot[]>(() => {
    return tenantProducts
      .filter((p) => p.isEmailPromotable && p.active)
      .slice(0, 3)
      .map((p) => ({
        customizerUrl: p.customizerUrl,
        defaultCtaLabel: p.defaultCtaLabel,
        emailDescription: p.emailDescription,
        emailTitle: p.emailTitle,
        id: p.id,
        imageUrl: p.imageUrl,
        name: p.name,
        productPageUrl: p.productPageUrl,
        sku: p.sku,
        thumbnailUrl: p.thumbnailUrl
      }));
  }, [tenantProducts]);

  const [workflowLoaded, setWorkflowLoaded] = useState(false);
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
  const [campaignState, setCampaignState] = useState<LeadOpsCampaign | null>(null);
  const defaultCampaign = useMemo(() => {
    if (campaigns.length === 0) return null;
    const defaultId =
      lead.campaignId ??
      campaigns.find((c) => c.status === "active")?.id ??
      campaigns[0]?.id;
    return campaigns.find((c) => c.id === defaultId) ?? campaigns[0] ?? null;
  }, [campaigns, lead.campaignId]);
  const effectiveCampaign = campaignState ?? defaultCampaign;
  const [providerState, setProviderState] = useState(lead.providerState ?? "not_ready");
  const [queuedAt, setQueuedAt] = useState<string | null>(null);
  const [sentAt, setSentAt] = useState<string | null>(null);
  const [metricsUpdated, setMetricsUpdated] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [activities, setActivities] = useState<LeadOpsActivity[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [providerModel, setProviderModel] = useState<string | null>(null);
  const [providerMode, setProviderMode] = useState(dictionary.leadops.detailWorkspace.simulationMode);
  const sequence = buildSequencePreview(message);
  const workflowState = useMemo<LeadOpsWorkflowState>(
    () => ({
      activities,
      campaign: effectiveCampaign,
      lead: leadState,
      message,
      metricsUpdated,
      providerState,
      queuedAt,
      sentAt
    }),
    [activities, effectiveCampaign, leadState, message, metricsUpdated, providerState, queuedAt, sentAt]
  );
  const queueValidation = validateQueue(workflowState);

  useEffect(() => {
    if (state.status !== "ready") return;
    let cancelled = false;
    void (async () => {
      const saved = await state.repos.outreachMessages.getForLead(state.tenantId, lead.id);
      if (cancelled || !saved) {
        setWorkflowLoaded(true);
        return;
      }
      if (saved.message) setMessage(saved.message);
      if (saved.campaignId) {
        const camp = campaigns.find((c) => c.id === saved.campaignId) ?? null;
        setCampaignState(camp);
        setSelectedCampaignId(saved.campaignId);
      }
      setProviderState(saved.providerState);
      setQueuedAt(saved.queuedAt);
      setSentAt(saved.sentAt);
      setMetricsUpdated(saved.metricsUpdated);
      setFeedback({
        kind: "success",
        message: dictionary.leadops.detailWorkspace.savedDraftLoaded
      });
      setWorkflowLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [state, lead.id, campaigns, dictionary.leadops.detailWorkspace.savedDraftLoaded]);

  useEffect(() => {
    if (state.status !== "ready" || !workflowLoaded) return;
    const record: OutreachMessage = {
      id: lead.id,
      tenantId: lead.tenantId,
      leadId: lead.id,
      campaignId: effectiveCampaign?.id ?? null,
      message,
      providerState,
      queuedAt,
      sentAt,
      metricsUpdated,
      updatedAt: new Date().toISOString()
    };
    void state.repos.outreachMessages.saveDraft(lead.tenantId, lead.id, record);
  }, [
    state,
    workflowLoaded,
    lead.id,
    lead.tenantId,
    effectiveCampaign,
    message,
    providerState,
    queuedAt,
    sentAt,
    metricsUpdated
  ]);

  async function generateMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (!selectedCampaign) {
      setFeedback({ kind: "error", message: dictionary.leadops.detailWorkspace.noCampaign });
      return;
    }

    setIsGenerating(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/leadops/generate", {
        body: JSON.stringify({
          campaign: selectedCampaign,
          companyProfile: companyProfile ?? undefined,
          context,
          lead: leadState,
          locale,
          productKeys: selectedProducts,
          products: productSnapshots,
          senderIdentity: selectedSender ?? undefined,
          tone
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("generation-failed");
      }

      const result = (await response.json()) as {
        fallbackUsed?: boolean;
        message: LeadOpsGeneratedMessage;
        mode: string;
        model?: string;
        provider?: string;
        warning?: string;
      };

      setMessage(result.message);
      setProviderModel(result.model ?? null);
      setProviderMode(
        result.fallbackUsed || result.mode === "fallback" || result.mode === "deterministic"
          ? dictionary.leadops.detailWorkspace.deterministicMode
          : result.mode === "openai" || result.mode === "abacus"
            ? dictionary.leadops.detailWorkspace.liveAiMode
            : dictionary.leadops.detailWorkspace.deterministicMode
      );
      setProviderState("draft");
      setActivities((current) => appendEvent(current, leadState, "message-generated"));
      setFeedback({
        kind: result.fallbackUsed ? "error" : "success",
        message: result.fallbackUsed
          ? dictionary.leadops.detailWorkspace.fallbackNotice
          : result.warning ?? dictionary.leadops.detailWorkspace.generatedSuccess
      });
    } catch {
      setFeedback({ kind: "error", message: dictionary.leadops.detailWorkspace.generationError });
    } finally {
      setIsGenerating(false);
    }
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

    const composition = message.composition
      ? {
          ...message.composition,
          companyProfileSnapshot: message.composition.companyProfileSnapshot
            ? snapshotCompanyProfile(message.composition.companyProfileSnapshot)
            : companyProfile
              ? snapshotCompanyProfile(companyProfile)
              : null,
          selectedProductSnapshots: snapshotProducts(
            message.composition.selectedProductSnapshots.length
              ? message.composition.selectedProductSnapshots
              : productSnapshots
          ),
          senderIdentitySnapshot: message.composition.senderIdentitySnapshot
            ? snapshotSenderIdentity(message.composition.senderIdentitySnapshot)
            : selectedSender
              ? snapshotSenderIdentity(selectedSender)
              : null
        }
      : null;

    setMessage({ ...message, approved: true, composition });
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
    const state = workflowState;
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

  async function sendMessage() {
    if (!window.confirm(dictionary.leadops.detailWorkspace.confirmSend)) {
      return;
    }

    setIsSending(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/leadops/send", {
        body: JSON.stringify(workflowState),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });
      const result = (await response.json()) as {
        error?: string;
        mode?: string;
        providerStatus?: string;
      };

      if (!response.ok || result.providerStatus === "failed" || result.providerStatus === "blocked") {
        setProviderMode(result.mode ?? dictionary.leadops.detailWorkspace.providerErrorMode);
        setFeedback({
          kind: "error",
          message: result.error ?? dictionary.leadops.detailWorkspace.providerError
        });
        return;
      }

      if (result.mode === "smartlead") {
        setProviderMode(dictionary.leadops.detailWorkspace.liveProviderMode);
        setFeedback({
          kind: "success",
          message: dictionary.leadops.detailWorkspace.providerQueuedSuccess
        });
        return;
      }

      const next = simulateSend(workflowState);
      applyWorkflowState(next);
      setProviderMode(dictionary.leadops.detailWorkspace.simulationMode);
      setFeedback({
        kind: next.providerState === "sent" ? "success" : "error",
        message:
          next.providerState === "sent"
            ? dictionary.leadops.detailWorkspace.sentSuccess
            : dictionary.leadops.detailWorkspace.queueRequired
      });
    } catch {
      setFeedback({ kind: "error", message: dictionary.leadops.detailWorkspace.providerError });
    } finally {
      setIsSending(false);
    }
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
              {effectiveCampaign
                ? dictionary.leadops.campaignStatuses[effectiveCampaign.status]
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
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="text-xs uppercase tracking-wide text-slate-500">
                  {dictionary.leadops.detailWorkspace.senderIdentity}
                </span>
                <select
                  className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                  value={effectiveSenderId}
                  onChange={(e) => setSelectedSenderId(e.target.value)}
                >
                  {senderIdentities.map((identity) => (
                    <option key={identity.id} value={identity.id}>
                      {identity.displayName} ({identity.fromEmail})
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label={dictionary.leadops.detailWorkspace.companyProfile}
                value={companyProfile?.tradingName ?? "-"}
              />
            </div>
            <form className="mb-4 flex flex-wrap gap-3" onSubmit={generateMessage}>
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
                className="self-end rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-70"
                disabled={isGenerating}
                onClick={(event) => {
                  event.preventDefault();
                  void generateMessage();
                }}
                type="button"
              >
                {isGenerating
                  ? dictionary.leadops.detailWorkspace.generationLoading
                  : dictionary.leadops.detailWorkspace.generate}
              </button>
              <BadgeLine label={dictionary.leadops.detailWorkspace.providerMode} value={providerMode} />
              <BadgeLine
                label={dictionary.leadops.detailWorkspace.modelLabel}
                value={providerModel ?? message?.generationMethod ?? "-"}
              />
              <BadgeLine
                label={dictionary.leadops.detailWorkspace.edited}
                value={message?.edited ? dictionary.leadops.detailWorkspace.edited : "-"}
              />
              <BadgeLine
                label={dictionary.leadops.detailWorkspace.approved}
                value={message?.approved ? dictionary.leadops.detailWorkspace.approved : dictionary.leadops.detailWorkspace.notApproved}
              />
            </form>
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
            {message?.composition ? (
              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-xs uppercase text-slate-500">
                    {dictionary.leadops.detailWorkspace.plainPreview}
                  </div>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-300">
                    {message.composition.plainText}
                  </pre>
                </div>
                <EmailBrandingPreview composition={message.composition} dictionary={dictionary} />
              </div>
            ) : null}
            {message?.approved && message.composition ? (
              <div className="mt-4 border-t border-slate-800 pt-4">
                <EmailCopyActions
                  composition={message.composition}
                  dictionary={dictionary}
                  onFeedback={(msg, kind) => setFeedback({ kind, message: msg })}
                  recipientEmail={leadState.email}
                />
              </div>
            ) : null}
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
              {effectiveCampaign ? (
                <div className="mt-4 text-sm text-slate-300">
                  <div className="font-semibold">{effectiveCampaign.name}</div>
                  <div className="mt-1 text-slate-400">
                    {dictionary.leadops.campaignStatuses[effectiveCampaign.status]} - {effectiveCampaign.sentCount}/{effectiveCampaign.totalCount}
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
                disabled={isSending || providerState === "sent"}
                onClick={sendMessage}
                type="button"
              >
                {isSending
                  ? dictionary.leadops.detailWorkspace.sending
                  : dictionary.leadops.detailWorkspace.simulateSend}
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
