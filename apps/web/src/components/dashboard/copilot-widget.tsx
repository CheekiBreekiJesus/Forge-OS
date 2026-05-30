"use client";

import { useTranslations } from "next-intl";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@forgeos/ui";
import { Bot } from "lucide-react";

export function CopilotWidget() {
  const t = useTranslations("copilot");

  const molds = [
    { mold: "JG-102", date: "3 Jun" },
    { mold: "JG-078", date: "12 Jun" },
    { mold: "JG-051", date: "18 Jun" },
  ];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-forge-primary" />
          <CardTitle>{t("title")}</CardTitle>
          <Badge variant="primary">{t("beta")}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="rounded-lg bg-forge-elevated p-3 text-sm text-forge-foreground">
          {t("userQuestion")}
        </div>
        <div className="rounded-lg border border-forge-border bg-forge-background/50 p-3 text-sm text-forge-muted">
          <p className="mb-2">{t("responseIntro")}</p>
          <ul className="mb-2 list-disc space-y-1 pl-4">
            {molds.map((m) => (
              <li key={m.mold}>{t("moldItem", { mold: m.mold, date: m.date })}</li>
            ))}
          </ul>
          <p>{t("followUp")}</p>
        </div>
        <div className="mt-auto">
          <input
            type="text"
            placeholder={t("placeholder")}
            className="w-full rounded-lg border border-forge-border bg-forge-elevated px-3 py-2 text-sm text-forge-foreground placeholder:text-forge-muted focus:border-forge-primary focus:outline-none"
          />
        </div>
      </CardContent>
    </Card>
  );
}
