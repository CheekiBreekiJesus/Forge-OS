import Link from "next/link";
import type { ReactNode } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import { supportedLocales, type Locale } from "@/i18n/config";
import {
  getLocalizedModuleHref,
  moduleKeys,
  moduleRoutes,
  type ModuleKey
} from "@/modules/config";

type AppFrameProps = {
  activeModule: ModuleKey;
  children: ReactNode;
  dictionary: Dictionary;
  locale: Locale;
  supplementalRoute?: string;
};

export const panelClass =
  "rounded-lg border border-slate-700/80 bg-slate-900/70 shadow-[0_1px_0_rgba(255,255,255,0.04)]";

export function AppFrame({
  activeModule,
  children,
  dictionary,
  locale,
  supplementalRoute
}: AppFrameProps) {
  const activeRoute = supplementalRoute ?? moduleRoutes[activeModule];
  const leadOpsHref = `/${locale}/leadops`;
  const isLeadOpsActive = activeRoute.startsWith("leadops");

  return (
    <main className="min-h-screen bg-[#06111f] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-[#07101d]/95 lg:flex lg:flex-col">
          <Link
            className="flex h-16 items-center gap-3 border-b border-slate-800 px-5"
            href={`/${locale}`}
          >
            <div className="grid size-9 place-items-center rounded-lg bg-orange-500/15 text-lg font-black text-orange-400">
              F
            </div>
            <div className="text-2xl font-bold tracking-tight">{dictionary.app.name}</div>
          </Link>

          <div className="m-4 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-3">
            <div className="text-sm font-semibold">{dictionary.app.tenantLabel}</div>
            <div className="mt-1 text-xs text-slate-400">{dictionary.dashboard.userRole}</div>
          </div>

          <nav className="flex-1 space-y-1 px-3">
            {moduleKeys.map((key, index) => (
              <Link
                className={
                  key === activeModule && !isLeadOpsActive
                    ? "flex items-center gap-3 rounded-lg border-l-2 border-orange-400 bg-orange-500/10 px-3 py-3 text-sm font-semibold text-orange-300"
                    : "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                }
                href={getLocalizedModuleHref(locale, key)}
                key={key}
              >
                <span className="grid size-6 place-items-center rounded-md border border-slate-700 text-xs">
                  {index + 1}
                </span>
                {dictionary.navigation[key]}
              </Link>
            ))}
            <Link
              className={
                isLeadOpsActive
                  ? "flex items-center gap-3 rounded-lg border-l-2 border-orange-400 bg-orange-500/10 px-3 py-3 text-sm font-semibold text-orange-300"
                  : "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
              }
              href={leadOpsHref}
            >
              <span className="grid size-6 place-items-center rounded-md border border-slate-700 text-xs">
                L
              </span>
              {dictionary.navigation.leadops}
            </Link>
          </nav>

          <div className="m-4 rounded-lg border border-slate-700 bg-slate-900 px-4 py-4">
            <div className="text-sm font-bold">{dictionary.dashboard.footer.version}</div>
            <div className="mt-2 h-1.5 rounded-full bg-slate-800">
              <div className="h-1.5 w-3/4 rounded-full bg-orange-400" />
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-slate-800 bg-[#07101d]/90 backdrop-blur">
            <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
              <button
                aria-label="Menu"
                className="grid size-10 place-items-center rounded-lg border border-slate-700 text-slate-200 lg:hidden"
                type="button"
              >
                =
              </button>

              <div className="hidden min-w-0 flex-1 sm:block">
                <div className="flex max-w-md items-center rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-400">
                  <span className="mr-2">/</span>
                  <span className="flex-1">{dictionary.dashboard.searchPlaceholder}</span>
                  <span className="text-xs">{dictionary.dashboard.searchShortcut}</span>
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <div className="hidden items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 sm:flex">
                  {dictionary.dashboard.dateRange}
                </div>
                <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-1">
                  {supportedLocales.map((supportedLocale) => (
                    <Link
                      className={
                        supportedLocale === locale
                          ? "rounded-md bg-slate-700 px-3 py-1.5 text-sm font-semibold text-white"
                          : "rounded-md px-3 py-1.5 text-sm font-semibold text-slate-400 hover:text-white"
                      }
                      href={`/${supportedLocale}${activeRoute ? `/${activeRoute}` : ""}`}
                      key={supportedLocale}
                    >
                      {supportedLocale}
                    </Link>
                  ))}
                </div>
                <button className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-200">
                  {dictionary.dashboard.customize}
                </button>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 sm:px-6">
            {children}

            <footer className="mt-6 grid gap-3 border-t border-slate-800 pt-5 text-sm text-slate-400 md:grid-cols-5">
              <div>
                <div className="font-semibold text-slate-200">
                  {dictionary.dashboard.footer.version}
                </div>
                <div className="mt-1 text-xs">{dictionary.dashboard.footer.copyright}</div>
              </div>
              <FooterStatus
                label={dictionary.dashboard.footer.system}
                value={dictionary.dashboard.status.online}
              />
              <FooterStatus
                label={dictionary.dashboard.footer.database}
                value={dictionary.dashboard.status.operational}
              />
              <FooterStatus label={dictionary.dashboard.footer.backup} value="Demo" />
              <FooterStatus
                label={dictionary.dashboard.footer.environment}
                value={dictionary.dashboard.status.production}
              />
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}

function FooterStatus({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-semibold text-slate-200">{label}</div>
      <div className="mt-1 inline-flex items-center gap-2 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-300">
        <span className="size-1.5 rounded-full bg-emerald-300" />
        {value}
      </div>
    </div>
  );
}
