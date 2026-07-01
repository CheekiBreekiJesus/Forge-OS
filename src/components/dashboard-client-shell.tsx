"use client";

import Link from "next/link";
import { AppFrame, panelClass } from "@/components/app-frame";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { getLocalizedModuleHref } from "@/modules/config";
import {
  useActivities,
  useDashboardMetrics,
  useInventory,
  useMarketingStudioData,
  useProductionOrders,
  useQuotes
} from "@/persistence/hooks";
import { usePersistenceLoading } from "@/persistence/provider";

type DashboardClientShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

type Tone = "green" | "blue" | "amber" | "red";

const toneText: Record<Tone, string> = {
  amber: "text-amber-500",
  blue: "text-blue-500",
  green: "text-emerald-500",
  red: "text-red-500"
};

const toneBg: Record<Tone, string> = {
  amber: "bg-amber-500",
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  red: "bg-red-500"
};

export function DashboardClientShell({ dictionary, locale }: DashboardClientShellProps) {
  const loading = usePersistenceLoading();
  const { metrics } = useDashboardMetrics();
  const { activities } = useActivities();
  const { items: inventory } = useInventory();
  const { orders } = useProductionOrders();
  const { quotes } = useQuotes();
  const studio = useMarketingStudioData();

  const openQuotes = quotes.filter((quote) => quote.status !== "approved").length || metrics.openQuotations;
  const lateOrders = orders.filter((order) => order.status === "blocked").length;
  const maintenanceAlerts = Math.max(1, activities.filter((event) => event.entityType === "machine").length);
  const weeklyRevenue = quotes.reduce((sum, quote) => sum + quote.total, 0);
  const lowInventory = inventory.filter((item) => item.currentQuantity <= item.reorderLevel);
  const marketingPending = studio.campaigns.filter((campaign) => campaign.approvalStatus === "pending_review").length;

  const kpis = [
    { label: dictionary.dashboard.metrics[0]?.label ?? "OEE", value: "78.5%", trend: "+ 6.4%", tone: "green" as Tone },
    {
      label: dictionary.dashboard.metrics[1]?.label ?? "Revenue",
      value: weeklyRevenue ? currency(weeklyRevenue, locale) : dictionary.dashboard.metrics[1]?.value ?? "0",
      trend: "+ 12.7%",
      tone: "green" as Tone
    },
    { label: dictionary.dashboard.metrics[2]?.label ?? "Quotes", value: String(openQuotes), trend: "+ 2", tone: "blue" as Tone },
    { label: dictionary.dashboard.metrics[3]?.label ?? "Late orders", value: String(lateOrders), trend: lateOrders ? "- 1" : "0", tone: lateOrders ? "red" as Tone : "green" as Tone },
    { label: dictionary.dashboard.metrics[4]?.label ?? "Maintenance", value: String(maintenanceAlerts), trend: "- 1", tone: "amber" as Tone }
  ];

  return (
    <AppFrame activeModule="dashboard" dictionary={dictionary} locale={locale}>
      <section className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-400">
            {dictionary.dashboard.eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{dictionary.dashboard.greeting}</h1>
          <p className="mt-2 text-sm text-[var(--forge-text-muted)]">{dictionary.dashboard.title}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-4 py-2 text-sm font-bold" href={`/${locale}/leadops`}>
            {dictionary.navigation.leadops}
          </Link>
          <Link className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white" href={`/${locale}/demo`}>
            {dictionary.demoWorkflow.startDemo}
          </Link>
        </div>
      </section>

      <OnboardingChecklist dictionary={dictionary} locale={locale} />

      {loading ? (
        <div className={`${panelClass} p-8 text-center text-[var(--forge-text-muted)]`}>
          {dictionary.demoWorkflow.persistence.loading}
        </div>
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-5">
            {kpis.map((card, index) => (
              <DashboardKpiCard
                detail={dictionary.dashboard.metrics[index]?.detail ?? dictionary.dashboard.status.prototype}
                key={card.label}
                label={card.label}
                tone={card.tone}
                trend={card.trend}
                value={card.value}
              />
            ))}
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_1fr_1fr]">
            <OeePanel dictionary={dictionary} />
            <InventorySummary dictionary={dictionary} inventory={inventory} locale={locale} />
            <AlertsPanel
              activities={activities}
              dictionary={dictionary}
              locale={locale}
              lowInventory={lowInventory.length}
              marketingPending={marketingPending}
              ordersDelayed={lateOrders}
            />
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1.05fr_1fr_1fr]">
            <ProductionOrdersPanel dictionary={dictionary} locale={locale} orders={orders} />
            <RevenuePanel dictionary={dictionary} locale={locale} revenue={weeklyRevenue} />
            <CopilotPanel dictionary={dictionary} locale={locale} lowInventory={lowInventory.length} marketingPending={marketingPending} />
          </section>

          <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
            <OutreachPanel dictionary={dictionary} locale={locale} metrics={metrics} />
            <MarketingPanel dictionary={dictionary} locale={locale} studio={studio} />
          </section>

          <section className={`${panelClass} mt-4 p-5`} id="modules">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold">{dictionary.dashboard.modulesTitle}</h2>
              <span className="rounded-md bg-[var(--forge-hover)] px-2 py-1 text-xs font-semibold text-[var(--forge-text-secondary)]">
                {dictionary.dashboard.status.prototype}
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              {Object.entries(dictionary.navigation)
                .filter(([key]) => key !== "leadops")
                .map(([key, label]) => (
                  <Link
                    className="rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface-elevated)] p-4 transition hover:border-orange-400 hover:bg-[var(--forge-hover)]"
                    href={key === "dashboard" ? `/${locale}` : getLocalizedModuleHref(locale, key as Exclude<keyof typeof dictionary.navigation, "leadops">)}
                    key={key}
                  >
                    <div className="text-sm font-bold">{label}</div>
                    <p className="mt-2 min-h-10 text-xs leading-5 text-[var(--forge-text-muted)]">
                      {dictionary.modulePage.prototypeNotice}
                    </p>
                  </Link>
                ))}
            </div>
          </section>
        </>
      )}
    </AppFrame>
  );
}

