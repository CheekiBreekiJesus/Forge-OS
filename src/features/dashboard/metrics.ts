import type { ProductionOrder, Quote } from "@/domain/types";
import type { InventoryItem } from "@/domain/operations-types";
import type { StatusTone } from "@/theme/ui-classes";

export type DashboardKpiKey =
  | "oee"
  | "revenue"
  | "openQuotations"
  | "delayedOrders"
  | "maintenanceAlerts";

export type DashboardKpi = {
  key: DashboardKpiKey;
  value: string;
  trend: string;
  trendDirection: "up" | "down" | "flat";
  tone: StatusTone;
  isDemo: boolean;
};

export type InventorySummaryRow = {
  id: string;
  name: string;
  category: string;
  quantityLabel: string;
  minimumLabel: string;
  fillPercent: number;
  tone: StatusTone;
  href?: string;
};

export type DashboardAlertItem = {
  id: string;
  title: string;
  detail: string;
  timeLabel: string;
  priority: string;
  tone: StatusTone;
  href: string;
};

export type ProductionOrderRow = {
  id: string;
  orderNumber: string;
  product: string;
  quantityLabel: string;
  progress: number;
  deliveryLabel: string;
  tone: StatusTone;
  href: string;
};

export type RevenuePoint = {
  label: string;
  value: number;
};

export type OeeMetrics = {
  score: number;
  availability: number;
  performance: number;
  quality: number;
  weeklyValues: number[];
  isDemo: boolean;
};

type MetricsInput = {
  openQuotations: number;
  productionOrders: number;
  outreachReady: number;
  outreachSent: number;
  quotes: Quote[];
  orders: ProductionOrder[];
  inventory: InventoryItem[];
  locale: string;
};

function formatCurrency(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0
  }).format(value);
}

export function deriveDashboardKpis(input: MetricsInput): DashboardKpi[] {
  const delayedOrders = input.orders.filter((order) => order.status === "blocked").length;
  const maintenanceAlerts = Math.max(
    1,
    input.orders.filter((order) => order.artworkStatus === "pending").length
  );
  const quoteTotal = input.quotes.reduce((sum, quote) => sum + (quote.total ?? 0), 0);
  const hasLiveQuotes = input.quotes.length > 0;

  return [
    {
      key: "oee",
      value: "78.5%",
      trend: "+6.4%",
      trendDirection: "up",
      tone: "green",
      isDemo: true
    },
    {
      key: "revenue",
      value: hasLiveQuotes ? formatCurrency(quoteTotal, input.locale) : "€124,850",
      trend: hasLiveQuotes ? `${input.quotes.length} quotes` : "+12.7%",
      trendDirection: "up",
      tone: "green",
      isDemo: !hasLiveQuotes
    },
    {
      key: "openQuotations",
      value: String(input.openQuotations),
      trend: input.openQuotations > 0 ? `+${Math.min(input.openQuotations, 2)}` : "0",
      trendDirection: input.openQuotations > 0 ? "up" : "flat",
      tone: "blue",
      isDemo: false
    },
    {
      key: "delayedOrders",
      value: String(delayedOrders || (input.productionOrders > 0 ? 0 : 7)),
      trend: delayedOrders > 0 ? `-${Math.min(delayedOrders, 3)}` : "-3",
      trendDirection: "down",
      tone: "red",
      isDemo: input.orders.length === 0
    },
    {
      key: "maintenanceAlerts",
      value: String(maintenanceAlerts),
      trend: "-1",
      trendDirection: "down",
      tone: "amber",
      isDemo: input.orders.length === 0
    }
  ];
}

export function deriveOeeMetrics(orders: ProductionOrder[]): OeeMetrics {
  const hasOrders = orders.length > 0;
  return {
    score: hasOrders ? 82.4 : 78.5,
    availability: 90.3,
    performance: hasOrders ? 79.1 : 76.8,
    quality: 95.4,
    weeklyValues: hasOrders ? [84, 86, 88, 85, 83, 62, 64] : [86, 88, 91, 87, 84, 62, 64],
    isDemo: !hasOrders
  };
}

