"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppFrame } from "@/components/app-frame";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { AlertsActivityPanel } from "@/components/dashboard/alerts-activity-panel";
import { DashboardCopilot } from "@/components/dashboard/dashboard-copilot";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { InventorySummary } from "@/components/dashboard/inventory-summary";
import { MarketingSummaryCard } from "@/components/dashboard/marketing-summary-card";
import { OeeSummary } from "@/components/dashboard/oee-summary";
import { ProductionOrdersTable } from "@/components/dashboard/production-orders-table";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { deriveDashboardAlerts } from "@/features/dashboard/alerts";
import type { CopilotPromptKey } from "@/features/dashboard/copilot";
import {
  deriveDashboardKpis,
  deriveInventorySummary,
  deriveMarketingSummary,
  deriveOeeMetrics,
  deriveProductionOrderRows,
  deriveRevenueSeries
} from "@/features/dashboard/metrics";
import {
  isPanelVisible,
  readDashboardPreferences,
  type DashboardPreferences
} from "@/features/dashboard/preferences";
import { deriveLocalNotifications } from "@/features/notifications/local-notifications";
import { useActivities, useDashboardMetrics } from "@/persistence/hooks";
import { usePersistence, usePersistenceLoading } from "@/persistence/provider";
import { formatDateTime } from "@/i18n/format-datetime";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { getLocalizedModuleHref } from "@/modules/config";
import { panelClass } from "@/theme/ui-classes";

type DashboardClientShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

