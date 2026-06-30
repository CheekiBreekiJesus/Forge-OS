"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { supportedLocales } from "@/i18n/config";
import { CommandPalette, useCommandPaletteShortcut } from "@/features/crud/command-palette";
import { QuickCreateMenu } from "@/features/crud/quick-create-menu";
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

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  useCommandPaletteShortcut(() => setPaletteOpen((v) => !v));

  function handleRoleChange(role: PreviewRole) {
    writePreviewRole(role);
    setPreviewRole(role);
    window.dispatchEvent(new CustomEvent("forgeos:preview-role-changed", { detail: role }));
  }

  const roleCopy = dictionary.crudModule.rolePreview;

  return (
    <div className="flex min-w-0 flex-1 items-center gap-4">
      <button
        className="hidden min-w-0 flex-1 items-center rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-400 hover:border-slate-600 sm:flex"
        onClick={openPalette}
        type="button"
      >
        <span className="mr-2">/</span>
        <span className="flex-1 text-left">{dictionary.dashboard.searchPlaceholder}</span>
        <span className="text-xs">{dictionary.dashboard.searchShortcut}</span>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <QuickCreateMenu dictionary={dictionary} locale={locale} previewRole={previewRole} />

        <label className="hidden items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-200 sm:flex">
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
              {supportedLocale === "pt-PT" ? "PT" : supportedLocale === "en" ? "EN" : supportedLocale}
            </Link>
          ))}
        </div>
        <button
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
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
          <div className="relative w-full max-w-md rounded-lg border border-slate-700 bg-[#07101d] p-5 shadow-xl">
            <h2 className="text-lg font-bold">{dictionary.crudModule.customizeDialog.title}</h2>
            <p className="mt-2 text-sm text-slate-400">{dictionary.crudModule.customizeDialog.message}</p>
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
