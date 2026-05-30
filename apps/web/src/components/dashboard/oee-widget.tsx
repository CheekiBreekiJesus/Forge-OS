"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@forgeos/ui";
import type { OeeBreakdown } from "@forgeos/shared";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BREAKDOWN_COLORS = ["#3B82F6", "#8B5CF6", "#22C55E"];

export function OeeWidget({ data }: { data: OeeBreakdown }) {
  const t = useTranslations("dashboard.oee");

  const donutData = [
    { name: t("availability"), value: data.availability },
    { name: t("performance"), value: data.performance },
    { name: t("quality"), value: data.quality },
  ];

  const barData = data.daily.map((d) => ({
    day: d.date.slice(8),
    oee: d.oee,
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative mx-auto h-40 w-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[{ value: data.oee }, { value: 100 - data.oee }]}
                  dataKey="value"
                  innerRadius={50}
                  outerRadius={70}
                  startAngle={90}
                  endAngle={-270}
                >
                  <Cell fill="#3B82F6" />
                  <Cell fill="#1F2937" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-forge-foreground">{data.oee}%</span>
              <span className="text-xs text-forge-muted">OEE</span>
            </div>
          </div>
          <ul className="flex flex-1 flex-col justify-center gap-2 text-sm">
            {donutData.map((item, i) => (
              <li key={item.name} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 text-forge-muted">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: BREAKDOWN_COLORS[i] }}
                  />
                  {item.name}
                </span>
                <span className="font-medium text-forge-foreground">{item.value}%</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <XAxis dataKey="day" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[60, 85]} />
              <Tooltip
                contentStyle={{
                  background: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="oee" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
