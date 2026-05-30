import { setRequestLocale } from "next-intl/server";
import { fetchDashboardSummary } from "@forgeos/api";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { KpiRow } from "@/components/dashboard/kpi-row";
import { OeeWidget } from "@/components/dashboard/oee-widget";
import { InventoryWidget } from "@/components/dashboard/inventory-widget";
import { AlertsWidget } from "@/components/dashboard/alerts-widget";
import { ProductionOrdersWidget } from "@/components/dashboard/production-orders-widget";
import { RevenueWidget } from "@/components/dashboard/revenue-widget";
import { CopilotWidget } from "@/components/dashboard/copilot-widget";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const data = fetchDashboardSummary();
  const revenueTotal = data.revenue.reduce((sum, p) => sum + p.value, 0);

  return (
    <AppShell>
      <DashboardHeader />
      <KpiRow kpis={data.kpis} />
      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <OeeWidget data={data.oee} />
        </div>
        <div className="xl:col-span-4">
          <InventoryWidget items={data.inventory} />
        </div>
        <div className="xl:col-span-4">
          <AlertsWidget alerts={data.alerts} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <ProductionOrdersWidget orders={data.productionOrders} />
        </div>
        <div className="xl:col-span-4">
          <RevenueWidget data={data.revenue} total={revenueTotal} />
        </div>
        <div className="xl:col-span-4">
          <CopilotWidget />
        </div>
      </div>
    </AppShell>
  );
}
