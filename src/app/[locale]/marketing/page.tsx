import { notFound } from "next/navigation";
import { MarketingStudioShell } from "@/components/marketing-studio-shell";
import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function generateStaticParams() {
  return [{ locale: "pt-PT" }, { locale: "en" }];
}

export default async function MarketingPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dictionary = await getDictionary(locale);
  return <MarketingStudioShell dictionary={dictionary} locale={locale} section="overview" />;
}