export function DashboardClientShell({ dictionary, locale }: DashboardClientShellProps) {
  const loading = usePersistenceLoading();
  const { tenantId, state } = usePersistence();
  const { metrics } = useDashboardMetrics();
  const { activities } = useActivities();
  const [preferences, setPreferences] = useState<DashboardPreferences>(() =>
    readDashboardPreferences()
  );
  const [quotes, setQuotes] = useState<Awaited<ReturnType<typeof loadQuotes>>>([]);
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof loadOrders>>>([]);
  const [inventory, setInventory] = useState<Awaited<ReturnType<typeof loadInventory>>>([]);
  const [notifications, setNotifications] = useState<
    Awaited<ReturnType<typeof deriveLocalNotifications>>
  >([]);

  useEffect(() => {
    function handlePrefs() {
      setPreferences(readDashboardPreferences());
    }
    window.addEventListener("storage", handlePrefs);
    window.addEventListener("forgeos:dashboard-preferences-changed", handlePrefs);
    return () => {
      window.removeEventListener("storage", handlePrefs);
      window.removeEventListener("forgeos:dashboard-preferences-changed", handlePrefs);
    };
  }, []);

  useEffect(() => {
    if (state.status !== "ready") return;
    void (async () => {
      const repos = state.repos;
      const [nextQuotes, nextOrders, nextInventory, nextNotifications] = await Promise.all([
        loadQuotes(repos, tenantId),
        loadOrders(repos, tenantId),
        loadInventory(repos, tenantId),
        deriveLocalNotifications(repos, tenantId, locale)
      ]);
      setQuotes(nextQuotes);
      setOrders(nextOrders);
      setInventory(nextInventory);
      setNotifications(nextNotifications);
    })();
  }, [locale, state, tenantId]);

  const copy = dictionary.dashboardModule;
  const inventoryHref = getLocalizedModuleHref(locale, "inventory");
  const productionHref = getLocalizedModuleHref(locale, "production");
  const outreachHref = `/${locale}/leadops`;
  const marketingHref = getLocalizedModuleHref(locale, "marketing");

  const kpis = useMemo(
    () =>
      deriveDashboardKpis({
        openQuotations: metrics.openQuotations,
        productionOrders: metrics.productionOrders,
        outreachReady: metrics.outreachReady,
        outreachSent: metrics.outreachSent,
        quotes,
        orders,
        inventory,
        locale
      }),
    [inventory, locale, metrics, orders, quotes]
  );

  const oee = useMemo(() => deriveOeeMetrics(orders), [orders]);
  const inventoryRows = useMemo(
    () => deriveInventorySummary(inventory, locale, inventoryHref),
    [inventory, inventoryHref, locale]
  );
  const orderRows = useMemo(
    () => deriveProductionOrderRows(orders, locale, productionHref),
    [locale, orders, productionHref]
  );
  const revenue = useMemo(() => deriveRevenueSeries(quotes), [quotes]);
  const marketingSummary = useMemo(
    () =>
      deriveMarketingSummary({
        outreachReady: metrics.outreachReady,
        outreachSent: metrics.outreachSent,
        outreachQueued: metrics.outreachQueued
      }),
    [metrics]
  );

  const fallbackAlerts = dictionary.dashboard.activity.items.map((item, index) => ({
    id: `fallback-${index}`,
    title: item.title,
    detail: item.detail,
    timeLabel: item.time,
    priority: item.priority,
    tone: item.tone,
    href:
      index === 4
        ? getLocalizedModuleHref(locale, "orders")
        : index === 3
          ? inventoryHref
          : productionHref
  }));

  const alerts = useMemo(
    () => deriveDashboardAlerts(notifications, activities, locale, fallbackAlerts),
    [activities, fallbackAlerts, locale, notifications]
  );

  const kpiLabels: Record<(typeof kpis)[number]["key"], string> = {
    oee: copy.kpi.oee,
    revenue: copy.kpi.revenue,
    openQuotations: copy.kpi.openQuotations,
    delayedOrders: copy.kpi.delayedOrders,
    maintenanceAlerts: copy.kpi.maintenanceAlerts
  };

  const kpiLinks: Partial<Record<(typeof kpis)[number]["key"], string>> = {
    openQuotations: getLocalizedModuleHref(locale, "orders"),
    delayedOrders: productionHref,
    maintenanceAlerts: getLocalizedModuleHref(locale, "maintenance")
  };

  const densityGap = preferences.density === "compact" ? "gap-3" : "gap-4";

  return (
    <AppFrame activeModule="dashboard" dictionary={dictionary} locale={locale}>
      <section className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--forge-text-primary)] sm:text-3xl">
          {dictionary.dashboard.greeting}
        </h1>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-[var(--forge-text-muted)]">{dictionary.dashboard.title}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-3 py-2 text-sm text-[var(--forge-text-secondary)]">
              {dictionary.dashboard.dateRangeThisWeek}
            </span>
            <Link
              className="rounded-lg bg-[var(--forge-accent-orange)] px-4 py-2 text-sm font-bold text-white"
              href={outreachHref}
            >
              {copy.openOutreach}
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <div className={`${panelClass} p-8 text-center text-[var(--forge-text-muted)]`}>
          {dictionary.demoWorkflow.persistence.loading}
        </div>
      ) : (
        <>
          <section className={`grid min-w-0 ${densityGap} xl:grid-cols-5`}>
            {kpis.map((kpi) => (
              <DashboardKpiCard
                demoLabel={dictionary.dashboard.demoLabel}
                href={kpiLinks[kpi.key]}
                isDemo={kpi.isDemo}
                key={kpi.key}
                label={kpiLabels[kpi.key]}
                trend={kpi.trend}
                trendDirection={kpi.trendDirection}
                tone={kpi.tone}
                value={kpi.value}
              />
            ))}
          </section>

          {isPanelVisible(preferences, "onboarding") ? (
            <div className="mt-4">
              <OnboardingChecklist dictionary={dictionary} locale={locale} />
            </div>
          ) : null}

          {isPanelVisible(preferences, "marketing") ? (
            <div className="mt-4">
              <MarketingSummaryCard
                approvedLabel={copy.marketing.approved}
                demoLabel={dictionary.dashboard.demoLabel}
                draftsLabel={copy.marketing.drafts}
                isDemo={marketingSummary.isDemo}
                leadsReadyLabel={copy.marketing.leadsReady}
                marketingHref={marketingHref}
                openMarketingLabel={copy.marketing.openMarketing}
                openOutreachLabel={copy.marketing.openOutreach}
                openedLabel={copy.marketing.opened}
                outreachHref={outreachHref}
                summary={marketingSummary}
                suppressedLabel={copy.marketing.suppressed}
                title={copy.marketing.title}
              />
            </div>
          ) : null}

          <section className={`mt-4 grid min-w-0 ${densityGap} xl:grid-cols-3`}>
            {isPanelVisible(preferences, "oee") ? (
              <OeeSummary
                availabilityLabel={dictionary.dashboard.production.availability}
                days={dictionary.dashboard.production.days}
                demoLabel={dictionary.dashboard.demoLabel}
                metrics={oee}
                performanceLabel={dictionary.dashboard.production.performance}
                qualityLabel={dictionary.dashboard.production.quality}
                title={dictionary.dashboard.production.title}
                viewAllLabel={dictionary.dashboard.inventory.viewAll}
                viewHref={productionHref}
              />
            ) : null}
            {isPanelVisible(preferences, "inventory") ? (
              <InventorySummary
                demoLabel={dictionary.dashboard.demoLabel}
                emptyLabel={copy.noInventory}
                isDemo={inventory.length === 0}
                items={inventoryRows}
                title={dictionary.dashboard.inventory.title}
                viewAllLabel={dictionary.dashboard.inventory.viewAll}
                viewHref={inventoryHref}
              />
            ) : null}
            {isPanelVisible(preferences, "alerts") ? (
              <AlertsActivityPanel
                emptyLabel={copy.noActivity}
                items={alerts}
                title={dictionary.dashboard.activity.title}
                viewAllLabel={dictionary.dashboard.activity.viewAll}
                viewHref={outreachHref}
              />
            ) : null}
          </section>

          <section className={`mt-4 grid min-w-0 ${densityGap} xl:grid-cols-3`}>
            {isPanelVisible(preferences, "productionOrders") ? (
              <ProductionOrdersTable
                demoLabel={dictionary.dashboard.demoLabel}
                headers={dictionary.dashboard.orders.headers}
                isDemo={orders.length === 0}
                rows={orderRows}
                title={dictionary.dashboard.orders.title}
                viewAllLabel={dictionary.dashboard.orders.viewAll}
                viewHref={productionHref}
              />
            ) : null}
            {isPanelVisible(preferences, "revenue") ? (
              <RevenueChart
                demoLabel={dictionary.dashboard.demoLabel}
                estimatedLabel={copy.revenueEstimated}
                isDemo={quotes.length === 0}
                points={revenue}
                title={copy.revenueTitle}
              />
            ) : null}
            {isPanelVisible(preferences, "copilot") ? (
              <DashboardCopilot
                badge={dictionary.dashboard.copilot.badge}
                disclaimer={copy.copilotDisclaimer}
                inputPlaceholder={dictionary.dashboard.copilot.input}
                locale={locale}
                prompts={copy.copilotPrompts as Record<CopilotPromptKey, string>}
                sendLabel={copy.copilotSend}
                title={dictionary.dashboard.copilot.title}
              />
            ) : null}
          </section>

          <section className={`${panelClass} mt-4 min-w-0 p-5`}>
            <h2 className="text-lg font-bold">{copy.recentActivity}</h2>
            <div className="mt-4 space-y-3">
              {activities.length === 0 ? (
                <p className="text-sm text-[var(--forge-text-muted)]">{copy.noActivity}</p>
              ) : (
                activities.slice(0, 5).map((event) => (
                  <div
                    className="rounded-lg border border-[var(--forge-border-subtle)] bg-[var(--forge-surface-muted)] p-4"
                    key={event.id}
                  >
                    <div className="text-sm font-semibold">{event.title}</div>
                    <div className="mt-1 text-xs text-[var(--forge-text-muted)]">
                      {event.action} · {formatDateTime(event.occurredAt, locale)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </AppFrame>
  );
}

async function loadQuotes(
  repos: Extract<ReturnType<typeof usePersistence>["state"], { status: "ready" }>["repos"],
  tenantId: string
) {
  return repos.quotes.list(tenantId);
}

async function loadOrders(
  repos: Extract<ReturnType<typeof usePersistence>["state"], { status: "ready" }>["repos"],
  tenantId: string
) {
  return repos.productionOrders.list(tenantId);
}

async function loadInventory(
  repos: Extract<ReturnType<typeof usePersistence>["state"], { status: "ready" }>["repos"],
  tenantId: string
) {
  return repos.inventory.list(tenantId);
}
