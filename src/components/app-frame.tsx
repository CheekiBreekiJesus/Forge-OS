import Link from "next/link";
import type { ReactNode } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { moduleRoutes, type ModuleKey } from "@/modules/config";
import { AppFrameClient } from "@/components/app-frame-client";
import { AppFrameNav } from "@/components/app-frame-nav";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";

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

          <AppFrameNav
            activeModule={activeModule}
            className="flex-1 px-3"
            dictionary={dictionary}
            isLeadOpsActive={isLeadOpsActive}
            leadOpsHref={leadOpsHref}
            locale={locale}
          />

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
              <MobileNavDrawer
                activeModule={activeModule}
                dictionary={dictionary}
                isLeadOpsActive={isLeadOpsActive}
                leadOpsHref={leadOpsHref}
                locale={locale}
              />

              <AppFrameClient
                activeModule={activeModule}
                dictionary={dictionary}
                locale={locale}
                supplementalRoute={supplementalRoute}
              />
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
