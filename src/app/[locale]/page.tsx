import { notFound } from "next/navigation";
import { DashboardClientShell } from "@/components/dashboard-client-shell";
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

  return <DashboardClientShell dictionary={dictionary} locale={locale} />;
}
