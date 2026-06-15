export const moduleKeys = [
  "dashboard",
  "customers",
  "products",
  "orders",
  "production",
  "inventory",
  "machines",
  "maintenance",
  "marketing",
  "settings"
] as const;

export type ModuleKey = (typeof moduleKeys)[number];

export const moduleRoutes: Record<ModuleKey, string> = {
  dashboard: "",
  customers: "customers",
  products: "products",
  orders: "orders",
  production: "production",
  inventory: "inventory",
  machines: "machines",
  maintenance: "maintenance",
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
