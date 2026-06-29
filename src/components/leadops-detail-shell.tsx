import Link from "next/link";
import { AppFrame, panelClass } from "@/components/app-frame";
import { getLocalizedLeadOpsHref } from "@/features/leadops/lookup";
import type { LeadOpsLead } from "@/features/leadops/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type LeadOpsDetailShellProps = {
  dictionary: Dictionary;
  lead: LeadOpsLead;
  locale: Locale;
};

export function LeadOpsDetailShell({ dictionary, lead, locale }: LeadOpsDetailShellProps) {
  const copy = dictionary.leadops;

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
          {copy.backToDashboard}
        </Link>
        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-orange-300">
          {copy.detailEyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{copy.detailTitle}</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">{copy.detailDescription}</p>
      </section>

      <section className={`${panelClass} p-5`}>
        <h2 className="text-lg font-bold">{lead.companyName}</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <DetailField label={copy.detailFields.company} value={lead.companyName} />
          <DetailField label={copy.detailFields.contact} value={lead.contactName} />
          <DetailField label={copy.detailFields.email} value={lead.email} />
          <DetailField label={copy.detailFields.location} value={lead.location} />
          <DetailField label={copy.detailFields.industry} value={lead.industry} />
          <DetailField label={copy.detailFields.status} value={copy.statuses[lead.status]} />
          <DetailField label={copy.detailFields.quality} value={copy.qualities[lead.quality]} />
          <DetailField label={copy.detailFields.source} value={lead.source} />
          <DetailField label={copy.detailFields.sourceDatabase} value={lead.sourceDatabase} />
          <DetailField label={copy.detailFields.language} value={lead.language} />
          <DetailField label={copy.detailFields.website} value={lead.website ?? "—"} />
        </dl>
        <p className="mt-6 rounded-lg border border-dashed border-slate-700 bg-slate-950/30 p-4 text-sm text-slate-400">
          {copy.detailPlaceholder}
        </p>
      </section>
    </AppFrame>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-100">{value}</dd>
    </div>
  );
}
