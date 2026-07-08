import { describe, expect, it, vi } from "vitest";
import {
  PREVIEW_ROLE_STORAGE_KEY,
  canAccessLeadOps,
  canCreateEntity,
  canViewModule,
  filterNavModules,
  isPreviewRole,
  writePreviewRole
} from "@/features/crud/role-preview";
import { moduleKeys } from "@/modules/config";

describe("role preview", () => {
  it("identifies preview roles", () => {
    expect(isPreviewRole("owner")).toBe(true);
    expect(isPreviewRole("invalid")).toBe(false);
  });

  it("filters navigation modules per role", () => {
    const salesModules = filterNavModules("sales", moduleKeys);
    expect(salesModules).toContain("customers");
    expect(salesModules).not.toContain("inventory");
    expect(canAccessLeadOps("sales")).toBe(true);
    expect(canAccessLeadOps("warehouse_manager")).toBe(false);
  });

  it("restricts create actions per role", () => {
    expect(canCreateEntity("warehouse_manager", "inventory")).toBe(true);
    expect(canCreateEntity("warehouse_manager", "lead")).toBe(false);
    expect(canViewModule("production_manager", "machines")).toBe(true);
  });

  it("writes preview role when browser storage is available", () => {
    const storage = new Map<string, string>();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
        removeItem: (key: string) => {
          storage.delete(key);
        }
      }
    });
    writePreviewRole("sales");
    expect(storage.get(PREVIEW_ROLE_STORAGE_KEY)).toBe("sales");
  });
});
