"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  generateCampaignDrafts,
  previewCampaignDrafts,
  previewTemplateSample,
  regenerateRecipientDraft,
  saveCampaignTemplate,
  updateRecipientDraftContent,
  type CampaignDraftPreview
} from "@/application/campaign-draft-service";
import { panelClass } from "@/components/app-frame";
import {
  CampaignBulkApprovalBar,
  CampaignRecipientReviewPanel
} from "@/components/campaign-recipient-review-panel";
import type { CampaignDraftStatus, CampaignRecipient, OutreachCampaign } from "@/domain/campaign-types";
import {
  TEMPLATE_VARIABLE_LABELS,
  TEMPLATE_VARIABLES,
  type TemplateVariableKey
} from "@/features/leadops/template-variables";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";

type CampaignTemplateDraftsPanelProps = {
  campaign: OutreachCampaign;
  campaignId: string;
  dictionary: Dictionary;
  locale: Locale;
  onCampaignUpdated: (campaign: OutreachCampaign) => void;
  onRecipientsUpdated: (recipients: CampaignRecipient[]) => void;
  recipients: CampaignRecipient[];
  repos: LocalRepositoryBundle;
  tenantId: string;
  onNotify: () => void;
};

type DraftFilter = "all" | CampaignDraftStatus | "edited" | "unresolved" | "unsafe";

