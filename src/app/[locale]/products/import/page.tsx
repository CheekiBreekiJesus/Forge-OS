import { notFound } from "next/navigation";
import { ProductImportRuntimeShell } from "@/components/product-import-runtime-shell";
import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function generateStaticParams() {
  return ["pt-PT", "en"].map((locale) => ({ locale }));
}

export default async function ProductImportPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const dictionary = await getDictionary(locale);
  return <ProductImportRuntimeShell dictionary={dictionary} locale={locale} />;
}
