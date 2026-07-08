"use client";

import { LeadOpsDetailWorkspace } from "@/components/leadops-detail-workspace";
import { toLeadOpsCampaign, toLeadOpsLead } from "@/domain/mappers";
import { useLeadById } from "@/persistence/hooks";
import { usePersistence, usePersistenceLoading } from "@/persistence/provider";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { AppFrame, panelClass } from "@/components/app-frame";
import Link from "next/link";
import { getLocalizedLeadOpsHref } from "@/features/leadops/lookup";
import { useEffect, useState } from "react";
import type { LeadOpsCampaign } from "@/features/leadops/types";

type LeadOpsDetailShellProps = {
  dictionary: Dictionary;
  leadId: string;
  locale: Locale;
};

export function LeadOpsDetailShell({
  dictionary,
  leadId,
  locale
}: LeadOpsDetailShellProps) {
  const loading = usePersistenceLoading();
  const { lead, loading: leadLoading, notFound } = useLeadById(leadId);
  const { state } = usePersistence();
  const [campaigns, setCampaigns] = useState<LeadOpsCampaign[]>([]);

  useEffect(() => {
    if (state.status !== "ready") return;
    void state.repos.campaigns.list(state.tenantId).then((rows) => {
      setCampaigns(rows.map(toLeadOpsCampaign));
    });
  }, [state]);

  if (loading || leadLoading) {
    return (
      <AppFrame
        activeModule="marketing"
        dictionary={dictionary}
        locale={locale}
        supplementalRoute={`leadops/${leadId}`}
      >
        <div className={`${panelClass} p-8 text-center text-slate-400`}>
          {dictionary.demoWorkflow.persistence.loading}
        </div>
      </AppFrame>
    );
  }

  if (notFound || !lead) {
    return (
      <AppFrame
        activeModule="marketing"
        dictionary={dictionary}
        locale={locale}
        supplementalRoute={`leadops/${leadId}`}
      >
        <div className={`${panelClass} p-8 text-center`}>
          <p className="text-slate-300">{dictionary.leadops.detailWorkspace.leadNotFound}</p>
          <Link
            className="mt-4 inline-block text-blue-300"
            href={getLocalizedLeadOpsHref(locale)}
          >
            {dictionary.leadops.backToDashboard}
          </Link>
        </div>
      </AppFrame>
    );
  }

  return (
    <LeadOpsDetailWorkspace
      campaigns={campaigns}
      dictionary={dictionary}
      lead={toLeadOpsLead(lead)}
      locale={locale}
    />
  );
}
