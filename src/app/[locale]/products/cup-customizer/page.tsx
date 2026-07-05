import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CupCustomizerShell } from "@/components/cup-customizer-shell";
import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function generateStaticParams() {
  return [{ locale: "pt-PT" }, { locale: "en" }];
}

export default async function ProductsCupCustomizerPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  return (
    <Suspense fallback={<div className="p-8 text-slate-400">{dictionary.customizerModule.loading}</div>}>
      <CupCustomizerShell dictionary={dictionary} entryRoute="products/cup-customizer" locale={locale} />
    </Suspense>
  );
}
