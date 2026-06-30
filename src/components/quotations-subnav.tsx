"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type QuotationsSubnavProps = {
  dictionary: Dictionary;
  locale: Locale;
};

export function QuotationsSubnav({ dictionary, locale }: QuotationsSubnavProps) {
  const pathname = usePathname();
  const isCustomizer = pathname.includes("/quotations/customizer");
  const copy = dictionary.quotationsModule.tabs;

  const tabs = [
    { active: !isCustomizer, href: `/${locale}/quotations`, label: copy.quotations },
    { active: isCustomizer, href: `/${locale}/quotations/customizer`, label: copy.customizer }
  ];

  return (
    <nav aria-label={copy.label} className="mb-5 flex gap-1 rounded-lg border border-slate-700 bg-slate-900/80 p-1">
      {tabs.map((tab) => (
        <Link
          className={
            tab.active
              ? "rounded-md bg-orange-500 px-4 py-2 text-sm font-bold text-white"
              : "rounded-md px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white"
          }
          href={tab.href}
          key={tab.href}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
