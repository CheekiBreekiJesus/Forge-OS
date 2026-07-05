"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { ModuleKey } from "@/modules/config";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { AppFrameNav } from "@/components/app-frame-nav";
import { OVERLAY_Z_INDEX } from "@/components/ui/overlay-layers";

type MobileNavDrawerProps = {
  activeModule: ModuleKey;
  dictionary: Dictionary;
  isLeadOpsActive: boolean;
  leadOpsHref: string;
  locale: Locale;
};

function useClientMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function MobileNavDrawer({
  activeModule,
  dictionary,
  isLeadOpsActive,
  leadOpsHref,
  locale
}: MobileNavDrawerProps) {
  const [open, setOpen] = useState(false);
  const mounted = useClientMounted();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  function close() {
    setOpen(false);
    menuButtonRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  const drawer =
    mounted && typeof document !== "undefined"
      ? createPortal(
          <>
            {open ? (
              <div
                aria-hidden="true"
                className="fixed inset-0 bg-black/60 lg:hidden"
                onClick={close}
                style={{ zIndex: OVERLAY_Z_INDEX.mobileNavBackdrop }}
              />
            ) : null}

            <div
              aria-hidden={!open}
              aria-label={dictionary.app.openMenu}
              aria-modal={open ? true : undefined}
              className={`fixed inset-y-0 left-0 flex w-64 flex-col border-r border-slate-800 bg-[#07101d] transition-transform duration-200 lg:hidden ${
                open ? "translate-x-0" : "-translate-x-full"
              }`}
              id="forgeos-mobile-nav"
              inert={!open}
              role={open ? "dialog" : undefined}
              style={{ zIndex: OVERLAY_Z_INDEX.modal }}
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
                  ref={closeButtonRef}
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

              <AppFrameNav
                activeModule={activeModule}
                className="flex-1 overflow-y-auto px-3"
                dictionary={dictionary}
                isLeadOpsActive={isLeadOpsActive}
                leadOpsHref={leadOpsHref}
                locale={locale}
                onNavigate={close}
              />
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <>
      <button
        aria-controls="forgeos-mobile-nav"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={dictionary.app.openMenu}
        className="grid size-10 shrink-0 place-items-center rounded-lg border border-slate-700 text-slate-200 lg:hidden"
        onClick={() => setOpen(true)}
        ref={menuButtonRef}
        type="button"
      >
        <svg aria-hidden fill="none" height="16" viewBox="0 0 16 16" width="16">
          <rect fill="currentColor" height="1.5" rx="0.75" width="16" x="0" y="2" />
          <rect fill="currentColor" height="1.5" rx="0.75" width="16" x="0" y="7.25" />
          <rect fill="currentColor" height="1.5" rx="0.75" width="16" x="0" y="12.5" />
        </svg>
      </button>
      {drawer}
    </>
  );
}
