import { notFound } from "next/navigation";
import { LeadOpsCampaignDetailShell } from "@/components/leadops-campaign-detail-shell";
import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamicParams = true;

export function generateStaticParams() {
  return ["pt-PT", "en"].flatMap((locale) => [
    { locale, campaignId: "campaign_001" }
  ]);
}

export default async function LeadOpsCampaignDetailPage({
  params
}: {
  params: Promise<{ campaignId: string; locale: string }>;
}) {
  const { campaignId, locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  return (
    <LeadOpsCampaignDetailShell
      campaignId={campaignId}
      dictionary={dictionary}
      locale={locale}
    />
  );
}
