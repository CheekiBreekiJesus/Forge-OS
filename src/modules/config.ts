export const moduleKeys = [
  "dashboard",
  "crm",
  "customers",
  "products",
  "orders",
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
