"use client";

import { useLocale, useTranslations } from "next-intl";
import { Bell, Search, Sun, Moon } from "lucide-react";
import { Button } from "@forgeos/ui";
import { DEMO_USER } from "@forgeos/shared";
import { useShellStore } from "@/stores/shell-store";
import { LocaleSwitcher } from "./locale-switcher";

const ROLE_LABELS: Record<string, Record<string, string>> = {
  "pt-PT": { director: "Diretor Geral" },
  en: { director: "General Director" },
  "es-ES": { director: "Director General" },
};

export function TopBar() {
  const t = useTranslations("shell");
  const theme = useShellStore((s) => s.theme);
  const toggleTheme = useShellStore((s) => s.toggleTheme);
  const locale = useLocale();

  const roleLabel =
    ROLE_LABELS[locale]?.[DEMO_USER.role] ??
    ROLE_LABELS.en[DEMO_USER.role] ??
    DEMO_USER.role;

  return (
    <header className="flex h-14 items-center gap-4 border-b border-forge-border bg-forge-surface px-6">
      <div className="relative flex flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forge-muted" />
        <input
          type="search"
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-lg border border-forge-border bg-forge-elevated py-2 pl-10 pr-24 text-sm text-forge-foreground placeholder:text-forge-muted focus:border-forge-primary focus:outline-none focus:ring-1 focus:ring-forge-primary"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-forge-border bg-forge-surface px-1.5 py-0.5 text-xs text-forge-muted">
          {t("searchShortcut")}
        </kbd>
      </div>

      <LocaleSwitcher />

      <button
        type="button"
        className="relative rounded-lg p-2 text-forge-muted hover:bg-forge-elevated hover:text-forge-foreground"
        aria-label={t("notifications")}
      >
        <Bell className="h-5 w-5" />
        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-forge-danger text-[10px] font-bold text-white">
          12
        </span>
      </button>

      <Button
        variant="ghost"
        className="!p-2"
        onClick={toggleTheme}
        aria-label={t("toggleTheme")}
      >
        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <div className="flex items-center gap-3 border-l border-forge-border pl-4">
        <div className="text-right">
          <p className="text-sm font-medium text-forge-foreground">{DEMO_USER.name}</p>
          <p className="text-xs text-forge-muted">{roleLabel}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forge-primary text-sm font-semibold text-white">
          JG
        </div>
      </div>
    </header>
  );
}
