"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { getLocalizedModuleHref } from "@/modules/config";
import { canCreateEntity, type PreviewRole } from "./role-preview";

type QuickCreateMenuProps = {
  dictionary: Dictionary;
  locale: Locale;
  previewRole: PreviewRole;
};

type CreateAction = {
  key: string;
  label: string;
  href: string;
  hash: string;
};

export function QuickCreateMenu({ dictionary, locale, previewRole }: QuickCreateMenuProps) {
  const copy = dictionary.crudModule.quickCreate;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const actions: CreateAction[] = [
    { key: "lead", label: copy.lead, href: `/${locale}/leadops`, hash: "create-lead" },
    {
      key: "customer",
      label: copy.customer,
      href: getLocalizedModuleHref(locale, "customers"),
      hash: "create"
    },
    {
      key: "product",
      label: copy.product,
      href: getLocalizedModuleHref(locale, "products"),
      hash: "create"
    },
    {
      key: "quote",
      label: copy.quote,
      href: getLocalizedModuleHref(locale, "orders"),
      hash: "create"
    },
    {
      key: "production",
      label: copy.production,
      href: getLocalizedModuleHref(locale, "production"),
      hash: "create"
    },
    {
      key: "machine",
      label: copy.machine,
      href: getLocalizedModuleHref(locale, "machines"),
      hash: "create"
    },
    {
      key: "inventory",
      label: copy.inventory,
      href: getLocalizedModuleHref(locale, "inventory"),
      hash: "create"
    }
  ].filter((a) => canCreateEntity(previewRole, a.key));

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (actions.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-bold text-white hover:bg-orange-400"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {copy.trigger}
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-1 min-w-[12rem] rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-lg">
          {actions.map((action) => (
            <Link
              className="block px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
              href={`${action.href}#${action.hash}`}
              key={action.key}
              onClick={() => setOpen(false)}
            >
              {action.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
