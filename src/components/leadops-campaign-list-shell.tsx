"use client";

import React, { useEffect, useState } from "react";
import { buildLeadManagementContext, countSendableRecipientsForCampaign } from "@/application/campaign-segmentation-service";
import { AppFrame, panelClass } from "@/components/app-frame";
import { CollapsibleTableViewport } from "@/components/ui/collapsible-table-viewport";
import { toLeadOpsCampaign } from "@/domain/mappers";
import {
  sliceRowsForViewport,
  totalPagesForViewport,
  useCollapsibleRows
} from "@/features/ui/use-collapsible-rows";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { usePersistence } from "@/persistence/provider";

type LeadOpsCampaignListShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

export function LeadOpsCampaignListShell({ dictionary, locale }: LeadOpsCampaignListShellProps) {
  const copy = dictionary.leadops;
  const { state, tenantId } = usePersistence();
  const [sendableByCampaign, setSendableByCampaign] = useState<Record<string, number>>({});
  const [campaignRows, setCampaignRows] = useState<ReturnType<typeof toLeadOpsCampaign>[]>([]);
  const [page, setPage] = useState(1);
  const collapsible = useCollapsibleRows({
    totalRows: campaignRows.length,
    locale
  });
  const pages = totalPagesForViewport(campaignRows.length, collapsible.visibleRowCount);
  const effectivePage = Math.min(page, pages);
  const visibleCampaigns = sliceRowsForViewport(campaignRows, effectivePage, collapsible.visibleRowCount);

  useEffect(() => {
    if (state.status !== "ready") return;
    void state.repos.campaigns.list(tenantId).then(async (rows) => {
      const mapped = rows.map(toLeadOpsCampaign);
      setCampaignRows(mapped);
      const context = await buildLeadManagementContext(state.repos, tenantId);
      const counts: Record<string, number> = {};
      for (const campaign of rows) {
        counts[campaign.id] = countSendableRecipientsForCampaign(campaign.id, context);
      }
      setSendableByCampaign(counts);
    });
  }, [state, tenantId]);

  return (
    <AppFrame activeModule="marketing" dictionary={dictionary} locale={locale} supplementalRoute="leadops">
      <section className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-300">{copy.campaigns.eyebrow}</p>
        <h1 className="mt-2 text-2xl font-bold">{copy.campaigns.listTitle}</h1>
        <p className="mt-2 text-sm text-slate-400">{copy.campaigns.listDescription}</p>
        <a className="mt-3 inline-block text-sm text-orange-300 hover:underline" href={`/${locale}/leadops`}>
          {copy.backToDashboard}
        </a>
      </section>

      <section className={`${panelClass} p-5`} data-testid="campaign-list">
        <CollapsibleTableViewport
          controlsId={collapsible.controlsId}
          expanded={collapsible.expanded}
          labels={collapsible.labels}
          onToggleExpanded={collapsible.toggleExpanded}
          showExpandControl={collapsible.showExpandControl}
          showingTotal={campaignRows.length}
          showingVisible={visibleCampaigns.length}
          tableId="campaign-list-table"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr>
                  <th className="px-3 py-2">{copy.campaigns.name}</th>
                  <th className="px-3 py-2">{copy.campaigns.status}</th>
                  <th className="px-3 py-2">{copy.campaigns.createdAt}</th>
                  <th className="px-3 py-2">{copy.campaigns.recipientCount}</th>
                  <th className="px-3 py-2">{copy.campaigns.sendableCount}</th>
                  <th className="px-3 py-2">{copy.campaigns.language}</th>
                  <th className="px-3 py-2">{copy.campaigns.deliveryMode}</th>
                </tr>
              </thead>
              <tbody>
                {visibleCampaigns.map((campaign) => (
                  <tr className="border-t border-slate-800" data-testid={`campaign-row-${campaign.id}`} key={campaign.id}>
                    <td className="px-3 py-2">
                      <a className="text-orange-300 hover:underline" href={`/${locale}/leadops/campaigns/${campaign.id}`}>
                        {campaign.name}
                      </a>
                    </td>
                    <td className="px-3 py-2">{copy.campaignStatuses[campaign.status]}</td>
                    <td className="px-3 py-2">{new Date(campaign.createdAt ?? campaign.id).toLocaleDateString(locale)}</td>
                    <td className="px-3 py-2">{campaign.recipientSnapshotCount ?? campaign.totalCount}</td>
                    <td className="px-3 py-2">{sendableByCampaign[campaign.id] ?? 0}</td>
                    <td className="px-3 py-2">{campaign.language ?? "—"}</td>
                    <td className="px-3 py-2">{copy.campaigns.deliveryModes[campaign.deliveryMode ?? "simulation"]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleTableViewport>
        {campaignRows.length > collapsible.visibleRowCount ? (
          <div className="mt-3 flex items-center justify-end gap-2 text-sm text-slate-400">
            <button
              className="rounded border border-slate-700 px-3 py-1 disabled:opacity-50"
              disabled={effectivePage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              {copy.management.previousPage}
            </button>
            <span>
              {copy.management.pageLabel.replace("{page}", String(effectivePage)).replace("{pages}", String(pages))}
            </span>
            <button
              className="rounded border border-slate-700 px-3 py-1 disabled:opacity-50"
              disabled={effectivePage >= pages}
              onClick={() => setPage((current) => Math.min(pages, current + 1))}
              type="button"
            >
              {copy.management.nextPage}
            </button>
          </div>
        ) : null}
      </section>
    </AppFrame>
  );
}
