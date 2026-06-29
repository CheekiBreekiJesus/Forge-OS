"use client";

import { useTranslations } from "next-intl";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@forgeos/ui";
import type { DashboardAlert } from "@forgeos/shared";

export function AlertsWidget({ alerts }: { alerts: DashboardAlert[] }) {
  const t = useTranslations("dashboard.alerts");

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const severityVariant =
            alert.severity === "high"
              ? "danger"
              : alert.severity === "medium"
                ? "primary"
                : "default";
          const message = t(`items.${alert.messageKey}`, alert.params);
          return (
            <div
              key={alert.id}
              className="rounded-lg border border-forge-border bg-forge-elevated/50 p-3"
            >
              <Badge variant={severityVariant} className="mb-2">
                {t(`severity.${alert.severity}`)}
              </Badge>
              <p className="text-sm text-forge-foreground">{message}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
