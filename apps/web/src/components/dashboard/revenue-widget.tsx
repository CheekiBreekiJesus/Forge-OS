"use client";

import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@forgeos/ui";
import { formatCurrency, type SupportedLocale } from "@forgeos/i18n";
import type { RevenuePoint } from "@forgeos/shared";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function RevenueWidget({
  data,
  total,
}: {
  data: RevenuePoint[];
  total: number;
}) {
  const t = useTranslations("dashboard.revenue");
  const locale = useLocale() as SupportedLocale;

  const chartData = data.map((d) => ({
    day: d.date.slice(8),
    value: d.value,
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <p className="text-sm text-forge-muted">
          {t("total", { amount: formatCurrency(total, locale, "EUR") })}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="day" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v: number) => formatCurrency(v, locale, "EUR")}
                contentStyle={{
                  background: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: 8,
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: "#3B82F6", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