export function deriveInventorySummary(
  items: InventoryItem[],
  locale: string,
  inventoryHref: string
): InventorySummaryRow[] {
  if (items.length === 0) {
    return [
      {
        id: "demo-abs",
        name: "Natural ABS",
        category: "Raw material",
        quantityLabel: "2,450 kg",
        minimumLabel: "Min: 1,000 kg",
        fillPercent: 82,
        tone: "green",
        href: inventoryHref
      },
      {
        id: "demo-pp",
        name: "Polypropylene",
        category: "Raw material",
        quantityLabel: "1,200 kg",
        minimumLabel: "Min: 1,000 kg",
        fillPercent: 58,
        tone: "amber",
        href: inventoryHref
      },
      {
        id: "demo-steel",
        name: "P20 steel",
        category: "Raw material",
        quantityLabel: "850 kg",
        minimumLabel: "Min: 1,000 kg",
        fillPercent: 34,
        tone: "red",
        href: inventoryHref
      }
    ];
  }

  return items.slice(0, 5).map((item) => {
    const available = item.currentQuantity;
    const fillPercent = Math.max(
      8,
      Math.min(100, Math.round((available / Math.max(item.reorderLevel, 1)) * 100))
    );
    const tone: StatusTone =
      available <= item.reorderLevel ? "red" : fillPercent < 70 ? "amber" : "green";

    return {
      id: item.id,
      name: item.name,
      category: item.category ?? item.sku,
      quantityLabel: `${available.toLocaleString(locale)} ${item.unit}`,
      minimumLabel: `Min: ${item.reorderLevel.toLocaleString(locale)} ${item.unit}`,
      fillPercent,
      tone,
      href: inventoryHref
    };
  });
}

export function deriveProductionOrderRows(
  orders: ProductionOrder[],
  locale: string,
  productionHref: string
): ProductionOrderRow[] {
  if (orders.length === 0) {
    return [
      {
        id: "demo-op-045",
        orderNumber: "OP-045",
        product: "Technical box A",
        quantityLabel: "1,200 un",
        progress: 65,
        deliveryLabel: "17 May",
        tone: "green",
        href: productionHref
      },
      {
        id: "demo-op-046",
        orderNumber: "OP-046",
        product: "Support B",
        quantityLabel: "800 un",
        progress: 40,
        deliveryLabel: "18 May",
        tone: "amber",
        href: productionHref
      },
      {
        id: "demo-op-047",
        orderNumber: "OP-047",
        product: "Cover C",
        quantityLabel: "500 un",
        progress: 80,
        deliveryLabel: "20 May",
        tone: "green",
        href: productionHref
      }
    ];
  }

  return orders.slice(0, 5).map((order, index) => {
    const tone: StatusTone =
      order.status === "blocked" ? "red" : order.status === "completed" ? "green" : "amber";

    return {
      id: order.id,
      orderNumber: order.orderNumber ?? `OP-${String(index + 1).padStart(3, "0")}`,
      product: order.productName ?? order.customerName,
      quantityLabel: `${order.quantity.toLocaleString(locale)} un`,
      progress: order.progress ?? 45,
      deliveryLabel: order.scheduledDate ?? "—",
      tone,
      href: `${productionHref}#${order.id}`
    };
  });
}

export function deriveRevenueSeries(quotes: Quote[]): RevenuePoint[] {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  if (quotes.length === 0) {
    return labels.map((label, index) => ({
      label,
      value: [18, 22, 20, 26, 24, 12, 14][index] ?? 10
    }));
  }

  const total = quotes.reduce((sum, quote) => sum + (quote.total ?? 0), 0);
  const base = total / 7;
  return labels.map((label, index) => ({
    label,
    value: Math.round(base * (0.7 + index * 0.05))
  }));
}

export function deriveMarketingSummary(input: {
  outreachReady: number;
  outreachSent: number;
  outreachQueued: number;
}) {
  return {
    leadsReady: input.outreachReady,
    draftsAwaitingReview: input.outreachQueued,
    approvedEmails: input.outreachReady,
    externallyOpened: input.outreachSent,
    suppressedLeads: 0,
    isDemo: input.outreachReady === 0 && input.outreachSent === 0
  };
}
