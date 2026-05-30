"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, Progress } from "@forgeos/ui";
import type { InventorySummaryItem } from "@forgeos/shared";
import { formatNumber } from "@forgeos/i18n";
import type { SupportedLocale } from "@forgeos/i18n";
import { useLocale } from "next-intl";
import { Package } from "lucide-react";

export function InventoryWidget({ items }: { items: InventorySummaryItem[] }) {
  const t = useTranslations("dashboard.inventory");
  const locale = useLocale() as SupportedLocale;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => {
          const variant =
            item.levelPercent < 50 ? "danger" : item.levelPercent < 70 ? "warning" : "default";
          return (
            <div key={item.id} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 shrink-0 text-forge-muted" />
                <span className="flex-1 truncate text-sm font-medium text-forge-foreground">
                  {item.name}
                </span>
                <span className="text-xs text-forge-muted">
                  {formatNumber(item.quantity, locale)} {item.unit}
                </span>
              </div>
              <Progress value={item.levelPercent} variant={variant} />
              <p className="text-right text-[10px] text-forge-muted">
                {t("minimum")}: {formatNumber(item.minimum, locale)} {item.unit}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
