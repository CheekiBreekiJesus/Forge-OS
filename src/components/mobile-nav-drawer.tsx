"use client";

import Link from "next/link";
import { useState } from "react";
import { getLocalizedModuleHref, moduleKeys, type ModuleKey } from "@/modules/config";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type MobileNavDrawerProps = {
  activeModule: ModuleKey;
  dictionary: Dictionary;
  isLeadOpsActive: boolean;
  leadOpsHref: string;
  locale: Locale;
};

export function MobileNavDrawer({
  activeModule,
  dictionary,
  isLeadOpsActive,
  leadOpsHref,
  locale
}: MobileNavDrawerProps) {
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button
        aria-label={dictionary.app.openMenu}
        className="grid size-10 place-items-center rounded-lg border border-slate-700 text-slate-200 lg:hidden"
        onClick={() => setOpen(true)}
        type="button"
      >
        <svg aria-hidden fill="none" height="16" viewBox="0 0 16 16" width="16">
          <rect fill="currentColor" height="1.5" rx="0.75" width="16" x="0" y="2" />
          <rect fill="currentColor" height="1.5" rx="0.75" width="16" x="0" y="7.25" />
          <rect fill="currentColor" height="1.5" rx="0.75" width="16" x="0" y="12.5" />
        </svg>
      </button>

      {open ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={close}
        />
      ) : null}

      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-[#07101d] transition-transform duration-200 lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={dictionary.app.openMenu}
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
          <Link
            className="grid size-9 place-items-center rounded-lg bg-orange-500/15 text-lg font-black text-orange-400"
            href={`/${locale}`}
            onClick={close}
          >
            F
          </Link>
          <div className="flex-1 text-2xl font-bold tracking-tight">{dictionary.app.name}</div>
          <button
            aria-label={dictionary.app.closeMenu}
            className="grid size-8 place-items-center rounded-lg text-slate-400 hover:text-white"
            onClick={close}
            type="button"
          >
            <svg aria-hidden fill="none" height="14" viewBox="0 0 14 14" width="14">
              <path
                d="M1 1l12 12M13 1L1 13"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>

        <div className="m-4 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-3">
          <div className="text-sm font-semibold">{dictionary.app.tenantLabel}</div>
          <div className="mt-1 text-xs text-slate-400">{dictionary.dashboard.userRole}</div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {moduleKeys.map((key, index) => (
            <Link
              className={
                key === activeModule && !isLeadOpsActive
                  ? "flex items-center gap-3 rounded-lg border-l-2 border-orange-400 bg-orange-500/10 px-3 py-3 text-sm font-semibold text-orange-300"
                  : "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
              }
              href={getLocalizedModuleHref(locale, key)}
              key={key}
              onClick={close}
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
            onClick={close}
          >
            <span className="grid size-6 place-items-center rounded-md border border-slate-700 text-xs">
              L
            </span>
            {dictionary.navigation.leadops}
          </Link>
        </nav>
      </div>
    </>
  );
}
