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
  detail: string;
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
      detail: `${demoLeads.filter((lead) => lead.status === "new").length} new`,
      tone: "blue"
    },
    {
      key: "quotes",
      value: String(demoQuotes.length),
      detail: `${demoQuotes.filter((quote) => quote.status === "approved").length} approved`,
      tone: "green"
    },
    {
      key: "productionOrders",
      value: String(demoProductionOrders.length),
      detail: `${demoProductionOrders.filter((order) => order.status === "blocked").length} blocked`,
      tone: pendingArtwork || pendingScreens ? "amber" : "green"
    },
    {
      key: "pendingArtwork",
      value: String(pendingArtwork),
      detail: "Logo/artwork approval",
      tone: pendingArtwork ? "red" : "green"
    },
    {
      key: "pendingScreens",
      value: String(pendingScreens),
      detail: "Screen preparation",
      tone: pendingScreens ? "amber" : "green"
    },
    {
      key: "inventoryAlerts",
      value: String(inventoryAlerts),
      detail: "Below available threshold",
      tone: inventoryAlerts ? "red" : "green"
    },
    {
      key: "todayJobs",
      value: String(todayJobs),
      detail: "Scheduled for 2026-06-15",
      tone: "blue"
    },
    {
      key: "recentActivity",
      value: String(demoEvents.length),
      detail: "n8n-ready demo events",
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
