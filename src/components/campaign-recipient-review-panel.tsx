"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  approveRecipientDraft,
  bulkApproveRecipientDrafts,
  evaluateDuplicateSend,
  evaluateRecipientApproval,
  getApprovedCompositionForRecipient,
  markRecipientManuallySent,
  markRecipientOpenedExternally,
  simulateRecipientSend,
  type ApprovalBlockReason,
  type ApprovalEvaluation
} from "@/application/campaign-approval-service";
import { panelClass } from "@/components/app-frame";
import { EmailCopyActions } from "@/components/leadops-email-composer";
import type { CampaignRecipient, OutreachCampaign } from "@/domain/campaign-types";
import {
  buildGmailComposeUrl,
  buildMailtoUrl,
  buildOutlookComposeUrl
} from "@/features/email-composition/copy";
import type { EmailComposition } from "@/features/email-composition/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";

type CampaignRecipientReviewPanelProps = {
  campaign: OutreachCampaign;
  campaignId: string;
  dictionary: Dictionary;
  locale: Locale;
  onNotify: () => void;
  onRecipientsUpdated: () => Promise<void>;
  onCampaignUpdated: (campaign: OutreachCampaign) => void;
  recipient: CampaignRecipient;
  repos: LocalRepositoryBundle;
  tenantId: string;
};

