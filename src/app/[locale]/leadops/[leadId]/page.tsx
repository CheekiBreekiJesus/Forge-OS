import { notFound } from "next/navigation";
import { LeadOpsDetailShell } from "@/components/leadops-detail-shell";
import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamicParams = true;

export function generateStaticParams() {
  return ["pt-PT", "en"].flatMap((locale) => [
    { locale, leadId: "leadops_001" },
    { locale, leadId: "leadops_006" }
  ]);
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

  const dictionary = await getDictionary(locale);

  return (
    <LeadOpsDetailShell dictionary={dictionary} leadId={leadId} locale={locale} />
  );
}
