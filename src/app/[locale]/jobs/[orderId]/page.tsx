import { notFound } from "next/navigation";
import { JobCardClientShell } from "@/components/job-card-client-shell";
import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export const dynamicParams = true;

export function generateStaticParams() {
  return ["pt-PT", "en"].map((locale) => ({ locale, orderId: "po_demo_placeholder" }));
}

export default async function JobCardPage({
  params
}: {
  params: Promise<{ locale: string; orderId: string }>;
}) {
  const { locale, orderId } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  return (
    <JobCardClientShell dictionary={dictionary} locale={locale} orderId={orderId} />
  );
}
