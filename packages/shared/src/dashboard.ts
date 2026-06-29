export type KpiTrend = "up" | "down" | "neutral";

export interface DashboardKpi {
  key: string;
  value: number;
  displayValue: string;
  change: number;
  changeLabel: string;
  trend: KpiTrend;
  variant?: "default" | "danger";
  sparkline: number[];
}

export interface OeeBreakdown {
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  daily: { date: string; oee: number }[];
}

export interface InventorySummaryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minimum: number;
  levelPercent: number;
  icon: "pellet" | "steel" | "resin" | "spare" | "generic";
}

export type AlertSeverity = "high" | "medium" | "low";

export interface DashboardAlert {
  id: string;
  severity: AlertSeverity;
  messageKey: keyof typeof ALERT_MESSAGE_KEYS;
  params: Record<string, string>;
}

export const ALERT_MESSAGE_KEYS = {
  preventive_injector: "preventive_injector",
  order_delayed: "order_delayed",
  low_stock: "low_stock",
  mold_maintenance: "mold_maintenance",
  quotation_pending: "quotation_pending",
} as const;

export interface ProductionOrderRow {
  id: string;
  number: string;
  product: string;
  quantity: number;
  progress: number;
  deliveryDate: string;
}

export interface RevenuePoint {
  date: string;
  value: number;
}

/** Seed data aligned with UI mockup. */
export function getDemoDashboardData() {
  return {
    kpis: [
      {
        key: "oee",
        value: 78.5,
        displayValue: "78.5%",
        change: 6.4,
        changeLabel: "",
        trend: "up" as KpiTrend,
        sparkline: [72, 73, 74, 75, 76, 77, 78.5],
      },
      {
        key: "revenue",
        value: 124850,
        displayValue: "€124,850",
        change: 12.7,
        changeLabel: "",
        trend: "up" as KpiTrend,
        sparkline: [98, 102, 108, 112, 118, 121, 124.85],
      },
      {
        key: "openQuotations",
        value: 18,
        displayValue: "18",
        change: 2,
        changeLabel: "",
        trend: "up" as KpiTrend,
        sparkline: [14, 15, 15, 16, 17, 17, 18],
      },
      {
        key: "overdueOrders",
        value: 7,
        displayValue: "7",
        change: -3,
        changeLabel: "",
        trend: "down" as KpiTrend,
        variant: "danger" as const,
        sparkline: [12, 11, 10, 9, 9, 8, 7],
      },
      {
        key: "maintenanceAlerts",
        value: 5,
        displayValue: "5",
        change: -1,
        changeLabel: "",
        trend: "down" as KpiTrend,
        sparkline: [8, 7, 7, 6, 6, 6, 5],
      },
    ],
    oee: {
      oee: 78.5,
      availability: 90.3,
      performance: 76.8,
      quality: 95.4,
      daily: [
        { date: "2024-05-13", oee: 72.1 },
        { date: "2024-05-14", oee: 74.5 },
        { date: "2024-05-15", oee: 75.8 },
        { date: "2024-05-16", oee: 76.2 },
        { date: "2024-05-17", oee: 77.4 },
        { date: "2024-05-18", oee: 78.0 },
        { date: "2024-05-19", oee: 78.5 },
      ],
    } satisfies OeeBreakdown,
    inventory: [
      {
        id: "1",
        name: "ABS Natural",
        quantity: 1250,
        unit: "kg",
        minimum: 500,
        levelPercent: 75,
        icon: "pellet",
      },
      {
        id: "2",
        name: "Aço P20",
        quantity: 320,
        unit: "kg",
        minimum: 400,
        levelPercent: 45,
        icon: "steel",
      },
      {
        id: "3",
        name: "PP Copolímero",
        quantity: 890,
        unit: "kg",
        minimum: 300,
        levelPercent: 82,
        icon: "resin",
      },
      {
        id: "4",
        name: "Masterbatch Preto",
        quantity: 45,
        unit: "kg",
        minimum: 50,
        levelPercent: 38,
        icon: "generic",
      },
      {
        id: "5",
        name: "Anilha Ø32",
        quantity: 2400,
        unit: "un",
        minimum: 1000,
        levelPercent: 90,
        icon: "spare",
      },
    ] satisfies InventorySummaryItem[],
    alerts: [
      {
        id: "a1",
        severity: "high",
        messageKey: "preventive_injector",
        params: { machine: "Injector 02" },
      },
      {
        id: "a2",
        severity: "high",
        messageKey: "order_delayed",
        params: { order: "OP-045" },
      },
      {
        id: "a3",
        severity: "high",
        messageKey: "low_stock",
        params: { product: "Aço P20" },
      },
      {
        id: "a4",
        severity: "medium",
        messageKey: "mold_maintenance",
        params: { mold: "JG-102" },
      },
      {
        id: "a5",
        severity: "low",
        messageKey: "quotation_pending",
        params: {},
      },
    ] as DashboardAlert[],
    productionOrders: [
      {
        id: "op1",
        number: "OP-045",
        product: "Tampa 50ml R.24",
        quantity: 50000,
        progress: 62,
        deliveryDate: "2024-05-22",
      },
      {
        id: "op2",
        number: "OP-046",
        product: "Frasco 100ml",
        quantity: 30000,
        progress: 88,
        deliveryDate: "2024-05-20",
      },
      {
        id: "op3",
        number: "OP-047",
        product: "Tampa Flip-Top",
        quantity: 75000,
        progress: 34,
        deliveryDate: "2024-05-25",
      },
      {
        id: "op4",
        number: "OP-048",
        product: "Embalagem 5L",
        quantity: 12000,
        progress: 91,
        deliveryDate: "2024-05-19",
      },
      {
        id: "op5",
        number: "OP-049",
        product: "Componente JG-A12",
        quantity: 100000,
        progress: 15,
        deliveryDate: "2024-05-28",
      },
    ] satisfies ProductionOrderRow[],
    revenue: [
      { date: "2024-05-13", value: 15200 },
      { date: "2024-05-14", value: 18400 },
      { date: "2024-05-15", value: 22100 },
      { date: "2024-05-16", value: 19800 },
      { date: "2024-05-17", value: 24500 },
      { date: "2024-05-18", value: 21200 },
      { date: "2024-05-19", value: 23650 },
    ] satisfies RevenuePoint[],
  };
}
