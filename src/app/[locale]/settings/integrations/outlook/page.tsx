import { notFound } from "next/navigation";
import { OutlookIntegrationPanel } from "@/components/outlook-integration-panel";
import { isSupportedLocale } from "@/i18n/config";

export default async function OutlookIntegrationPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  return <OutlookIntegrationPanel locale={locale} />;
}
