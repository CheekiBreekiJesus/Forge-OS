import { notFound } from "next/navigation";
import { DemoWorkflowShell } from "@/components/demo-workflow-shell";
import { isSupportedLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export function generateStaticParams() {
  return [{ locale: "pt-PT" }, { locale: "en" }];
}

export default async function DemoPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  return <DemoWorkflowShell dictionary={dictionary} locale={locale} />;
}
