"use client";

import { useTranslations } from "next-intl";
import { Badge, Button } from "@forgeos/ui";
import { HelpCircle } from "lucide-react";

export function StatusFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-forge-border bg-forge-surface px-6 py-2 text-xs text-forge-muted">
      <span>
        {t("version", { version: "1.0.0", year: "2024" })}
      </span>
      <div className="flex flex-wrap items-center gap-4">
        <span>
          {t("system")}:{" "}
          <span className="text-forge-success">{t("online")}</span>
        </span>
        <span>
          {t("database")}:{" "}
          <span className="text-forge-success">{t("operational")}</span>
        </span>
        <span>
          {t("backup")}: {t("backupAgo", { hours: 2 })}
        </span>
        <Badge variant="info">{t("environment")}</Badge>
      </div>
      <Button variant="ghost" className="!text-xs !text-forge-muted">
        <HelpCircle className="mr-1 h-3.5 w-3.5" />
        {t("support")}
      </Button>
    </footer>
  );
}
