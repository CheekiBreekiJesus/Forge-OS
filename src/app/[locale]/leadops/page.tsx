import { notFound } from "next/navigation";
import { LeadOpsDashboardShell } from "@/components/leadops-dashboard-shell";
import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function generateStaticParams() {
  return [{ locale: "pt-PT" }, { locale: "en" }];
}

export default async function LeadOpsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  return <LeadOpsDashboardShell dictionary={dictionary} locale={locale} />;
}
