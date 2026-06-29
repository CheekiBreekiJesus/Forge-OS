"use client";

import { useTranslations } from "next-intl";
import { Button } from "@forgeos/ui";
import { SlidersHorizontal } from "lucide-react";
import { DEMO_USER } from "@forgeos/shared";

export function DashboardHeader() {
  const t = useTranslations("dashboard");

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-xl font-semibold text-forge-foreground">
        {t("greeting", { name: DEMO_USER.name.split(" ")[0] ?? DEMO_USER.name })}
      </h1>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-lg border border-forge-border bg-forge-elevated px-4 py-2 text-sm text-forge-foreground"
        >
          {t("dateRange", { from: "13", to: "19 Maio 2024" })}
        </button>
        <Button variant="outline" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          {t("customize")}
        </Button>
      </div>
    </div>
  );
}
