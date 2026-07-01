"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  refreshCampaignRecipients
} from "@/application/campaign-segmentation-service";
import { AppFrame, panelClass } from "@/components/app-frame";
import type { CampaignRecipient, OutreachCampaign } from "@/domain/campaign-types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { usePersistence } from "@/persistence/provider";

type LeadOpsCampaignDetailShellProps = {
  dictionary: Dictionary;
  locale: Locale;
  campaignId: string;
};

export function LeadOpsCampaignDetailShell({
  dictionary,
  locale,
  campaignId
}: LeadOpsCampaignDetailShellProps) {
  const copy = dictionary.leadops;
  const { state, tenantId, notifyDataChanged } = usePersistence();
  const [campaign, setCampaign] = useState<OutreachCampaign | null>(null);
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);
  const [refreshDiff, setRefreshDiff] = useState<string | null>(null);
  const [confirmRefresh, setConfirmRefresh] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (state.status !== "ready") return;
    let cancelled = false;
    void (async () => {
      const row = await state.repos.campaigns.getById(tenantId, campaignId);
      const snapshot = await state.repos.campaignRecipients.listForCampaign(tenantId, campaignId);
      if (cancelled) return;
      setCampaign(row);
      setRecipients(snapshot);
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId, state, tenantId]);

  const reloadSnapshot = async () => {
    if (state.status !== "ready") return;
    const row = await state.repos.campaigns.getById(tenantId, campaignId);
    const snapshot = await state.repos.campaignRecipients.listForCampaign(tenantId, campaignId);
    setCampaign(row);
    setRecipients(snapshot);
  };

  const included = useMemo(() => recipients.filter((row) => row.status === "included"), [recipients]);
  const excluded = useMemo(() => recipients.filter((row) => row.status === "excluded"), [recipients]);

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

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={`${panelClass} p-5`}>
          <h2 className="text-lg font-bold">{copy.campaigns.metadataTitle}</h2>
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
                  ? new Date(campaign.recipientSnapshotCreatedAt).toLocaleString(locale)
                  : "—"
              }
            />
          </dl>
        </section>

        <section className={`${panelClass} p-5`}>
          <h2 className="text-lg font-bold">{copy.campaigns.exclusionsTitle}</h2>
          <p className="mt-2 text-sm text-slate-400" data-testid="campaign-exclusion-count">
            {copy.campaigns.excludedCount.replace("{count}", String(excluded.length))}
          </p>
        </section>

        <section className={`${panelClass} p-5 xl:col-span-2`}>
          <h2 className="text-lg font-bold">{copy.campaigns.segmentDefinitionTitle}</h2>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-400">
            {JSON.stringify(campaign.segmentDefinition, null, 2)}
          </pre>
        </section>

        <section className={`${panelClass} p-5 xl:col-span-2`} data-testid="campaign-recipient-snapshot">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{copy.campaigns.snapshotTitle}</h2>
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

        <section className={`${panelClass} border-dashed p-5 xl:col-span-2`}>
          <h2 className="text-lg font-bold text-slate-400">{copy.campaigns.nextStepTemplate}</h2>
          <p className="mt-2 text-sm text-slate-500">{copy.campaigns.nextStepTemplateHint}</p>
        </section>

        <section className={`${panelClass} border-dashed p-5 xl:col-span-2`}>
          <h2 className="text-lg font-bold text-slate-400">{copy.campaigns.nextStepDrafts}</h2>
          <p className="mt-2 text-sm text-slate-500">{copy.campaigns.nextStepDraftsHint}</p>
        </section>
      </div>
    </AppFrame>
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
