import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getDictionary } from "@/i18n/dictionaries";
import { isSupportedLocale } from "@/i18n/config";

export default async function LocaleHomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  return <DashboardShell dictionary={dictionary} locale={locale} />;
}