export function CampaignTemplateDraftsPanel({
  campaign,
  campaignId,
  dictionary,
  locale,
  onCampaignUpdated,
  onRecipientsUpdated,
  recipients,
  repos,
  tenantId,
  onNotify
}: CampaignTemplateDraftsPanelProps) {
  const copy = dictionary.leadops.campaigns.templates;
  const draftCopy = dictionary.leadops.campaigns.drafts;
  const included = useMemo(() => recipients.filter((row) => row.status === "included"), [recipients]);

  const [subjectTemplate, setSubjectTemplate] = useState(campaign.subjectTemplate);
  const [plainTextTemplate, setPlainTextTemplate] = useState(campaign.plainTextTemplate);
  const [preview, setPreview] = useState<CampaignDraftPreview | null>(null);
  const [sampleSubject, setSampleSubject] = useState("");
  const [sampleBody, setSampleBody] = useState("");
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [draftFilter, setDraftFilter] = useState<DraftFilter>("all");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedRecipient = useMemo(
    () => included.find((row) => row.id === selectedRecipientId) ?? null,
    [included, selectedRecipientId]
  );

  const reloadPreview = useCallback(async () => {
    const next = await previewCampaignDrafts(repos, tenantId, campaignId);
    setPreview(next);
  }, [campaignId, repos, tenantId]);

  const reloadRecipients = useCallback(async () => {
    const snapshot = await repos.campaignRecipients.listForCampaign(tenantId, campaignId);
    onRecipientsUpdated(snapshot);
  }, [campaignId, onRecipientsUpdated, repos, tenantId]);

  useEffect(() => {
    let cancelled = false;
    void previewCampaignDrafts(repos, tenantId, campaignId).then((next) => {
      if (!cancelled) setPreview(next);
    });
    return () => {
      cancelled = true;
    };
  }, [campaign.templateVersion, campaignId, recipients.length, repos, tenantId]);

  function selectRecipient(recipient: CampaignRecipient) {
    setSelectedRecipientId(recipient.id);
    setEditSubject(recipient.personalizedSubject);
    setEditBody(recipient.personalizedPlainText);
    setConfirmRegenerate(false);
  }

  const filteredRecipients = useMemo(() => {
    return included.filter((row) => {
      if (draftFilter === "all") return true;
      if (draftFilter === "edited") return row.userEdited;
      if (draftFilter === "unresolved") return row.draftStatus === "NEEDS_REVIEW";
      if (draftFilter === "unsafe") {
        return row.draftStatus === "NEEDS_REVIEW" || row.draftStatus === "PENDING";
      }
      return row.draftStatus === draftFilter;
    });
  }, [draftFilter, included]);

  async function handleSaveTemplate() {
    if (campaign.status !== "draft") return;
    setSavingTemplate(true);
    setFeedback(null);
    try {
      const updated = await saveCampaignTemplate(repos, tenantId, campaignId, {
        subjectTemplate,
        plainTextTemplate,
        language: campaign.language
      });
      onCampaignUpdated(updated);
      setSubjectTemplate(updated.subjectTemplate);
      setPlainTextTemplate(updated.plainTextTemplate);
      onNotify();
      await reloadPreview();
      setFeedback(copy.templateSaved);
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handlePreviewSample() {
    const sample = await previewTemplateSample(repos, tenantId, campaignId, selectedRecipientId ?? undefined);
    setSampleSubject(sample.subject);
    setSampleBody(sample.plainText);
  }

  async function handleGenerateDrafts() {
    if (campaign.status !== "draft") return;
    setGenerating(true);
    setFeedback(null);
    try {
      const result = await generateCampaignDrafts(repos, tenantId, campaignId, { skipEdited: true });
      onNotify();
      await reloadRecipients();
      await reloadPreview();
      setFeedback(
        draftCopy.generateSummary
          .replace("{generated}", String(result.generated))
          .replace("{skipped}", String(result.skippedEdited))
          .replace("{needsReview}", String(result.needsReview))
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveDraftEdit() {
    if (!selectedRecipient) return;
    setSavingDraft(true);
    setFeedback(null);
    try {
      await updateRecipientDraftContent(repos, tenantId, selectedRecipient.id, {
        personalizedSubject: editSubject,
        personalizedPlainText: editBody
      });
      onNotify();
      await reloadRecipients();
      await reloadPreview();
      setFeedback(draftCopy.draftSaved);
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleRegenerateDraft(force = false) {
    if (!selectedRecipient) return;
    if (selectedRecipient.userEdited && !force) {
      setConfirmRegenerate(true);
      return;
    }
    setRegenerating(true);
    setFeedback(null);
    try {
      await regenerateRecipientDraft(repos, tenantId, campaignId, selectedRecipient.id, true);
      onNotify();
      await reloadRecipients();
      await reloadPreview();
      setConfirmRegenerate(false);
      setFeedback(draftCopy.regenerated);
    } finally {
      setRegenerating(false);
    }
  }

  const variableLabel = (key: TemplateVariableKey) =>
    TEMPLATE_VARIABLE_LABELS[key][locale === "pt-PT" ? "pt-PT" : "en"];

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className={`${panelClass} p-5 xl:col-span-2`} data-testid="campaign-template-editor">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{copy.title}</h2>
            <p className="mt-1 text-sm text-slate-400">{copy.description}</p>
          </div>
          <p className="text-xs text-slate-500">
            {copy.templateVersion.replace("{version}", String(campaign.templateVersion))}
          </p>
        </div>

        {preview && !preview.sender.ready ? (
          <div
            className="mt-4 rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-200"
            data-testid="sender-config-warning"
          >
            {copy.senderIncomplete.replace("{fields}", preview.sender.missingFields.join(", "))}
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="block text-sm">
            <span className="text-slate-400">{copy.subjectLabel}</span>
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
              data-testid="campaign-template-subject"
              disabled={campaign.status !== "draft"}
              onChange={(event) => setSubjectTemplate(event.target.value)}
              value={subjectTemplate}
            />
          </label>
          <div className="text-sm">
            <p className="text-slate-400">{copy.variablesTitle}</p>
            <div className="mt-2 flex flex-wrap gap-2" data-testid="campaign-template-variables">
              {TEMPLATE_VARIABLES.map((key) => (
                <code
                  className="rounded bg-slate-900 px-2 py-1 text-xs text-orange-200"
                  key={key}
                  title={variableLabel(key)}
                >
                  {`{{${key}}}`}
                </code>
              ))}
            </div>
          </div>
        </div>

        <label className="mt-4 block text-sm">
          <span className="text-slate-400">{copy.bodyLabel}</span>
          <textarea
            className="mt-1 min-h-56 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm"
            data-testid="campaign-template-body"
            disabled={campaign.status !== "draft"}
            onChange={(event) => setPlainTextTemplate(event.target.value)}
            value={plainTextTemplate}
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
            data-testid="save-campaign-template"
            disabled={campaign.status !== "draft" || savingTemplate}
            onClick={() => void handleSaveTemplate()}
            type="button"
          >
            {savingTemplate ? copy.saving : copy.saveTemplate}
          </button>
          <button
            className="rounded border border-slate-700 px-4 py-2 text-sm"
            data-testid="preview-campaign-template"
            onClick={() => void handlePreviewSample()}
            type="button"
          >
            {copy.previewSample}
          </button>
        </div>

        {preview ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-testid="campaign-template-preview-counts">
            <CountBadge label={copy.includedRecipients} value={preview.counts.includedRecipients} />
            <CountBadge label={copy.unresolvedCount} value={preview.counts.unresolvedTemplateVariables} />
            <CountBadge label={draftCopy.pending} value={preview.counts.pending} />
            <CountBadge label={draftCopy.needsReview} value={preview.counts.needsReview} />
          </div>
        ) : null}

        {sampleSubject || sampleBody ? (
          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-4" data-testid="campaign-template-preview">
            <p className="text-xs uppercase tracking-wide text-slate-500">{copy.previewTitle}</p>
            <p className="mt-2 text-sm font-semibold">{sampleSubject}</p>
            <pre className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{sampleBody}</pre>
          </div>
        ) : null}
      </section>

      <section className={`${panelClass} p-5 xl:col-span-2`} data-testid="campaign-drafts-panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{draftCopy.title}</h2>
            <p className="mt-1 text-sm text-slate-400">{draftCopy.description}</p>
          </div>
          <button
            className="rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
            data-testid="generate-campaign-drafts"
            disabled={campaign.status !== "draft" || generating || included.length === 0}
            onClick={() => void handleGenerateDrafts()}
            type="button"
          >
            {generating ? draftCopy.generating : draftCopy.generateAll}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm text-slate-400">
            {draftCopy.filterLabel}
            <select
              className="ml-2 rounded border border-slate-700 bg-slate-950 px-2 py-1"
              data-testid="campaign-draft-filter"
              onChange={(event) => setDraftFilter(event.target.value as DraftFilter)}
              value={draftFilter}
            >
              <option value="all">{draftCopy.filterAll}</option>
              <option value="PENDING">{draftCopy.pending}</option>
              <option value="DRAFTED">{draftCopy.drafted}</option>
              <option value="NEEDS_REVIEW">{draftCopy.needsReview}</option>
              <option value="APPROVED">{draftCopy.statuses.APPROVED}</option>
              <option value="OPENED_EXTERNALLY">{draftCopy.statuses.OPENED_EXTERNALLY}</option>
              <option value="SENT_MANUALLY">{draftCopy.statuses.SENT_MANUALLY}</option>
              <option value="edited">{draftCopy.edited}</option>
              <option value="unresolved">{draftCopy.unresolved}</option>
              <option value="unsafe">{dictionary.leadops.campaigns.review.unsafeReasons}</option>
            </select>
          </label>
          <CampaignBulkApprovalBar
            campaignId={campaignId}
            dictionary={dictionary}
            onNotify={onNotify}
            onRecipientsUpdated={reloadRecipients}
            repos={repos}
            tenantId={tenantId}
          />
          {preview ? (
            <p className="text-xs text-slate-500">
              {draftCopy.countSummary
                .replace("{drafted}", String(preview.counts.drafted))
                .replace("{edited}", String(preview.counts.editedDrafts))}
            </p>
          ) : null}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="px-3 py-2">{dictionary.leadops.table.company}</th>
                <th className="px-3 py-2">{dictionary.leadops.table.contact}</th>
                <th className="px-3 py-2">{draftCopy.statusColumn}</th>
                <th className="px-3 py-2">{draftCopy.subjectColumn}</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecipients.map((recipient) => (
                <tr
                  className={`cursor-pointer border-t border-slate-800 ${
                    selectedRecipientId === recipient.id ? "bg-slate-900/70" : ""
                  }`}
                  data-testid={`campaign-draft-row-${recipient.id}`}
                  key={recipient.id}
                  onClick={() => selectRecipient(recipient)}
                >
                  <td className="px-3 py-2">{recipient.snapshotCompanyName}</td>
                  <td className="px-3 py-2">{recipient.snapshotContactName || "—"}</td>
                  <td className="px-3 py-2">
                    <span data-testid={`campaign-draft-status-${recipient.id}`}>
                      {draftCopy.statuses[recipient.draftStatus as keyof typeof draftCopy.statuses] ??
                        recipient.draftStatus}
                    </span>
                    {recipient.userEdited ? (
                      <span className="ml-2 text-xs text-amber-300">{draftCopy.editedBadge}</span>
                    ) : null}
                  </td>
                  <td className="max-w-xs truncate px-3 py-2">{recipient.personalizedSubject || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedRecipient ? (
        <section className={`${panelClass} p-5 xl:col-span-2`} data-testid="campaign-draft-editor">
          <h3 className="text-lg font-bold">{draftCopy.editorTitle}</h3>
          <p className="mt-1 text-sm text-slate-400">
            {selectedRecipient.snapshotCompanyName} · {selectedRecipient.snapshotEmail || "—"}
          </p>
          {selectedRecipient.draftStatus === "NEEDS_REVIEW" ? (
            <p className="mt-3 text-sm text-amber-300" data-testid="campaign-draft-unresolved-warning">
              {draftCopy.unresolvedWarning}
            </p>
          ) : null}
          <label className="mt-4 block text-sm">
            <span className="text-slate-400">{copy.subjectLabel}</span>
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
              data-testid="campaign-draft-subject"
              onChange={(event) => setEditSubject(event.target.value)}
              value={editSubject}
            />
          </label>
          <label className="mt-4 block text-sm">
            <span className="text-slate-400">{copy.bodyLabel}</span>
            <textarea
              className="mt-1 min-h-48 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm"
              data-testid="campaign-draft-body"
              onChange={(event) => setEditBody(event.target.value)}
              value={editBody}
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
              data-testid="save-campaign-draft"
              disabled={savingDraft}
              onClick={() => void handleSaveDraftEdit()}
              type="button"
            >
              {savingDraft ? draftCopy.saving : draftCopy.saveDraft}
            </button>
            {confirmRegenerate ? (
              <>
                <button
                  className="rounded border border-slate-700 px-4 py-2 text-sm"
                  onClick={() => setConfirmRegenerate(false)}
                  type="button"
                >
                  {dictionary.leadops.import.cancel}
                </button>
                <button
                  className="rounded border border-amber-400 px-4 py-2 text-sm text-amber-200"
                  data-testid="confirm-regenerate-draft"
                  disabled={regenerating}
                  onClick={() => void handleRegenerateDraft(true)}
                  type="button"
                >
                  {draftCopy.confirmRegenerate}
                </button>
              </>
            ) : (
              <button
                className="rounded border border-slate-700 px-4 py-2 text-sm"
                data-testid="regenerate-campaign-draft"
                disabled={regenerating}
                onClick={() => void handleRegenerateDraft(false)}
                type="button"
              >
                {draftCopy.regenerateOne}
              </button>
            )}
          </div>
        </section>
      ) : null}

      {selectedRecipient ? (
        <CampaignRecipientReviewPanel
          campaign={campaign}
          campaignId={campaignId}
          dictionary={dictionary}
          locale={locale}
          onCampaignUpdated={onCampaignUpdated}
          onNotify={onNotify}
          onRecipientsUpdated={reloadRecipients}
          recipient={selectedRecipient}
          repos={repos}
          tenantId={tenantId}
        />
      ) : null}

      {feedback ? (
        <p className="text-sm text-green-400 xl:col-span-2" data-testid="campaign-draft-feedback">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}

function CountBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
