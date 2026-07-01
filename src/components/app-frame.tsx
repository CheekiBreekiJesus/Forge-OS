import Link from "next/link";
import type { ReactNode } from "react";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { moduleRoutes, type ModuleKey } from "@/modules/config";
import { AppFrameClient } from "@/components/app-frame-client";
import { AppFrameNav } from "@/components/app-frame-nav";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
export { panelClass, panelMutedClass, inputClass } from "@/theme/ui-classes";

type AppFrameProps = {
  activeModule: ModuleKey;
  children: ReactNode;
  dictionary: Dictionary;
  locale: Locale;
  supplementalRoute?: string;
};

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
    <main className="min-h-screen bg-[var(--forge-page-bg)] text-[var(--forge-text-primary)]">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-[var(--forge-border)] bg-[var(--forge-sidebar-bg)] lg:flex lg:flex-col">
          <Link
            className="flex h-16 items-center gap-3 border-b border-[var(--forge-border)] px-5"
            href={`/${locale}`}
          >
            <div className="grid size-9 place-items-center rounded-lg bg-[var(--forge-accent-orange-soft)] text-lg font-black text-[var(--forge-accent-orange)]">
              F
            </div>
            <div className="text-xl font-bold tracking-tight">{dictionary.app.name}</div>
          </Link>

          <div className="m-4 rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface-muted)] px-3 py-3">
            <div className="text-sm font-semibold text-[var(--forge-text-primary)]">
              {dictionary.app.tenantLabel}
            </div>
            <div className="mt-1 text-xs text-[var(--forge-text-muted)]">
              {dictionary.dashboard.userRole}
            </div>
          </div>

          <AppFrameNav
            activeModule={activeModule}
            className="forge-scroll-sidebar flex-1 overflow-y-auto px-3 pb-3"
            dictionary={dictionary}
            isLeadOpsActive={isLeadOpsActive}
            leadOpsHref={leadOpsHref}
            locale={locale}
          />

          <div className="m-4 space-y-3">
            <div className="rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface-muted)] px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-wide text-[var(--forge-accent-orange)]">
                {dictionary.dashboard.sidebar.newBadge}
              </div>
              <p className="mt-1 text-sm text-[var(--forge-text-secondary)]">
                {dictionary.dashboard.sidebar.newTitle}
              </p>
              <Link
                className="mt-2 inline-block text-xs font-semibold text-[var(--forge-accent-blue)]"
                href={`/${locale}/demo`}
              >
                {dictionary.dashboard.sidebar.newAction}
              </Link>
            </div>
            <div className="rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-4 py-4">
              <div className="text-sm font-bold text-[var(--forge-text-primary)]">
                {dictionary.dashboard.sidebar.planTitle}
              </div>
              <div className="mt-1 text-xs text-[var(--forge-text-muted)]">
                {dictionary.dashboard.sidebar.planSubtitle}
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-[var(--forge-hover-bg)]">
                <div
                  className="h-1.5 rounded-full bg-[var(--forge-accent-orange)]"
                  style={{ width: "76%" }}
                />
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 border-b border-[var(--forge-border)] bg-[var(--forge-topbar-bg)] backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 sm:gap-4 sm:px-6">
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

          <div className="px-4 py-6 sm:px-6">{children}</div>

          <StatusFooter dictionary={dictionary} locale={locale} />
        </section>
      </div>
    </main>
  );
}

function StatusFooter({ dictionary, locale }: { dictionary: Dictionary; locale: Locale }) {
  return (
    <footer className="mx-4 mb-6 grid gap-3 border-t border-[var(--forge-border)] pt-5 text-sm text-[var(--forge-text-muted)] sm:mx-6 md:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))_auto]">
      <div>
        <div className="font-semibold text-[var(--forge-text-primary)]">
          {dictionary.dashboard.footer.version}
        </div>
        <div className="mt-1 text-xs">{dictionary.dashboard.footer.copyright}</div>
      </div>
      <FooterStatus label={dictionary.dashboard.footer.system} value={dictionary.dashboard.status.online} />
      <FooterStatus
        label={dictionary.dashboard.footer.database}
        value={dictionary.dashboard.status.operational}
      />
      <FooterStatus label={dictionary.dashboard.footer.backup} value={dictionary.dashboard.footer.backupDemo} />
      <FooterStatus
        label={dictionary.dashboard.footer.environment}
        value={dictionary.dashboard.status.production}
      />
      <Link
        className="inline-flex h-fit items-center justify-center gap-2 self-start rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-3 py-2 text-xs font-semibold text-[var(--forge-text-secondary)] hover:bg-[var(--forge-hover-bg)]"
        href={`/${locale}/settings`}
      >
        ? {dictionary.dashboard.footer.support}
      </Link>
    </footer>
  );
}

function FooterStatus({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-semibold text-[var(--forge-text-primary)]">{label}</div>
      <div className="mt-1 inline-flex items-center gap-2 rounded-md bg-[var(--forge-success-soft)] px-2 py-1 text-xs font-semibold text-[var(--forge-success)]">
        <span className="size-1.5 rounded-full bg-[var(--forge-success)]" />
        {value}
      </div>
    </div>
  );
}
