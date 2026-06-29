import Link from "next/link";
import { notFound } from "next/navigation";
import { AppFrame, panelClass } from "@/components/app-frame";
import { calculateLeadOpsKpis } from "@/features/leadops/kpis";
import { getLocalizedLeadDetailHref } from "@/features/leadops/lookup";
import {
  getFilterOptions,
  getTenantActivities,
  getTenantCampaigns,
  getTenantLeads,
  LEADOPS_DEMO_TENANT_ID
} from "@/features/leadops/seed";
import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function generateStaticParams() {
  return [{ locale: "pt-PT" }, { locale: "en" }];
}

export default async function LeadOpsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);
  const leads = getTenantLeads(LEADOPS_DEMO_TENANT_ID);
  const campaigns = getTenantCampaigns(LEADOPS_DEMO_TENANT_ID);
  const activities = getTenantActivities(LEADOPS_DEMO_TENANT_ID);
  const kpis = calculateLeadOpsKpis(leads, campaigns);
  const options = getFilterOptions(leads);

  return (
    <AppFrame
      activeModule="customers"
      dictionary={dictionary}
      locale={locale}
      supplementalRoute="leadops"
    >
      <section className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-300">
          {dictionary.leadops.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {dictionary.leadops.title}
        </h1>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
          {dictionary.leadops.description}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Kpi label={dictionary.leadops.kpis.totalLeads} value={String(kpis.totalLeads)} />
        <Kpi label={dictionary.leadops.kpis.ready} value={String(kpis.ready)} />
        <Kpi label={dictionary.leadops.kpis.queued} value={String(kpis.queued)} />
        <Kpi label={dictionary.leadops.kpis.activeCampaigns} value={String(kpis.activeCampaigns)} />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_0.45fr]">
        <article className={`${panelClass} overflow-hidden`}>
          <div className="border-b border-slate-800 p-5">
            <h2 className="text-lg font-bold">{dictionary.leadops.sections.leads}</h2>
            <p className="mt-1 text-sm text-slate-400">
              {dictionary.leadops.resultCount.replace("{count}", String(leads.length))}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead className="bg-slate-950/70 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">{dictionary.leadops.table.company}</th>
                  <th className="px-4 py-3">{dictionary.leadops.table.contact}</th>
                  <th className="px-4 py-3">{dictionary.leadops.table.industry}</th>
                  <th className="px-4 py-3">{dictionary.leadops.table.status}</th>
                  <th className="px-4 py-3">{dictionary.leadops.table.quality}</th>
                  <th className="px-4 py-3">{dictionary.leadops.table.source}</th>
                  <th className="px-4 py-3 text-right">{dictionary.leadops.table.viewLead}</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr className="border-t border-slate-800" key={lead.id}>
                    <td className="px-4 py-3 font-semibold">{lead.companyName}</td>
                    <td className="px-4 py-3 text-slate-300">{lead.contactName}</td>
                    <td className="px-4 py-3 text-slate-300">{lead.industry}</td>
                    <td className="px-4 py-3">
                      <Badge>{dictionary.leadops.statuses[lead.status]}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge>{dictionary.leadops.qualities[lead.quality]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{lead.sourceDatabase}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        className="font-semibold text-blue-300 hover:text-blue-200"
                        href={getLocalizedLeadDetailHref(locale, lead.id)}
                      >
                        {dictionary.leadops.table.viewLead}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="grid gap-4">
          <article className={`${panelClass} p-5`}>
            <h2 className="text-lg font-bold">{dictionary.leadops.detailWorkspace.importSummary}</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <SummaryLine label={dictionary.leadops.detailWorkspace.importTotal} value="2,536" />
              <SummaryLine label={dictionary.leadops.detailWorkspace.importValid} value="2,536" />
              <SummaryLine label={dictionary.leadops.detailWorkspace.importReview} value="101" />
              <SummaryLine label={dictionary.leadops.detailWorkspace.importReady} value={String(kpis.ready)} />
            </div>
          </article>
          <article className={`${panelClass} p-5`}>
            <h2 className="text-lg font-bold">{dictionary.leadops.sections.campaigns}</h2>
            <div className="mt-4 space-y-3">
              {campaigns.map((campaign) => (
                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3" key={campaign.id}>
                  <div className="font-semibold">{campaign.name}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {dictionary.leadops.campaignStatuses[campaign.status]} - {campaign.sentCount}/{campaign.totalCount}
                  </div>
                </div>
              ))}
            </div>
          </article>
          <article className={`${panelClass} p-5`}>
            <h2 className="text-lg font-bold">{dictionary.leadops.sections.activity}</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              {activities.slice(0, 4).map((activity) => (
                <div key={activity.id}>
                  {dictionary.leadops.activities[activity.kind]} - {activity.companyName}
                </div>
              ))}
            </div>
          </article>
          <article className={`${panelClass} p-5`}>
            <h2 className="text-lg font-bold">{dictionary.leadops.filters.industry}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {options.industries.join(", ")}
            </p>
          </article>
        </aside>
      </section>
    </AppFrame>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <article className={`${panelClass} p-4`}>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </article>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-slate-700 bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-200">
      {children}
    </span>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-400">{label}</span>
      <span className="font-bold text-slate-100">{value}</span>
    </div>
  );
}
