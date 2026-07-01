import { notFound } from "next/navigation";
import { MarketingStudioShell, type MarketingSection } from "@/components/marketing-studio-shell";
import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

const sections = [
  "campaigns",
  "image-studio",
  "assets",
  "brand-kit",
  "audiences",
  "accounts",
  "analytics",
  "video-studio"
] satisfies Exclude<MarketingSection, "overview">[];

export function generateStaticParams() {
  return ["pt-PT", "en"].flatMap((locale) =>
    sections.map((section) => ({
      locale,
      section
    }))
  );
}

export default async function MarketingSectionPage({
  params
}: {
  params: Promise<{ locale: string; section: string }>;
}) {
  const { locale, section } = await params;
  if (!isSupportedLocale(locale) || !sections.includes(section as Exclude<MarketingSection, "overview">)) notFound();
  const dictionary = await getDictionary(locale);
  return (
    <MarketingStudioShell
      dictionary={dictionary}
      locale={locale}
      section={section as MarketingSection}
    />
  );
}
