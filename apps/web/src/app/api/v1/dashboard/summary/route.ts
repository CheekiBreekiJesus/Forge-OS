import { NextResponse } from "next/server";
import { fetchDashboardSummary } from "@forgeos/api";

/** GET /api/v1/dashboard/summary — English API contract, demo data. */
export async function GET() {
  const data = fetchDashboardSummary();
  return NextResponse.json({
    oee: {
      value: data.oee.oee,
      change_percent: 6.4,
      sparkline: data.kpis[0]?.sparkline ?? [],
    },
    revenue_week: {
      value: 124850,
      currency: "EUR",
      change_percent: 12.7,
    },
    open_quotations: { value: 18, change: 2 },
    overdue_orders: { value: 7, change: -3 },
    maintenance_alerts: { value: 5, change: -1 },
  });
}
