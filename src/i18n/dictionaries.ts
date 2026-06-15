import type { Locale } from "./config";
import type { ModuleKey } from "@/modules/config";
import type { DashboardCardKey } from "@/demo/dashboard";
import type { ProductCategory } from "@/demo/types";

const dictionaries = {
  "pt-PT": () => import("./locales/pt-PT").then((module) => module.dictionary),
  en: () => import("./locales/en").then((module) => module.dictionary)
} satisfies Record<Locale, () => Promise<Dictionary>>;

export type Dictionary = {
  app: {
    name: string;
    tenantLabel: string;
    environment: string;
  };
  navigation: {
    dashboard: string;
    customers: string;
    products: string;
    orders: string;
    production: string;
    inventory: string;
    machines: string;
    maintenance: string;
    marketing: string;
    settings: string;
  };
  dashboard: {
    searchPlaceholder: string;
    searchShortcut: string;
    dateRange: string;
    customize: string;
    greeting: string;
    userRole: string;
    eyebrow: string;
    title: string;
    description: string;
    primaryAction: string;
    secondaryAction: string;
    operationalSnapshot: string;
    modulesTitle: string;
    nextStepsTitle: string;
    languageLabel: string;
    status: {
      prototype: string;
      foundation: string;
      planned: string;
      online: string;
      operational: string;
      production: string;
    };
    metrics: Array<{
      label: string;
      value: string;
      detail: string;
      trend: string;
      tone: "green" | "blue" | "amber" | "red";
    }>;
    demoCards: Record<DashboardCardKey, string>;
    demoSections: {
      todayJobs: string;
      inventoryAlerts: string;
      productCatalog: string;
      recentActivity: string;
      viewCatalog: string;
      noAlerts: string;
    };
    production: {
      title: string;
      score: string;
      availability: string;
      performance: string;
      quality: string;
      days: string[];
    };
    inventory: {
      title: string;
      viewAll: string;
      items: Array<{
        name: string;
        category: string;
        quantity: string;
        minimum: string;
        tone: "green" | "amber" | "red";
      }>;
    };
    activity: {
      title: string;
      viewAll: string;
      items: Array<{
        title: string;
        detail: string;
        time: string;
        priority: string;
        tone: "green" | "amber" | "red";
      }>;
    };
    orders: {
      title: string;
      viewAll: string;
      headers: {
        order: string;
        product: string;
        quantity: string;
        progress: string;
        delivery: string;
      };
      rows: Array<{
        order: string;
        product: string;
        quantity: string;
        progress: string;
        delivery: string;
        tone: "green" | "amber" | "red";
      }>;
    };
    copilot: {
      title: string;
      badge: string;
      prompt: string;
      answer: string;
      input: string;
    };
    modules: Array<{
      key: ModuleKey;
      title: string;
      description: string;
      status: string;
    }>;
    nextSteps: string[];
    footer: {
      version: string;
      copyright: string;
      system: string;
      database: string;
      backup: string;
      environment: string;
      support: string;
    };
  };
  modulePage: {
    backToDashboard: string;
    prototypeNotice: string;
    primaryAction: string;
    secondaryAction: string;
    readinessTitle: string;
    roadmapTitle: string;
    emptyStateTitle: string;
    emptyStateDescription: string;
    tableHeaders: {
      area: string;
      priority: string;
      status: string;
      owner: string;
    };
    modules: Record<
      Exclude<ModuleKey, "dashboard">,
      {
        eyebrow: string;
        title: string;
        description: string;
        stats: Array<{
          label: string;
          value: string;
          detail: string;
        }>;
        roadmap: string[];
        tableRows: Array<{
          area: string;
          priority: string;
          status: string;
          owner: string;
        }>;
      }
    >;
  };
  productCatalog: {
    eyebrow: string;
    title: string;
    description: string;
    sourceNotice: string;
    fieldsTitle: string;
    categories: Record<ProductCategory, string>;
    fields: {
      sku: string;
      category: string;
      image: string;
      material: string;
      capacity: string;
      color: string;
      unitsPerBox: string;
      stacksPerBox: string;
      unitsPerStack: string;
      compatible: string;
      basePrice: string;
      personalization: string;
      printArea: string;
      setupCost: string;
      screenCost: string;
      leadTime: string;
      sourceUrl: string;
    };
    yes: string;
    no: string;
    days: string;
  };
};

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
