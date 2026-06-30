"use client";

import type { ModuleKey } from "@/modules/config";

export const PREVIEW_ROLE_STORAGE_KEY = "forgeos:preview-role";

export type PreviewRole = "owner" | "sales" | "production_manager" | "warehouse_manager";

export const PREVIEW_ROLES: PreviewRole[] = [
  "owner",
  "sales",
  "production_manager",
  "warehouse_manager"
];

const ROLE_MODULES: Record<PreviewRole, ModuleKey[]> = {
  owner: [
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
  ],
  sales: ["dashboard", "customers", "products", "orders", "marketing", "settings"],
  production_manager: ["dashboard", "products", "orders", "production", "machines", "settings"],
  warehouse_manager: ["dashboard", "products", "inventory", "machines", "settings"]
};

const ROLE_CREATE_ACTIONS: Record<PreviewRole, string[]> = {
  owner: ["lead", "customer", "product", "quote", "customizer", "production", "machine", "inventory"],
  sales: ["lead", "customer", "quote", "customizer"],
  production_manager: ["quote", "production", "machine"],
  warehouse_manager: ["inventory", "machine"]
};

export function isPreviewRole(value: string | null | undefined): value is PreviewRole {
  return PREVIEW_ROLES.includes(value as PreviewRole);
}

export function readPreviewRole(): PreviewRole {
  if (typeof window === "undefined") return "owner";
  const stored = window.localStorage.getItem(PREVIEW_ROLE_STORAGE_KEY);
  return isPreviewRole(stored) ? stored : "owner";
}

export function writePreviewRole(role: PreviewRole): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREVIEW_ROLE_STORAGE_KEY, role);
}

export function canViewModule(role: PreviewRole, moduleKey: ModuleKey): boolean {
  return ROLE_MODULES[role].includes(moduleKey);
}

export function canCreateEntity(role: PreviewRole, entity: string): boolean {
  return ROLE_CREATE_ACTIONS[role].includes(entity);
}

export function filterNavModules(role: PreviewRole, moduleKeys: readonly ModuleKey[]): ModuleKey[] {
  return moduleKeys.filter((key) => canViewModule(role, key));
}

export function canAccessLeadOps(role: PreviewRole): boolean {
  return role === "owner" || role === "sales";
}
