"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { SUPPORTED_LOCALES, type SupportedLocale } from "@forgeos/i18n";

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  "pt-PT": "PT",
  en: "EN",
  "es-ES": "ES",
};

export function LocaleSwitcher() {
  const locale = useLocale() as SupportedLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLocale(next: SupportedLocale) {
    if (next === locale) return;
    const segments = pathname.split("/");
    segments[1] = next;
    startTransition(() => {
      router.replace(segments.join("/"));
    });
  }

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={(e) => switchLocale(e.target.value as SupportedLocale)}
        disabled={isPending}
        className="appearance-none rounded-lg border border-forge-border bg-forge-elevated py-2 pl-3 pr-8 text-sm font-medium text-forge-foreground focus:border-forge-primary focus:outline-none"
        aria-label="Language"
      >
        {SUPPORTED_LOCALES.map((loc) => (
          <option key={loc} value={loc}>
            {LOCALE_LABELS[loc]}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-forge-muted" />
    </div>
  );
}
