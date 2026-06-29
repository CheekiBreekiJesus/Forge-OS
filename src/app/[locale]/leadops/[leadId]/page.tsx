import { notFound } from "next/navigation";
import { LeadOpsDetailWorkspace } from "@/components/leadops-detail-workspace";
import { findLeadById } from "@/features/leadops/lookup";
import {
  getTenantCampaigns,
  leadOpsLeads,
  LEADOPS_DEMO_TENANT_ID
} from "@/features/leadops/seed";
import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function generateStaticParams() {
  return ["pt-PT", "en"].flatMap((locale) =>
    leadOpsLeads
      .filter((lead) => lead.tenantId === LEADOPS_DEMO_TENANT_ID)
      .map((lead) => ({
        leadId: lead.id,
        locale
      }))
  );
}

export default async function LeadOpsDetailPage({
  params
}: {
  params: Promise<{ leadId: string; locale: string }>;
}) {
  const { leadId, locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const lead = findLeadById(LEADOPS_DEMO_TENANT_ID, leadId, leadOpsLeads);

  if (!lead) {
    notFound();
  }

  const dictionary = await getDictionary(locale);
  const campaigns = getTenantCampaigns(LEADOPS_DEMO_TENANT_ID);

  return (
    <LeadOpsDetailWorkspace
      campaigns={campaigns}
      dictionary={dictionary}
      lead={lead}
      locale={locale}
    />
  );
}
