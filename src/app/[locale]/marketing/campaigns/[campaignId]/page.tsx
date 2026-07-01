import { notFound } from "next/navigation";
import { MarketingStudioShell } from "@/components/marketing-studio-shell";
import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function generateStaticParams() {
  return [
    { campaignId: "local-preview", locale: "pt-PT" },
    { campaignId: "local-preview", locale: "en" }
  ];
}

export default async function MarketingCampaignPage({
  params
}: {
  params: Promise<{ campaignId: string; locale: string }>;
}) {
  const { campaignId, locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dictionary = await getDictionary(locale);
  return (
    <MarketingStudioShell
      campaignId={campaignId}
      dictionary={dictionary}
      locale={locale}
      section="campaigns"
    />
  );
}
