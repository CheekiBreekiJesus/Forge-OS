import { describe, expect, it } from "vitest";
import {
  requireInventoryManagePermission,
  requireInventoryViewPermission,
  requireMobileMovementPermission,
  requireProductManagementPermission
} from "@/features/inventory/auth";
import type { ForgeOSSession } from "@/lib/auth/types";
import { ForgeOSAuthError } from "@/lib/auth/types";

function session(partial: Partial<ForgeOSSession>): ForgeOSSession {
  return {
    permissions: [],
    roles: [],
    source: "test_adapter",
    tenantId: "tenant-a",
    userId: "user-a",
    ...partial
  };
}

describe("inventory auth permissions", () => {
  it("allows inventory view with inventory:view permission", () => {
    expect(() =>
      requireInventoryViewPermission(session({ permissions: ["inventory:view"] }))
    ).not.toThrow();
  });

  it("rejects inventory view without permission", () => {
    expect(() => requireInventoryViewPermission(session({ roles: ["viewer"] }))).toThrow(
      ForgeOSAuthError
    );
  });

  it("allows inventory manage with inventory:manage permission", () => {
    expect(() =>
      requireInventoryManagePermission(session({ permissions: ["inventory:manage"] }))
    ).not.toThrow();
  });

  it("allows product management for products:manage", () => {
    expect(() =>
      requireProductManagementPermission(session({ permissions: ["products:manage"] }))
    ).not.toThrow();
  });

  it("enforces mobile receive permission by role", () => {
    expect(() =>
      requireMobileMovementPermission(session({ roles: ["warehouse_manager"] }), "receive")
    ).not.toThrow();
    expect(() =>
      requireMobileMovementPermission(session({ roles: ["viewer"] }), "receive")
    ).toThrow(ForgeOSAuthError);
  });

  it("allows scan with inventory view permission", () => {
    expect(() =>
      requireMobileMovementPermission(session({ permissions: ["inventory:view"] }), "scan")
    ).not.toThrow();
  });
});
