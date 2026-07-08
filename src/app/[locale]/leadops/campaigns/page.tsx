import { notFound } from "next/navigation";
import { LeadOpsCampaignListShell } from "@/components/leadops-campaign-list-shell";
import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function generateStaticParams() {
  return [{ locale: "pt-PT" }, { locale: "en" }];
}

export default async function LeadOpsCampaignsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  return <LeadOpsCampaignListShell dictionary={dictionary} locale={locale} />;
}
