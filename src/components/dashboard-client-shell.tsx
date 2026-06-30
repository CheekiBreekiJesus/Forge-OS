"use client";

import Link from "next/link";
import { AppFrame, panelClass } from "@/components/app-frame";
import { OnboardingChecklist } from "@/components/onboarding-checklist";
import { useActivities, useDashboardMetrics } from "@/persistence/hooks";
import { usePersistenceLoading } from "@/persistence/provider";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { getLocalizedModuleHref } from "@/modules/config";

type DashboardClientShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

export function DashboardClientShell({ dictionary, locale }: DashboardClientShellProps) {
  const loading = usePersistenceLoading();
  const { metrics } = useDashboardMetrics();
  const { activities } = useActivities();

  const cards = [
    { key: "leads", value: metrics.totalLeads, label: dictionary.dashboardModule.metrics.leads },
    {
      key: "qualified",
      value: metrics.qualifiedLeads,
      label: dictionary.dashboardModule.metrics.qualified
    },
    {
      key: "customers",
      value: metrics.customers,
      label: dictionary.dashboardModule.metrics.customers
    },
    {
      key: "opportunities",
      value: metrics.opportunities,
      label: dictionary.dashboardModule.metrics.opportunities
    },
    {
      key: "quotations",
      value: metrics.openQuotations,
      label: dictionary.dashboardModule.metrics.quotations
    },
    {
      key: "production",
      value: metrics.productionOrders,
      label: dictionary.dashboardModule.metrics.production
    },
    {
      key: "outreachReady",
      value: metrics.outreachReady,
      label: dictionary.dashboardModule.metrics.outreachReady
    },
    {
      key: "outreachSent",
      value: metrics.outreachSent,
      label: dictionary.dashboardModule.metrics.outreachSent
    }
  ];

  return (
    <AppFrame activeModule="dashboard" dictionary={dictionary} locale={locale}>
      <section className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-300">
          {dictionary.dashboard.eyebrow}
        </p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{dictionary.dashboard.greeting}</h1>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-400">{dictionary.dashboardModule.subtitle}</p>
          <Link
            className="w-fit rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white"
            href={`/${locale}/demo`}
          >
            {dictionary.demoWorkflow.startDemo}
          </Link>
        </div>
      </section>

      <OnboardingChecklist dictionary={dictionary} locale={locale} />

      {loading ? (
        <div className={`${panelClass} p-8 text-center text-slate-400`}>
          {dictionary.demoWorkflow.persistence.loading}
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <article className={`${panelClass} p-4`} key={card.key}>
                <p className="text-sm text-slate-400">{card.label}</p>
                <p className="mt-2 text-2xl font-bold">{card.value}</p>
              </article>
            ))}
          </section>

          <section className={`${panelClass} mt-4 p-5`}>
            <h2 className="text-lg font-bold">{dictionary.dashboardModule.recentActivity}</h2>
            <div className="mt-4 space-y-3">
              {activities.length === 0 ? (
                <p className="text-sm text-slate-400">{dictionary.dashboardModule.noActivity}</p>
              ) : (
                activities.map((event) => (
                  <div
                    className="rounded-lg border border-slate-800 bg-slate-950/40 p-4"
                    key={event.id}
                  >
                    <div className="text-sm font-semibold">{event.title}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {event.action} · {new Date(event.occurredAt).toLocaleString(locale)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className={`${panelClass} mt-4 p-5`} id="modules">
            <h2 className="text-lg font-bold">{dictionary.dashboard.modulesTitle}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              {dictionary.dashboard.modules.map((module) => (
                <Link
                  className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 transition hover:border-orange-400/60"
                  href={getLocalizedModuleHref(locale, module.key)}
                  key={module.key}
                >
                  <div className="text-sm font-bold">{module.title}</div>
                  <p className="mt-2 text-xs text-slate-400">{module.description}</p>
                </Link>
              ))}
              <Link
                className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 transition hover:border-orange-400/60"
                href={`/${locale}/leadops`}
              >
                <div className="text-sm font-bold">{dictionary.navigation.leadops}</div>
                <p className="mt-2 text-xs text-slate-400">
                  {dictionary.dashboardModule.leadopsHint}
                </p>
              </Link>
            </div>
          </section>
        </>
      )}
    </AppFrame>
  );
}
