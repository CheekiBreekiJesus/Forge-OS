import Link from "next/link";
import { notFound } from "next/navigation";
import { AppFrame } from "@/components/app-frame";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import {
  getLocalizedModuleHref,
  isPreviewModuleKey,
  type ModuleKey
} from "@/modules/config";
import { getPreviewModuleCopy } from "@/i18n/preview-module-copy";
import {
  previewModulePrimaryHref,
  previewModuleSecondaryHref
} from "@/features/modules/preview-routes";
import { panelClass } from "@/theme/ui-classes";

type ModulePageShellProps = {
  dictionary: Dictionary;
  locale: Locale;
  moduleKey: Exclude<ModuleKey, "dashboard">;
};

export function ModulePageShell({ dictionary, locale, moduleKey }: ModulePageShellProps) {
  const previewCopy = isPreviewModuleKey(moduleKey) ? getPreviewModuleCopy(locale)[moduleKey] : null;
  const moduleCopy = previewCopy ?? dictionary.modulePage.modules[moduleKey];

  if (!moduleCopy) {
    notFound();
  }

  const primaryHref = isPreviewModuleKey(moduleKey)
    ? resolveHref(locale, previewModulePrimaryHref[moduleKey])
    : getLocalizedModuleHref(locale, "dashboard");
  const secondaryHref = isPreviewModuleKey(moduleKey)
    ? resolveHref(locale, previewModuleSecondaryHref[moduleKey])
    : getLocalizedModuleHref(locale, "settings");

  return (
    <AppFrame activeModule={moduleKey} dictionary={dictionary} locale={locale}>
      <section className="mb-5">
        <Link
          className="text-sm font-semibold text-[var(--forge-accent-blue)] hover:opacity-80"
          href={getLocalizedModuleHref(locale, "dashboard")}
        >
          {dictionary.modulePage.backToDashboard}
        </Link>
        <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-[var(--forge-accent-orange)]">
          {moduleCopy.eyebrow}
        </p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{moduleCopy.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--forge-text-muted)]">
              {moduleCopy.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-lg bg-[var(--forge-accent-orange)] px-4 py-2 text-sm font-bold text-white"
              href={primaryHref}
            >
              {dictionary.modulePage.primaryAction}
            </Link>
            <Link
              className="rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-4 py-2 text-sm font-bold text-[var(--forge-text-secondary)]"
              href={secondaryHref}
            >
              {dictionary.modulePage.secondaryAction}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {moduleCopy.stats.map((stat) => (
          <article className={`${panelClass} p-5`} key={stat.label}>
            <p className="text-sm font-medium text-[var(--forge-text-muted)]">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--forge-text-muted)]">{stat.detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.4fr]">
        <article className={`${panelClass} p-5`}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold">{dictionary.modulePage.roadmapTitle}</h2>
            <span className="rounded-md border border-[var(--forge-warning)]/20 bg-[var(--forge-warning-soft)] px-2 py-1 text-xs font-bold text-[var(--forge-warning)]">
              {dictionary.dashboard.status.planned}
            </span>
          </div>
          <ol className="mt-5 space-y-3">
            {moduleCopy.roadmap.map((step, index) => (
              <li
                className="flex gap-3 rounded-lg bg-[var(--forge-surface-muted)] p-3 text-sm text-[var(--forge-text-secondary)]"
                key={step}
              >
                <span className="grid size-6 shrink-0 place-items-center rounded bg-[var(--forge-hover-bg)] text-xs font-bold text-[var(--forge-accent-orange)]">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </article>

        <article className={`${panelClass} p-5`}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold">{dictionary.modulePage.readinessTitle}</h2>
            <span className="text-sm font-semibold text-[var(--forge-text-muted)]">
              {dictionary.modulePage.prototypeNotice}
            </span>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-[var(--forge-text-muted)]">
                <tr>
                  <th className="pb-3 font-semibold">{dictionary.modulePage.tableHeaders.area}</th>
                  <th className="pb-3 font-semibold">{dictionary.modulePage.tableHeaders.priority}</th>
                  <th className="pb-3 font-semibold">{dictionary.modulePage.tableHeaders.status}</th>
                  <th className="pb-3 text-right font-semibold">{dictionary.modulePage.tableHeaders.owner}</th>
                </tr>
              </thead>
              <tbody>
                {moduleCopy.tableRows.map((row) => (
                  <tr className="border-t border-[var(--forge-border-subtle)]" key={`${row.area}-${row.owner}`}>
                    <td className="py-3 font-semibold">{row.area}</td>
                    <td className="py-3">{row.priority}</td>
                    <td className="py-3">
                      <span className="rounded-md bg-[var(--forge-hover-bg)] px-2 py-1 text-xs font-semibold">
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">{row.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className={`${panelClass} mt-4 p-6 text-center`}>
        <h2 className="text-xl font-bold">{dictionary.modulePage.emptyStateTitle}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--forge-text-muted)]">
          {dictionary.modulePage.emptyStateDescription}
        </p>
      </section>
    </AppFrame>
  );
}

function resolveHref(locale: Locale, slug: string) {
  if (slug === "leadops") return `/${locale}/leadops`;
  return `/${locale}/${slug}`;
}
