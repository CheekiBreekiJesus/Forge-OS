"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { KpiCard } from "@forgeos/ui";
import { formatCurrency, formatDeltaPercent } from "@forgeos/i18n";
import type { SupportedLocale } from "@forgeos/i18n";
import type { DashboardKpi } from "@forgeos/shared";

const KPI_TITLE_KEYS: Record<string, string> = {
  oee: "oee",
  revenue: "revenue",
  openQuotations: "openQuotations",
  overdueOrders: "overdueOrders",
  maintenanceAlerts: "maintenanceAlerts",
};

export function KpiRow({ kpis }: { kpis: DashboardKpi[] }) {
  const t = useTranslations("dashboard.kpi");
  const locale = useLocale() as SupportedLocale;

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {kpis.map((kpi) => {
        const titleKey = KPI_TITLE_KEYS[kpi.key];
        const title = titleKey ? t(titleKey) : kpi.key;

        let displayValue = kpi.displayValue;
        if (kpi.key === "revenue") {
          displayValue = formatCurrency(kpi.value, locale, "EUR");
        } else if (kpi.key === "oee") {
          displayValue = `${kpi.value}%`;
        } else {
          displayValue = String(kpi.value);
        }

        const changePrefix =
          kpi.key === "openQuotations"
            ? kpi.change > 0
              ? `↑ ${kpi.change}`
              : `${kpi.change}`
            : formatDeltaPercent(Math.abs(kpi.change), locale);

        const arrow =
          kpi.change > 0 ? "↑" : kpi.change < 0 ? "↓" : "";
        const changeText =
          kpi.key === "openQuotations"
            ? `${changePrefix} ${t("vsLastWeek")}`
            : `${arrow} ${formatDeltaPercent(Math.abs(kpi.change), locale)} ${t("vsLastWeek")}`;

        return (
          <KpiCard
            key={kpi.key}
            title={title}
            value={displayValue}
            changeText={changeText}
            trend={kpi.trend}
            variant={kpi.variant}
            sparkline={kpi.sparkline}
          />
        );
      })}
    </div>
  );
}
