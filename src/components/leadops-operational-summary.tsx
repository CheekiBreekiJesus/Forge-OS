"use client";

import React, { useEffect, useState } from "react";
import { panelClass } from "@/components/app-frame";
import {
  computeOutreachOperationalMetrics,
  type OutreachOperationalMetrics
} from "@/features/leadops/operational-metrics";
import type { Dictionary } from "@/i18n/dictionaries";
import { usePersistence } from "@/persistence/provider";

type LeadOpsOperationalSummaryProps = {
  dictionary: Dictionary;
};

export function LeadOpsOperationalSummary({ dictionary }: LeadOpsOperationalSummaryProps) {
  const copy = dictionary.leadops.operationalSummary;
  const { state, tenantId } = usePersistence();
  const [metrics, setMetrics] = useState<OutreachOperationalMetrics | null>(null);

  useEffect(() => {
    if (state.status !== "ready") return;
    void (async () => {
      const [leads, contacts, campaigns, recipients, suppressions, activities] = await Promise.all([
        state.repos.leads.list(tenantId),
        state.repos.leadContacts.list(tenantId),
        state.repos.campaigns.list(tenantId),
        state.repos.campaignRecipients.listForTenant(tenantId),
        state.repos.emailSuppressions.listActive(tenantId),
        state.repos.activities.list(tenantId)
      ]);
      const recentWarnings = activities.filter(
        (row) =>
          row.action === "campaign_draft_duplicate_blocked" ||
          row.action === "campaign_draft_approval_invalidated"
      ).length;
      setMetrics(
        computeOutreachOperationalMetrics({
          leads,
          contacts,
          campaigns,
          recipients,
          suppressions,
          recentWarningCount: recentWarnings
        })
      );
    })();
  }, [state, tenantId]);

  if (!metrics) return null;

  const items: Array<{ key: keyof OutreachOperationalMetrics; value: number }> = [
    { key: "importedOrganizations", value: metrics.importedOrganizations },
    { key: "validContacts", value: metrics.validContacts },
    { key: "invalidOrMissingEmailContacts", value: metrics.invalidOrMissingEmailContacts },
    { key: "draftCampaigns", value: metrics.draftCampaigns },
    { key: "draftsAwaitingReview", value: metrics.draftsAwaitingReview },
    { key: "approvedRecipients", value: metrics.approvedRecipients },
    { key: "openedExternally", value: metrics.openedExternally },
    { key: "manuallySent", value: metrics.manuallySent },
    { key: "suppressed", value: metrics.suppressed },
    { key: "recentWarnings", value: metrics.recentWarnings }
  ];

  return (
    <section className={`${panelClass} p-5`} data-testid="leadops-operational-summary">
      <h2 className="text-lg font-bold text-slate-100">{copy.title}</h2>
      <p className="mt-1 text-sm text-slate-400">{copy.description}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {items.map(({ key, value }) => (
          <article className="rounded-lg border border-slate-800 bg-slate-950/50 p-3" data-testid={`operational-metric-${key}`} key={key}>
            <p className="text-xs uppercase tracking-wide text-slate-500">{copy.metrics[key]}</p>
            <p className="mt-1 text-2xl font-bold text-slate-100">{value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
