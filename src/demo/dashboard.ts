import {
  demoEvents,
  demoInventoryItems,
  demoLeads,
  demoProductionOrders,
  demoQuotes
} from "./seed";

export type DashboardCardKey =
  | "leads"
  | "quotes"
  | "productionOrders"
  | "pendingArtwork"
  | "pendingScreens"
  | "inventoryAlerts"
  | "todayJobs"
  | "recentActivity";

export type DashboardCard = {
  key: DashboardCardKey;
  value: string;
  detailValue?: string;
  tone: "green" | "blue" | "amber" | "red";
};

export function getDashboardCards(): DashboardCard[] {
  const pendingArtwork = demoProductionOrders.filter(
    (order) => order.artworkStatus === "pending"
  ).length;
  const pendingScreens = demoProductionOrders.filter(
    (order) => order.screenStatus === "pending"
  ).length;
  const inventoryAlerts = demoInventoryItems.filter(
    (item) => item.quantityOnHand - item.reservedQuantity <= item.reorderPoint
  ).length;
  const todayJobs = demoProductionOrders.filter(
    (order) => order.scheduledDate === "2026-06-15"
  ).length;

  return [
    {
      key: "leads",
      value: String(demoLeads.length),
      detailValue: String(demoLeads.filter((lead) => lead.status === "new").length),
      tone: "blue"
    },
    {
      key: "quotes",
      value: String(demoQuotes.length),
      detailValue: String(
        demoQuotes.filter((quote) => quote.status === "approved").length
      ),
      tone: "green"
    },
    {
      key: "productionOrders",
      value: String(demoProductionOrders.length),
      detailValue: String(
        demoProductionOrders.filter((order) => order.status === "blocked").length
      ),
      tone: pendingArtwork || pendingScreens ? "amber" : "green"
    },
    {
      key: "pendingArtwork",
      value: String(pendingArtwork),
      tone: pendingArtwork ? "red" : "green"
    },
    {
      key: "pendingScreens",
      value: String(pendingScreens),
      tone: pendingScreens ? "amber" : "green"
    },
    {
      key: "inventoryAlerts",
      value: String(inventoryAlerts),
      tone: inventoryAlerts ? "red" : "green"
    },
    {
      key: "todayJobs",
      value: String(todayJobs),
      tone: "blue"
    },
    {
      key: "recentActivity",
      value: String(demoEvents.length),
      tone: "green"
    }
  ];
}

export function getTodayProductionOrders() {
  return demoProductionOrders.filter((order) => order.scheduledDate === "2026-06-15");
}

export function getInventoryAlerts() {
  return demoInventoryItems.filter(
    (item) => item.quantityOnHand - item.reservedQuantity <= item.reorderPoint
  );
}
