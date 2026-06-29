"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, Progress } from "@forgeos/ui";
import type { ProductionOrderRow } from "@forgeos/shared";

export function ProductionOrdersWidget({ orders }: { orders: ProductionOrderRow[] }) {
  const t = useTranslations("dashboard.production");

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-forge-border text-left text-xs text-forge-muted">
              <th className="pb-2 pr-4 font-medium">{t("columns.order")}</th>
              <th className="pb-2 pr-4 font-medium">{t("columns.product")}</th>
              <th className="pb-2 pr-4 font-medium">{t("columns.quantity")}</th>
              <th className="pb-2 pr-4 font-medium">{t("columns.progress")}</th>
              <th className="pb-2 font-medium">{t("columns.delivery")}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-forge-border/50">
                <td className="py-3 pr-4 font-medium text-forge-primary">{order.number}</td>
                <td className="py-3 pr-4 text-forge-foreground">{order.product}</td>
                <td className="py-3 pr-4 text-forge-muted">
                  {order.quantity.toLocaleString()}
                </td>
                <td className="py-3 pr-4 min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <Progress
                      value={order.progress}
                      variant={order.progress < 40 ? "warning" : "default"}
                      className="flex-1"
                    />
                    <span className="text-xs text-forge-muted w-8">{order.progress}%</span>
                  </div>
                </td>
                <td className="py-3 text-forge-muted">{order.deliveryDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
