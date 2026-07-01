"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { supportedLocales } from "@/i18n/config";
import { CommandPalette, useCommandPaletteShortcut } from "@/features/crud/command-palette";
import { QuickCreateMenu } from "@/features/crud/quick-create-menu";
import { NotificationCenter } from "@/components/notification-center";
import {
  PREVIEW_ROLES,
  readPreviewRole,
  writePreviewRole,
  type PreviewRole
} from "@/features/crud/role-preview";
import {
  applyThemeMode,
  getStoredThemeMode,
  nextThemeMode,
  persistThemeMode,
  resolveThemeMode,
  type ForgeThemeMode
} from "@/features/theme/theme";
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
  const [themeMode, setThemeMode] = useState<ForgeThemeMode>(() => getStoredThemeMode());
  const [density, setDensity] = useState<"comfortable" | "compact">(() => {
    if (typeof window === "undefined") return "comfortable";
    return window.localStorage.getItem("forgeos:dashboard-density") === "compact"
      ? "compact"
      : "comfortable";
  });

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  useCommandPaletteShortcut(() => setPaletteOpen((v) => !v));

  useEffect(() => {
    document.documentElement.dataset.dashboardDensity = density;
  }, [density]);

  useEffect(() => {
    applyThemeMode(themeMode);
    if (themeMode !== "system") return;
    const query = window.matchMedia("(prefers-color-scheme: light)");
    const handleChange = () => applyThemeMode("system");
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, [themeMode]);

  function handleRoleChange(role: PreviewRole) {
    writePreviewRole(role);
    setPreviewRole(role);
    window.dispatchEvent(new CustomEvent("forgeos:preview-role-changed", { detail: role }));
  }

  function handleThemeToggle() {
    const nextMode = nextThemeMode(themeMode);
    persistThemeMode(nextMode);
    setThemeMode(nextMode);
  }

  function handleDensityChange(nextDensity: "comfortable" | "compact") {
    window.localStorage.setItem("forgeos:dashboard-density", nextDensity);
    setDensity(nextDensity);
  }

  const roleCopy = dictionary.crudModule.rolePreview;
  const resolvedTheme = resolveThemeMode(themeMode);
  const themeLabel =
    themeMode === "system"
      ? dictionary.app.themeSystem
      : themeMode === "light"
        ? dictionary.app.themeLight
        : dictionary.app.themeDark;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-4">
      <button
        className="hidden min-w-0 flex-1 items-center rounded-lg border border-[var(--forge-border)] bg-[var(--forge-input)] px-3 py-2 text-sm text-[var(--forge-text-muted)] hover:border-slate-500 sm:flex"
        onClick={openPalette}
        type="button"
      >
        <span className="mr-2">/</span>
        <span className="flex-1 text-left">{dictionary.dashboard.searchPlaceholder}</span>
        <span className="text-xs">{dictionary.dashboard.searchShortcut}</span>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <NotificationCenter dictionary={dictionary} locale={locale} />
        <div className="hidden sm:block">
          <QuickCreateMenu dictionary={dictionary} locale={locale} previewRole={previewRole} />
        </div>

        <label className="hidden items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-200 xl:flex">
          <span className="font-semibold">{roleCopy.badge}</span>
          <select
            aria-label={roleCopy.label}
            className="bg-transparent text-xs font-semibold outline-none"
            onChange={(e) => handleRoleChange(e.target.value as PreviewRole)}
            value={previewRole}
          >
            {PREVIEW_ROLES.map((role) => (
              <option className="bg-slate-900 text-slate-100" key={role} value={role}>
                {roleCopy.roles[role]}
              </option>
            ))}
          </select>
        </label>

        <div className="hidden items-center gap-2 rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-3 py-2 text-sm text-[var(--forge-text-secondary)] xl:flex">
          {dictionary.dashboard.dateRange}
        </div>
        <div className="flex rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] p-1">
          {supportedLocales.map((supportedLocale) => (
            <Link
              className={
                supportedLocale === locale
                  ? "rounded-md bg-slate-700 px-3 py-1.5 text-sm font-semibold text-white"
                  : "rounded-md px-3 py-1.5 text-sm font-semibold text-[var(--forge-text-muted)] hover:text-[var(--forge-text)]"
              }
              href={`/${supportedLocale}${activeRoute ? `/${activeRoute}` : ""}`}
              key={supportedLocale}
            >
              {supportedLocale === "pt-PT" ? "PT" : supportedLocale === "en" ? "EN" : supportedLocale}
            </Link>
          ))}
        </div>
        <button
          aria-label={`${dictionary.app.toggleTheme}: ${themeLabel}`}
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-3 py-2 text-sm font-semibold text-[var(--forge-text-secondary)] hover:bg-[var(--forge-hover)]"
          onClick={handleThemeToggle}
          type="button"
        >
          <span aria-hidden>{resolvedTheme === "light" ? "☀" : "☾"}</span>
          <span className="hidden md:inline">{themeLabel}</span>
        </button>
        <button
          className="hidden rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-3 py-2 text-sm font-semibold text-[var(--forge-text-secondary)] hover:bg-[var(--forge-hover)] sm:block"
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

      {customizeOpen ? (
        <div className="fixed inset-0 z-[60] grid place-items-center p-4">
          <button
            aria-label={dictionary.crudModule.customizeDialog.close}
            className="absolute inset-0 bg-black/70"
            onClick={() => setCustomizeOpen(false)}
            type="button"
          />
          <div className="relative w-full max-w-md rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface-solid)] p-5 shadow-xl">
            <h2 className="text-lg font-bold">{dictionary.crudModule.customizeDialog.title}</h2>
            <p className="mt-2 text-sm text-[var(--forge-text-muted)]">{dictionary.crudModule.customizeDialog.message}</p>
            <div className="mt-4 grid gap-2">
              {(["comfortable", "compact"] as const).map((option) => (
                <button
                  className={
                    density === option
                      ? "rounded-lg border border-orange-400 bg-orange-500/10 px-3 py-2 text-left text-sm font-semibold text-orange-400"
                      : "rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-3 py-2 text-left text-sm font-semibold text-[var(--forge-text-secondary)]"
                  }
                  key={option}
                  onClick={() => handleDensityChange(option)}
                  type="button"
                >
                  {option === "comfortable" ? "Comfortable" : "Compact"}
                </button>
              ))}
            </div>
            <button
              className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white"
              onClick={() => setCustomizeOpen(false)}
              type="button"
            >
              {dictionary.crudModule.customizeDialog.close}
            </button>
          </div>
        </div>
      ) : null}
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
