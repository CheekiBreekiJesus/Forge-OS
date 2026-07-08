export const DASHBOARD_PREFS_STORAGE_KEY = "forgeos:dashboard-preferences";

export type DashboardPanelKey =
  | "oee"
  | "inventory"
  | "alerts"
  | "productionOrders"
  | "revenue"
  | "copilot"
  | "marketing"
  | "onboarding";

export type DashboardDensity = "comfortable" | "compact";
export type DashboardDateRange = "today" | "week" | "month";

export type DashboardPreferences = {
  visiblePanels: DashboardPanelKey[];
  panelOrder: DashboardPanelKey[];
  density: DashboardDensity;
  defaultDateRange: DashboardDateRange;
};

export const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
  visiblePanels: ["oee", "inventory", "alerts", "productionOrders"],
  panelOrder: [
    "oee",
    "inventory",
    "alerts",
    "productionOrders",
    "revenue",
    "copilot",
    "marketing",
    "onboarding"
  ],
  density: "compact",
  defaultDateRange: "week"
};

export const ALL_DASHBOARD_PANELS: DashboardPanelKey[] = [
  "oee",
  "inventory",
  "alerts",
  "productionOrders",
  "revenue",
  "copilot",
  "marketing",
  "onboarding"
];

function isPanelKey(value: string): value is DashboardPanelKey {
  return (ALL_DASHBOARD_PANELS as string[]).includes(value);
}

export function readDashboardPreferences(): DashboardPreferences {
  if (typeof window === "undefined") return DEFAULT_DASHBOARD_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(DASHBOARD_PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_DASHBOARD_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<DashboardPreferences>;
    const visiblePanels = Array.isArray(parsed.visiblePanels)
      ? parsed.visiblePanels.filter(isPanelKey)
      : DEFAULT_DASHBOARD_PREFERENCES.visiblePanels;
    const panelOrder = Array.isArray(parsed.panelOrder)
      ? parsed.panelOrder.filter(isPanelKey)
      : DEFAULT_DASHBOARD_PREFERENCES.panelOrder;
    return {
      visiblePanels: visiblePanels.length ? visiblePanels : DEFAULT_DASHBOARD_PREFERENCES.visiblePanels,
      panelOrder: panelOrder.length ? panelOrder : DEFAULT_DASHBOARD_PREFERENCES.panelOrder,
      density:
        parsed.density === "compact" || parsed.density === "comfortable"
          ? parsed.density
          : DEFAULT_DASHBOARD_PREFERENCES.density,
      defaultDateRange:
        parsed.defaultDateRange === "today" ||
        parsed.defaultDateRange === "week" ||
        parsed.defaultDateRange === "month"
          ? parsed.defaultDateRange
          : DEFAULT_DASHBOARD_PREFERENCES.defaultDateRange
    };
  } catch {
    return DEFAULT_DASHBOARD_PREFERENCES;
  }
}

export function writeDashboardPreferences(preferences: DashboardPreferences): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DASHBOARD_PREFS_STORAGE_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent("forgeos:dashboard-preferences-changed"));
}

export function restoreDefaultDashboardPreferences(): DashboardPreferences {
  writeDashboardPreferences(DEFAULT_DASHBOARD_PREFERENCES);
  return DEFAULT_DASHBOARD_PREFERENCES;
}

export function isPanelVisible(
  preferences: DashboardPreferences,
  panel: DashboardPanelKey
): boolean {
  return preferences.visiblePanels.includes(panel);
}

export function orderedVisiblePanels(preferences: DashboardPreferences): DashboardPanelKey[] {
  return preferences.panelOrder.filter((panel) => preferences.visiblePanels.includes(panel));
}
