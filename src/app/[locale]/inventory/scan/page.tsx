import { notFound } from "next/navigation";
import { InventoryScanShell } from "@/components/inventory-mobile/inventory-scan-shell";
import { isSupportedLocale, supportedLocales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function generateStaticParams() {
  return supportedLocales.map((locale) => ({ locale }));
}

export default async function InventoryScanPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();

  const dictionary = await getDictionary(locale);

  return <InventoryScanShell dictionary={dictionary} locale={locale} />;
}
