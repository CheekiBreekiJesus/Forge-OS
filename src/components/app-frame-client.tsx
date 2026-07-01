"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { supportedLocales } from "@/i18n/config";
import { CommandPalette, useCommandPaletteShortcut } from "@/features/crud/command-palette";
import { QuickCreateMenu } from "@/features/crud/quick-create-menu";
import { NotificationCenter } from "@/components/notification-center";
import { ThemeToggle } from "@/components/theme-toggle";
import { DashboardCustomizeDialog } from "@/components/dashboard/dashboard-customize-dialog";
import {
  PREVIEW_ROLES,
  readPreviewRole,
  writePreviewRole,
  type PreviewRole
} from "@/features/crud/role-preview";
import { moduleRoutes, type ModuleKey } from "@/modules/config";

type AppFrameClientProps = {
  dictionary: Dictionary;
  locale: Locale;
  activeModule: ModuleKey;
  supplementalRoute?: string;
};

export function AppFrameClient({
  dictionary,
  locale,
  activeModule,
  supplementalRoute
}: AppFrameClientProps) {
  const activeRoute = supplementalRoute ?? moduleRoutes[activeModule];
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [previewRole, setPreviewRole] = useState<PreviewRole>(() => readPreviewRole());
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  useCommandPaletteShortcut(() => setPaletteOpen((value) => !value));

  function handleRoleChange(role: PreviewRole) {
    writePreviewRole(role);
    setPreviewRole(role);
    window.dispatchEvent(new CustomEvent("forgeos:preview-role-changed", { detail: role }));
  }

  const roleCopy = dictionary.crudModule.rolePreview;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-clip sm:gap-3">
      <button
        className="hidden min-w-0 flex-1 items-center rounded-lg border border-[var(--forge-border)] bg-[var(--forge-input-bg)] px-3 py-2 text-sm text-[var(--forge-text-muted)] hover:border-[var(--forge-accent-orange)] sm:flex"
        onClick={openPalette}
        type="button"
      >
        <span className="mr-2 text-[var(--forge-text-muted)]">⌕</span>
        <span className="flex-1 text-left">{dictionary.dashboard.searchPlaceholder}</span>
        <span className="text-xs">{dictionary.dashboard.searchShortcut}</span>
      </button>

      <div className="ml-auto flex min-w-0 shrink items-center gap-1 sm:gap-2">
        <NotificationCenter dictionary={dictionary} locale={locale} />
        <QuickCreateMenu dictionary={dictionary} locale={locale} previewRole={previewRole} />
        <ThemeToggle
          labelDark={dictionary.dashboard.theme.switchToDark}
          labelLight={dictionary.dashboard.theme.switchToLight}
        />

        <label className="hidden items-center gap-2 rounded-lg border border-[var(--forge-warning)]/30 bg-[var(--forge-warning-soft)] px-2 py-1.5 text-xs text-[var(--forge-warning)] sm:flex">
          <span className="font-semibold">{roleCopy.badge}</span>
          <select
            aria-label={roleCopy.label}
            className="bg-transparent text-xs font-semibold outline-none"
            onChange={(event) => handleRoleChange(event.target.value as PreviewRole)}
            value={previewRole}
          >
            {PREVIEW_ROLES.map((role) => (
              <option key={role} value={role}>
                {roleCopy.roles[role]}
              </option>
            ))}
          </select>
        </label>

        <div className="hidden items-center gap-2 rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-3 py-2 text-sm text-[var(--forge-text-secondary)] md:flex">
          {dictionary.dashboard.dateRangeThisWeek}
        </div>

        <div className="flex shrink-0 rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] p-0.5 sm:p-1">
          {supportedLocales.map((supportedLocale) => (
            <Link
              className={
                supportedLocale === locale
                  ? "rounded-md bg-[var(--forge-hover-bg)] px-2 py-1 text-xs font-semibold text-[var(--forge-text-primary)] sm:px-3 sm:py-1.5 sm:text-sm"
                  : "rounded-md px-2 py-1 text-xs font-semibold text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] sm:px-3 sm:py-1.5 sm:text-sm"
              }
              href={`/${supportedLocale}${activeRoute ? `/${activeRoute}` : ""}`}
              key={supportedLocale}
            >
              {supportedLocale === "pt-PT" ? "PT" : "EN"}
            </Link>
          ))}
        </div>

        <div className="relative hidden md:block">
          <button
            aria-expanded={userMenuOpen}
            className="flex items-center gap-2 rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-2 py-1.5 text-left hover:bg-[var(--forge-hover-bg)]"
            onClick={() => setUserMenuOpen((value) => !value)}
            type="button"
          >
            <span className="grid size-8 place-items-center rounded-full bg-[var(--forge-accent-orange-soft)] text-sm font-bold text-[var(--forge-accent-orange)]">
              JG
            </span>
            <span className="hidden lg:block">
              <span className="block text-sm font-semibold text-[var(--forge-text-primary)]">
                {dictionary.dashboard.userName}
              </span>
              <span className="block text-xs text-[var(--forge-text-muted)]">
                {dictionary.dashboard.userRole}
              </span>
            </span>
          </button>
          {userMenuOpen ? (
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface-elevated)] p-2 shadow-[var(--forge-shadow-soft)]">
              <Link
                className="block rounded-md px-3 py-2 text-sm hover:bg-[var(--forge-hover-bg)]"
                href={`/${locale}/settings`}
                onClick={() => setUserMenuOpen(false)}
              >
                {dictionary.navigation.settings}
              </Link>
              <button
                className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-[var(--forge-hover-bg)]"
                onClick={() => {
                  setCustomizeOpen(true);
                  setUserMenuOpen(false);
                }}
                type="button"
              >
                {dictionary.dashboard.customize}
              </button>
            </div>
          ) : null}
        </div>

        <button
          className="hidden shrink-0 rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-3 py-2 text-sm font-semibold text-[var(--forge-text-secondary)] hover:bg-[var(--forge-hover-bg)] lg:inline-flex"
          onClick={() => setCustomizeOpen(true)}
          type="button"
        >
          {dictionary.dashboard.customize}
        </button>
      </div>

      <CommandPalette
        dictionary={dictionary}
        locale={locale}
        onClose={closePalette}
        onQuickCreate={(entity) => {
          const hrefMap: Record<string, string> = {
            lead: `/${locale}/leadops#create-lead`,
            customer: `/${locale}/customers#create`,
            product: `/${locale}/products#create`,
            quote: `/${locale}/quotations#create`,
            customizer: `/${locale}/quotations/customizer#create`,
            production: `/${locale}/production#create`,
            machine: `/${locale}/machines#create`,
            inventory: `/${locale}/inventory#create`
          };
          const href = hrefMap[entity];
          if (href) window.location.href = href;
        }}
        open={paletteOpen}
        previewRole={previewRole}
      />

      <DashboardCustomizeDialog
        dictionary={dictionary.dashboardCustomize}
        onClose={() => setCustomizeOpen(false)}
        open={customizeOpen}
      />
    </div>
  );
}

export function usePreviewRole(): PreviewRole {
  const [role, setRole] = useState<PreviewRole>(() => readPreviewRole());

  useEffect(() => {
    function handleChange(event: Event) {
      const detail = (event as CustomEvent<PreviewRole>).detail;
      if (detail) setRole(detail);
    }
    window.addEventListener("forgeos:preview-role-changed", handleChange);
    return () => window.removeEventListener("forgeos:preview-role-changed", handleChange);
  }, []);

  return role;
}
