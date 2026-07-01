import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  DEFAULT_DASHBOARD_PREFERENCES,
  isPanelVisible,
  orderedVisiblePanels,
  restoreDefaultDashboardPreferences,
  writeDashboardPreferences,
  type DashboardPanelKey
} from "@/features/dashboard/preferences";
import {
  getInitialResolvedTheme,
  readStoredThemePreference,
  resolveThemePreference,
  writeStoredThemePreference
} from "@/theme/theme-storage";
import { deriveDashboardKpis, deriveOeeMetrics } from "@/features/dashboard/metrics";
import { matchCopilotPrompt } from "@/features/dashboard/copilot";
import { primaryNavKeys } from "@/modules/config";
import { canViewModule } from "@/features/crud/role-preview";

describe("theme storage", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      }
    });
    vi.stubGlobal("window", {
      localStorage: localStorage,
      dispatchEvent: () => true,
      matchMedia: () => ({
        matches: false,
        addEventListener: () => undefined,
        removeEventListener: () => undefined
      })
    });
  });

  it("defaults to dark theme", () => {
    expect(readStoredThemePreference()).toBe("dark");
    expect(getInitialResolvedTheme()).toBe("dark");
  });

  it("persists explicit light preference", () => {
    writeStoredThemePreference("light");
    expect(readStoredThemePreference()).toBe("light");
    expect(resolveThemePreference("light")).toBe("light");
    writeStoredThemePreference("dark");
  });
});

describe("dashboard preferences", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      localStorage: {
        store: {} as Record<string, string>,
        getItem(key: string) {
          return this.store[key] ?? null;
        },
        setItem(key: string, value: string) {
          this.store[key] = value;
        }
      },
      dispatchEvent: () => true
    });
  });

  it("restores default layout", () => {
    writeDashboardPreferences({
      ...DEFAULT_DASHBOARD_PREFERENCES,
      visiblePanels: ["oee"]
    });
    const restored = restoreDefaultDashboardPreferences();
    expect(restored.visiblePanels).toContain("copilot");
    expect(isPanelVisible(restored, "inventory")).toBe(true);
  });

  it("orders visible panels", () => {
    const prefs = {
      ...DEFAULT_DASHBOARD_PREFERENCES,
      visiblePanels: ["copilot", "oee"] as DashboardPanelKey[]
    };
    expect(orderedVisiblePanels(prefs)).toEqual(["oee", "copilot"]);
  });
});

describe("dashboard metrics", () => {
  it("labels revenue as demo without quotes", () => {
    const kpis = deriveDashboardKpis({
      openQuotations: 2,
      productionOrders: 1,
      outreachReady: 0,
      outreachSent: 0,
      quotes: [],
      orders: [],
      inventory: [],
      locale: "en"
    });
    const revenue = kpis.find((kpi) => kpi.key === "revenue");
    expect(revenue?.isDemo).toBe(true);
  });

  it("marks OEE as demo without production orders", () => {
    expect(deriveOeeMetrics([]).isDemo).toBe(true);
  });
});

describe("navigation and copilot", () => {
  it("includes industrial module map", () => {
    expect(primaryNavKeys).toContain("crm");
    expect(primaryNavKeys).toContain("reports");
  });

  it("matches copilot prompts", () => {
    expect(matchCopilotPrompt("Which molds need maintenance?")).toBe("molds");
    expect(matchCopilotPrompt("quotations awaiting")).toBe("quotations");
  });

  it("allows owner to view preview modules", () => {
    expect(canViewModule("owner", "molds")).toBe(true);
    expect(canViewModule("warehouse_manager", "sales")).toBe(false);
  });
});
