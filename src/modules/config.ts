export const moduleKeys = [
  "dashboard",
  "crm",
  "customers",
  "products",
  "orders",
  "salesOrders",
  "production",
  "inventory",
  "machines",
  "maintenance",
  "molds",
  "quality",
  "purchasing",
  "suppliers",
  "sales",
  "billing",
  "reports",
  "marketing",
  "settings"
] as const;

export type ModuleKey = (typeof moduleKeys)[number];

export const moduleRoutes: Record<ModuleKey, string> = {
  dashboard: "",
  crm: "crm",
  customers: "customers",
  products: "products",
  orders: "quotations",
  salesOrders: "sales-orders",
  production: "production",
  inventory: "inventory",
  machines: "machines",
  maintenance: "maintenance",
  molds: "molds",
  quality: "quality",
  purchasing: "purchasing",
  suppliers: "suppliers",
  sales: "sales",
  billing: "billing",
  reports: "reports",
  marketing: "marketing",
  settings: "settings"
};

/** Primary sidebar navigation order (products omitted from sidebar; reachable via CRM/command palette). */
export const primaryNavKeys: ModuleKey[] = [
  "dashboard",
  "crm",
  "customers",
  "orders",
  "salesOrders",
  "production",
  "inventory",
  "machines",
  "maintenance",
  "molds",
  "quality",
  "purchasing",
  "suppliers",
  "sales",
  "billing",
  "reports",
  "marketing",
  "settings"
];

export const previewModuleKeys = [
  "crm",
  "salesOrders",
  "molds",
  "quality",
  "purchasing",
  "suppliers",
  "sales",
  "billing",
  "reports"
] as const satisfies readonly ModuleKey[];

export type PreviewModuleKey = (typeof previewModuleKeys)[number];

export function isPreviewModuleKey(moduleKey: ModuleKey): moduleKey is PreviewModuleKey {
  return (previewModuleKeys as readonly ModuleKey[]).includes(moduleKey);
}

export const routedModuleKeys = moduleKeys.filter(
  (key) => key !== "dashboard"
) as Exclude<ModuleKey, "dashboard">[];

export function getModuleKeyFromSlug(slug: string): ModuleKey | null {
  const match = moduleKeys.find((key) => moduleRoutes[key] === slug);
  return match ?? null;
}

export function getLocalizedModuleHref(locale: string, moduleKey: ModuleKey) {
  const route = moduleRoutes[moduleKey];
  return route ? `/${locale}/${route}` : `/${locale}`;
}

export const navIcons: Record<ModuleKey, string> = {
  dashboard: "▣",
  crm: "◎",
  customers: "◉",
  products: "▤",
  orders: "▥",
  salesOrders: "▦",
  production: "⚙",
  inventory: "▧",
  machines: "⛭",
  maintenance: "🔧",
  molds: "◫",
  quality: "✓",
  purchasing: "🛒",
  suppliers: "⇄",
  sales: "€",
  billing: "▨",
  reports: "▩",
  marketing: "✦",
  settings: "⚙"
};