function DashboardKpiCard({
  detail,
  label,
  tone,
  trend,
  value
}: {
  detail: string;
  label: string;
  tone: Tone;
  trend: string;
  value: string;
}) {
  return (
    <article className={`${panelClass} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--forge-text-secondary)]">{label}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
        <span className={`grid size-9 place-items-center rounded-lg ${toneBg[tone]}/15 ${toneText[tone]}`}>
          ...
        </span>
      </div>
      <p className={`mt-4 text-sm font-semibold ${toneText[tone]}`}>
        {trend} <span className="font-normal text-[var(--forge-text-muted)]">{detail}</span>
      </p>
    </article>
  );
}

function OeePanel({ dictionary }: { dictionary: Dictionary }) {
  const values = [88, 87, 91, 88, 86, 63, 65];
  return (
    <article className={`${panelClass} p-5`}>
      <PanelHeading title={dictionary.dashboard.production.title} />
      <div className="mt-5 grid gap-5 sm:grid-cols-[10rem_1fr]">
        <div className="grid aspect-square place-items-center rounded-full border-[18px] border-emerald-400 bg-[var(--forge-surface-elevated)] text-center">
          <div>
            <div className="text-3xl font-bold">{dictionary.dashboard.production.score}</div>
            <div className="text-xs text-[var(--forge-text-muted)]">OEE</div>
          </div>
        </div>
        <div className="space-y-4 text-sm">
          <MetricLine label={dictionary.dashboard.production.availability} tone="blue" value="90.3%" />
          <MetricLine label={dictionary.dashboard.production.performance} tone="amber" value="76.8%" />
          <MetricLine label={dictionary.dashboard.production.quality} tone="green" value="95.4%" />
        </div>
      </div>
      <div className="mt-6 flex h-28 items-end gap-4 border-t border-[var(--forge-border-subtle)] pt-4">
        {values.map((value, index) => (
          <div className="flex flex-1 flex-col items-center gap-2" key={`${value}-${index}`}>
            <div className="w-full rounded-t bg-blue-500" style={{ height: `${value}%` }} />
            <span className="text-xs text-[var(--forge-text-muted)]">{dictionary.dashboard.production.days[index]}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function InventorySummary({
  dictionary,
  inventory,
  locale
}: {
  dictionary: Dictionary;
  inventory: ReturnType<typeof useInventory>["items"];
  locale: Locale;
}) {
  const rows = inventory.length
    ? inventory.slice(0, 5).map((item) => {
        const available = item.currentQuantity;
        const ratio = Math.min(100, Math.round((available / Math.max(item.reorderLevel, 1)) * 100));
        return {
          category: item.category,
          minimum: `${dictionary.dashboard.demoSections.minimumPrefix}: ${item.reorderLevel.toLocaleString(locale)} ${item.unit}`,
          name: item.name,
          quantity: `${available.toLocaleString(locale)} ${item.unit}`,
          ratio,
          tone: available <= item.reorderLevel ? "red" as Tone : ratio < 150 ? "amber" as Tone : "green" as Tone
        };
      })
    : dictionary.dashboard.inventory.items.map((item) => ({ ...item, ratio: 80 }));

  return (
    <article className={`${panelClass} p-5`}>
      <PanelHeading href={getLocalizedModuleHref(locale, "inventory")} title={dictionary.dashboard.inventory.title} />
      <div className="mt-4 space-y-4">
        {rows.map((item) => (
          <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-[var(--forge-border-subtle)] pb-3 last:border-0" key={item.name}>
            <div>
              <div className="font-semibold">{item.name}</div>
              <div className="text-xs text-[var(--forge-text-muted)]">{item.category}</div>
            </div>
            <div className="min-w-40 text-right">
              <div className="text-sm font-semibold">{item.quantity}</div>
              <div className="text-xs text-[var(--forge-text-muted)]">{item.minimum}</div>
              <div className="mt-2 h-1.5 rounded-full bg-[var(--forge-hover)]">
                <div className={`h-1.5 rounded-full ${toneBg[item.tone]}`} style={{ width: `${Math.min(item.ratio, 100)}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function AlertsPanel({
  activities,
  dictionary,
  locale,
  lowInventory,
  marketingPending,
  ordersDelayed
}: {
  activities: ReturnType<typeof useActivities>["activities"];
  dictionary: Dictionary;
  locale: Locale;
  lowInventory: number;
  marketingPending: number;
  ordersDelayed: number;
}) {
  const alerts = [
    { href: getLocalizedModuleHref(locale, "maintenance"), priority: "Alta", title: dictionary.dashboard.metrics[4]?.label ?? "Maintenance", tone: "amber" as Tone },
    { href: getLocalizedModuleHref(locale, "production"), priority: String(ordersDelayed), title: dictionary.dashboard.metrics[3]?.label ?? "Late orders", tone: ordersDelayed ? "red" as Tone : "green" as Tone },
    { href: getLocalizedModuleHref(locale, "inventory"), priority: String(lowInventory), title: dictionary.dashboard.demoSections.inventoryAlerts, tone: lowInventory ? "red" as Tone : "green" as Tone },
    { href: `/${locale}/marketing/campaigns`, priority: String(marketingPending), title: dictionary.marketingStudio.kpis.awaitingApproval, tone: marketingPending ? "amber" as Tone : "green" as Tone }
  ];

  return (
    <article className={`${panelClass} p-5`}>
      <PanelHeading title={dictionary.dashboard.activity.title} />
      <div className="mt-4 space-y-3">
        {alerts.map((item) => (
          <Link className="grid grid-cols-[1fr_auto] gap-3 border-b border-[var(--forge-border-subtle)] pb-3 last:border-0" href={item.href} key={item.title}>
            <div>
              <div className="text-sm font-semibold">{item.title}</div>
              <div className="text-xs text-[var(--forge-text-muted)]">{dictionary.dashboard.status.prototype}</div>
            </div>
            <span className={`h-fit rounded-md px-2 py-1 text-xs font-bold text-white ${toneBg[item.tone]}`}>{item.priority}</span>
          </Link>
        ))}
        {activities.slice(0, 1).map((event) => (
          <div className="text-xs text-[var(--forge-text-muted)]" key={event.id}>{event.title}</div>
        ))}
      </div>
    </article>
  );
}

function ProductionOrdersPanel({
  dictionary,
  locale,
  orders
}: {
  dictionary: Dictionary;
  locale: Locale;
  orders: ReturnType<typeof useProductionOrders>["orders"];
}) {
  const rows = orders.slice(0, 5);
  return (
    <article className={`${panelClass} p-5`}>
      <PanelHeading href={getLocalizedModuleHref(locale, "production")} title={dictionary.dashboard.orders.title} />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <thead className="text-xs text-[var(--forge-text-muted)]">
            <tr>
              <th className="pb-3 font-medium">{dictionary.dashboard.orders.headers.order}</th>
              <th className="pb-3 font-medium">{dictionary.dashboard.orders.headers.product}</th>
              <th className="pb-3 font-medium">{dictionary.dashboard.orders.headers.quantity}</th>
              <th className="pb-3 font-medium">{dictionary.dashboard.orders.headers.progress}</th>
              <th className="pb-3 text-right font-medium">{dictionary.dashboard.orders.headers.delivery}</th>
            </tr>
          </thead>
          <tbody>
            {(rows.length ? rows : []).map((row) => (
              <tr className="border-t border-[var(--forge-border-subtle)]" key={row.id}>
                <td className="py-3 font-semibold">
                  <Link className="hover:text-orange-400" href={`/${locale}/jobs/${row.id}`}>{row.id}</Link>
                </td>
                <td className="py-3 text-[var(--forge-text-secondary)]">{row.productName}</td>
                <td className="py-3 text-[var(--forge-text-secondary)]">{row.quantity.toLocaleString(locale)}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-500">{row.progress}%</span>
                    <div className="h-1.5 w-20 rounded-full bg-[var(--forge-hover)]">
                      <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${row.progress}%` }} />
                    </div>
                  </div>
                </td>
                <td className="py-3 text-right text-[var(--forge-text-secondary)]">{row.scheduledDate ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function RevenuePanel({
  dictionary,
  locale,
  revenue
}: {
  dictionary: Dictionary;
  locale: Locale;
  revenue: number;
}) {
  const points = [18, 34, 57, 48, 52, 55, 75];
  return (
    <article className={`${panelClass} p-5`}>
      <PanelHeading title={dictionary.dashboard.metrics[1]?.label ?? "Revenue"} />
      <div className="mt-6 text-3xl font-bold">{revenue ? currency(revenue, locale) : dictionary.dashboard.metrics[1]?.value}</div>
      <p className="mt-2 text-sm font-semibold text-emerald-500">
        + 12.7% <span className="font-normal text-[var(--forge-text-muted)]">{dictionary.dashboard.metrics[1]?.detail}</span>
      </p>
      <div className="mt-8 flex h-36 items-end gap-3 border-t border-[var(--forge-border-subtle)] pt-4">
        {points.map((point, index) => (
          <div className="flex flex-1 flex-col items-center gap-2" key={`${point}-${index}`}>
            <div className="w-full rounded-t bg-blue-500/80" style={{ height: `${point}%` }} />
            <span className="text-xs text-[var(--forge-text-muted)]">{dictionary.dashboard.production.days[index]}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function CopilotPanel({
  dictionary,
  locale,
  lowInventory,
  marketingPending
}: {
  dictionary: Dictionary;
  locale: Locale;
  lowInventory: number;
  marketingPending: number;
}) {
  return (
    <article className={`${panelClass} p-5`}>
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold">{dictionary.dashboard.copilot.title}</h2>
        <span className="rounded bg-orange-500/15 px-2 py-1 text-xs font-bold text-orange-400">
          {dictionary.dashboard.copilot.badge}
        </span>
      </div>
      <div className="mt-5 rounded-lg bg-[var(--forge-hover)] px-4 py-3 text-sm">
        {dictionary.dashboard.copilot.prompt}
      </div>
      <div className="mt-4 rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface-elevated)] px-4 py-4 text-sm leading-6 text-[var(--forge-text-secondary)]">
        {dictionary.dashboard.copilot.answer}
        <div className="mt-3 flex flex-wrap gap-2">
          <Link className="text-blue-500 hover:text-orange-400" href={getLocalizedModuleHref(locale, "inventory")}>{lowInventory} stock</Link>
          <Link className="text-blue-500 hover:text-orange-400" href={`/${locale}/marketing/campaigns`}>{marketingPending} campaigns</Link>
        </div>
      </div>
      <div className="mt-4 flex gap-2 rounded-lg border border-[var(--forge-border)] bg-[var(--forge-input)] p-2">
        <input aria-label={dictionary.dashboard.copilot.input} className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none" placeholder={dictionary.dashboard.copilot.input} />
        <button className="rounded-md bg-orange-500 px-3 text-sm font-bold text-white" type="button">Go</button>
      </div>
    </article>
  );
}

function OutreachPanel({
  dictionary,
  locale,
  metrics
}: {
  dictionary: Dictionary;
  locale: Locale;
  metrics: ReturnType<typeof useDashboardMetrics>["metrics"];
}) {
  return (
    <article className={`${panelClass} p-5`}>
      <PanelHeading href={`/${locale}/leadops`} title={dictionary.navigation.leadops} />
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <MiniStat label={dictionary.dashboardModule.metrics.outreachReady} value={metrics.outreachReady} />
        <MiniStat label={dictionary.dashboardModule.metrics.outreachSent} value={metrics.outreachSent} />
        <MiniStat label={dictionary.dashboardModule.metrics.leads} value={metrics.totalLeads} />
        <MiniStat label={dictionary.dashboardModule.metrics.qualified} value={metrics.qualifiedLeads} />
      </div>
      <p className="mt-4 text-sm text-[var(--forge-text-muted)]">{dictionary.dashboardModule.leadopsHint}</p>
    </article>
  );
}

function MarketingPanel({
  dictionary,
  locale,
  studio
}: {
  dictionary: Dictionary;
  locale: Locale;
  studio: ReturnType<typeof useMarketingStudioData>;
}) {
  return (
    <article className={`${panelClass} p-5`}>
      <PanelHeading href={`/${locale}/marketing`} title={dictionary.marketingStudio.title} />
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <MiniStat label={dictionary.marketingStudio.kpis.activeCampaigns} value={studio.campaigns.length} />
        <MiniStat label={dictionary.marketingStudio.kpis.awaitingApproval} value={studio.campaigns.filter((campaign) => campaign.approvalStatus === "pending_review").length} />
        <MiniStat label={dictionary.marketingStudio.kpis.approvedAssets} value={studio.assets.filter((asset) => asset.approvalStatus === "approved").length} />
        <MiniStat label={dictionary.marketingStudio.kpis.assetsGenerated} value={studio.assets.filter((asset) => asset.generationProvider).length} />
      </div>
      <p className="mt-4 text-sm text-[var(--forge-text-muted)]">{dictionary.marketingStudio.help.providerDisabled}</p>
    </article>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface-elevated)] p-3">
      <div className="text-xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-[var(--forge-text-muted)]">{label}</div>
    </div>
  );
}

function PanelHeading({ href, title }: { href?: string; title: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-lg font-bold">{title}</h2>
      {href ? (
        <Link className="text-sm font-semibold text-blue-500 hover:text-orange-400" href={href}>
          &gt;
        </Link>
      ) : null}
    </div>
  );
}

function MetricLine({ label, tone, value }: { label: string; tone: Tone; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--forge-border-subtle)] pb-3">
      <div className="flex items-center gap-2 text-[var(--forge-text-secondary)]">
        <span className={`size-2 rounded-full ${toneBg[tone]}`} />
        {label}
      </div>
      <div className="font-bold">{value}</div>
    </div>
  );
}

function currency(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale, {
    currency: "EUR",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}
