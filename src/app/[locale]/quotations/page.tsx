import { notFound } from "next/navigation";
import { QuotationsShell } from "@/components/quotations-shell";
import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function generateStaticParams() {
  return [{ locale: "pt-PT" }, { locale: "en" }];
}

export default async function QuotationsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  return <QuotationsShell dictionary={dictionary} locale={locale} />;
}