export function CampaignRecipientReviewPanel({
  campaign,
  campaignId,
  dictionary,
  recipient,
  repos,
  tenantId,
  onNotify,
  onRecipientsUpdated,
  onCampaignUpdated
}: CampaignRecipientReviewPanelProps) {
  const copy = dictionary.leadops.campaigns.review;
  const [evaluation, setEvaluation] = useState<ApprovalEvaluation | null>(null);
  const [composition, setComposition] = useState<EmailComposition | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);
  const [cooldownOverride, setCooldownOverride] = useState(false);
  const [operatorNote, setOperatorNote] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const canHandoff =
    (recipient.draftStatus === "APPROVED" || recipient.draftStatus === "OPENED_EXTERNALLY") &&
    Boolean(composition);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const nextEval = await evaluateRecipientApproval(repos, tenantId, campaign, recipient);
      const duplicate = await evaluateDuplicateSend(repos, tenantId, campaign, recipient);
      if (cancelled) return;
      setEvaluation(nextEval);
      setDuplicateWarning(
        duplicate.warn ? copy.cooldownWarning : duplicate.blocked ? copy.duplicateBlocked : null
      );
      if (
        recipient.draftStatus === "APPROVED" ||
        recipient.draftStatus === "OPENED_EXTERNALLY" ||
        recipient.draftStatus === "SENT_MANUALLY"
      ) {
        const nextComposition = await getApprovedCompositionForRecipient(
          repos,
          tenantId,
          campaign,
          recipient
        );
        if (!cancelled) setComposition(nextComposition);
      } else {
        setComposition(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaign, campaignId, copy.cooldownWarning, copy.duplicateBlocked, recipient, repos, tenantId]);

  const reasonLabels = useMemo(
    () => copy.blockReasons as Record<ApprovalBlockReason, string>,
    [copy.blockReasons]
  );

  async function refreshAll() {
    await onRecipientsUpdated();
    const row = await repos.campaigns.getById(tenantId, campaignId);
    if (row) onCampaignUpdated(row);
    onNotify();
  }

  async function handleApprove() {
    setBusy(true);
    setFeedback(null);
    try {
      await approveRecipientDraft(repos, tenantId, campaignId, recipient.id);
      await refreshAll();
      setFeedback(copy.approved);
    } finally {
      setBusy(false);
    }
  }

  async function handleOpenExternal(client: "gmail" | "outlook" | "default") {
    if (!composition) return;
    setBusy(true);
    setFeedback(null);
    try {
      await markRecipientOpenedExternally(repos, tenantId, campaignId, recipient.id, client);
      const email = recipient.snapshotEmail.trim();
      if (client === "gmail") {
        const { url } = buildGmailComposeUrl({
          to: email,
          subject: composition.subject,
          body: composition.plainText
        });
        window.open(url, "_blank", "noopener,noreferrer");
      } else if (client === "outlook") {
        const { url } = buildOutlookComposeUrl({
          to: email,
          subject: composition.subject,
          body: composition.plainText
        });
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        const mailto = buildMailtoUrl({
          to: email,
          subject: composition.subject,
          body: composition.plainText
        });
        window.location.href = mailto.url;
      }
      await refreshAll();
      setFeedback(copy.openedExternal);
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkSent() {
    setBusy(true);
    setFeedback(null);
    try {
      await markRecipientManuallySent(repos, tenantId, campaignId, recipient.id, {
        operatorNote,
        ignoreCooldown: cooldownOverride,
        cooldownOverrideReason: cooldownOverride ? operatorNote : undefined,
        externalClient: recipient.externalClient ?? undefined
      });
      setConfirmSent(false);
      await refreshAll();
      setFeedback(copy.markedSent);
    } finally {
      setBusy(false);
    }
  }

  async function handleSimulate() {
    setBusy(true);
    try {
      await simulateRecipientSend(repos, tenantId, campaignId, recipient.id);
      await refreshAll();
      setFeedback(copy.simulated);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${panelClass} p-5 xl:col-span-2`} data-testid="campaign-recipient-review">
      <h3 className="text-lg font-bold">{copy.title}</h3>
      <p className="mt-1 text-sm text-slate-400">{copy.description}</p>

      {evaluation && !evaluation.canApprove && recipient.draftStatus !== "SENT_MANUALLY" ? (
        <div className="mt-3 rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-200" data-testid="campaign-approval-blockers">
          {copy.unsafeReasons}: {evaluation.reasons.map((reason) => reasonLabels[reason] ?? reason).join(", ")}
        </div>
      ) : null}

      {duplicateWarning ? (
        <p className="mt-3 text-sm text-amber-300" data-testid="campaign-duplicate-warning">
          {duplicateWarning}
        </p>
      ) : null}

      {recipient.approvalInvalidationReason ? (
        <p className="mt-3 text-sm text-amber-300" data-testid="campaign-approval-invalidated">
          {copy.invalidated.replace("{reason}", recipient.approvalInvalidationReason)}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
          data-testid="approve-campaign-draft"
          disabled={busy || !evaluation?.canApprove || recipient.draftStatus === "SENT_MANUALLY"}
          onClick={() => void handleApprove()}
          type="button"
        >
          {copy.approveOne}
        </button>
        {recipient.draftStatus === "OPENED_EXTERNALLY" ? (
          <span className="self-center text-sm text-sky-300" data-testid="campaign-opened-external-badge">
            {copy.openedExternalStatus}
          </span>
        ) : null}
        {recipient.draftStatus === "SENT_MANUALLY" ? (
          <span className="self-center text-sm text-green-300" data-testid="campaign-sent-manual-badge">
            {copy.sentManualStatus}
          </span>
        ) : null}
      </div>

      {canHandoff ? (
        <div className="mt-5 space-y-4" data-testid="campaign-compose-handoff">
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded border border-slate-700 px-4 py-2 text-sm"
              data-testid="open-gmail-compose"
              disabled={busy}
              onClick={() => void handleOpenExternal("gmail")}
              type="button"
            >
              {dictionary.leadops.copyActions.openGmail}
            </button>
            <button
              className="rounded border border-slate-700 px-4 py-2 text-sm"
              data-testid="open-outlook-compose"
              disabled={busy}
              onClick={() => void handleOpenExternal("outlook")}
              type="button"
            >
              {dictionary.leadops.copyActions.openOutlook}
            </button>
            <button
              className="rounded border border-slate-700 px-4 py-2 text-sm"
              data-testid="open-default-compose"
              disabled={busy}
              onClick={() => void handleOpenExternal("default")}
              type="button"
            >
              {dictionary.leadops.copyActions.openDefault}
            </button>
            <button
              className="rounded border border-slate-700 px-4 py-2 text-sm"
              data-testid="simulate-campaign-send"
              disabled={busy}
              onClick={() => void handleSimulate()}
              type="button"
            >
              {copy.simulateSend}
            </button>
          </div>
          <EmailCopyActions
            composition={composition!}
            dictionary={dictionary}
            onFeedback={(message) => setFeedback(message)}
            recipientEmail={recipient.snapshotEmail}
          />
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
            {!confirmSent ? (
              <button
                className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                data-testid="mark-sent-externally"
                disabled={busy}
                onClick={() => setConfirmSent(true)}
                type="button"
              >
                {copy.markSentExternally}
              </button>
            ) : (
              <div className="space-y-3" data-testid="confirm-manual-sent">
                <p className="text-sm text-slate-300">{copy.confirmSentBody}</p>
                <p className="text-sm">
                  <strong>{recipient.snapshotCompanyName}</strong> · {recipient.personalizedSubject}
                </p>
                <label className="block text-sm">
                  <span className="text-slate-400">{copy.operatorNote}</span>
                  <input
                    className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2"
                    onChange={(event) => setOperatorNote(event.target.value)}
                    value={operatorNote}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-400">
                  <input
                    checked={cooldownOverride}
                    onChange={(event) => setCooldownOverride(event.target.checked)}
                    type="checkbox"
                  />
                  {copy.cooldownOverride}
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded bg-green-600 px-4 py-2 text-sm font-semibold text-white"
                    data-testid="confirm-mark-sent"
                    disabled={busy}
                    onClick={() => void handleMarkSent()}
                    type="button"
                  >
                    {copy.confirmSent}
                  </button>
                  <button
                    className="rounded border border-slate-700 px-4 py-2 text-sm"
                    onClick={() => setConfirmSent(false)}
                    type="button"
                  >
                    {dictionary.leadops.import.cancel}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {feedback ? (
        <p className="mt-4 text-sm text-green-400" data-testid="campaign-review-feedback">
          {feedback}
        </p>
      ) : null}
    </section>
  );
}

export function CampaignBulkApprovalBar({
  campaignId,
  dictionary,
  onNotify,
  onRecipientsUpdated,
  repos,
  tenantId
}: {
  campaignId: string;
  dictionary: Dictionary;
  onNotify: () => void;
  onRecipientsUpdated: () => Promise<void>;
  repos: LocalRepositoryBundle;
  tenantId: string;
}) {
  const copy = dictionary.leadops.campaigns.review;
  const [summary, setSummary] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleBulkApprove() {
    setBusy(true);
    try {
      const result = await bulkApproveRecipientDrafts(repos, tenantId, campaignId);
      await onRecipientsUpdated();
      onNotify();
      setSummary(
        copy.bulkSummary
          .replace("{approved}", String(result.approved))
          .replace("{skipped}", String(result.skipped.length))
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        className="rounded border border-orange-400 px-4 py-2 text-sm text-orange-300 disabled:opacity-50"
        data-testid="bulk-approve-campaign-drafts"
        disabled={busy}
        onClick={() => void handleBulkApprove()}
        type="button"
      >
        {copy.bulkApproveSafe}
      </button>
      {summary ? <p className="text-sm text-slate-400">{summary}</p> : null}
    </div>
  );
}
