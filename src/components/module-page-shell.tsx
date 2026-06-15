import Link from "next/link";
import { AppFrame, panelClass } from "@/components/app-frame";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { getLocalizedModuleHref, type ModuleKey } from "@/modules/config";

type ModulePageShellProps = {
  dictionary: Dictionary;
  locale: Locale;
  moduleKey: Exclude<ModuleKey, "dashboard">;
};

export function ModulePageShell({
  dictionary,
  locale,
  moduleKey
}: ModulePageShellProps) {
  const moduleCopy = dictionary.modulePage.modules[moduleKey];

  return (
    <AppFrame activeModule={moduleKey} dictionary={dictionary} locale={locale}>
      <section className="mb-5">
        <Link
          className="text-sm font-semibold text-blue-300 hover:text-blue-200"
          href={getLocalizedModuleHref(locale, "dashboard")}
        >
          {dictionary.modulePage.backToDashboard}
        </Link>
        <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-orange-300">
          {moduleCopy.eyebrow}
        </p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{moduleCopy.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              {moduleCopy.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white" type="button">
              {dictionary.modulePage.primaryAction}
            </button>
            <button className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-bold text-slate-200" type="button">
              {dictionary.modulePage.secondaryAction}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {moduleCopy.stats.map((stat) => (
          <article className={`${panelClass} p-5`} key={stat.label}>
            <p className="text-sm font-medium text-slate-400">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold">{stat.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">{stat.detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.4fr]">
        <article className={`${panelClass} p-5`}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold">{dictionary.modulePage.roadmapTitle}</h2>
            <span className="rounded-md border border-amber-400/20 bg-amber-500/10 px-2 py-1 text-xs font-bold text-amber-300">
              {dictionary.dashboard.status.planned}
            </span>
          </div>
          <ol className="mt-5 space-y-3">
            {moduleCopy.roadmap.map((step, index) => (
              <li className="flex gap-3 rounded-lg bg-slate-950/40 p-3 text-sm text-slate-300" key={step}>
                <span className="grid size-6 shrink-0 place-items-center rounded bg-slate-800 text-xs font-bold text-orange-300">
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
            <span className="text-sm font-semibold text-slate-400">
              {dictionary.modulePage.prototypeNotice}
            </span>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="pb-3 font-semibold">{dictionary.modulePage.tableHeaders.area}</th>
                  <th className="pb-3 font-semibold">{dictionary.modulePage.tableHeaders.priority}</th>
                  <th className="pb-3 font-semibold">{dictionary.modulePage.tableHeaders.status}</th>
                  <th className="pb-3 text-right font-semibold">{dictionary.modulePage.tableHeaders.owner}</th>
                </tr>
              </thead>
              <tbody>
                {moduleCopy.tableRows.map((row) => (
                  <tr className="border-t border-slate-800" key={`${row.area}-${row.owner}`}>
                    <td className="py-3 font-semibold text-slate-100">{row.area}</td>
                    <td className="py-3 text-slate-300">{row.priority}</td>
                    <td className="py-3">
                      <span className="rounded-md bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300">
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-300">{row.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className={`${panelClass} mt-4 p-6 text-center`}>
        <h2 className="text-xl font-bold">{dictionary.modulePage.emptyStateTitle}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          {dictionary.modulePage.emptyStateDescription}
        </p>
      </section>
    </AppFrame>
  );
}
