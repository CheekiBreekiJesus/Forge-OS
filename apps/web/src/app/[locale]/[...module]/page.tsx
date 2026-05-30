import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/layout/app-shell";

export default async function ModulePlaceholderPage({
  params,
}: {
  params: Promise<{ locale: string; module: string[] }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("common");

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h1 className="text-2xl font-semibold text-forge-foreground">{t("comingSoon")}</h1>
        <p className="mt-2 text-forge-muted">ForgeOS</p>
      </div>
    </AppShell>
  );
}
