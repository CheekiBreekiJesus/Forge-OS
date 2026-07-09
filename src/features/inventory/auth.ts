import type { ForgeOSSession } from "@/lib/auth/types";
import { ForgeOSAuthError } from "@/lib/auth/types";

export function requireInventoryViewPermission(session: ForgeOSSession): void {
  const allowed = session.permissions ?? [];
  if (allowed.includes("inventory:view") || allowed.includes("inventory:manage")) {
    return;
  }
  const roleAllowed = session.roles.some((role) =>
    ["super_admin", "company_owner", "owner", "warehouse_manager", "production_manager", "machine_operator"].includes(
      role
    )
  );
  if (roleAllowed) return;
  throw new ForgeOSAuthError("forbidden", "Missing inventory view permission.", 403);
}

export function requireInventoryManagePermission(session: ForgeOSSession): void {
  const allowed = session.permissions ?? [];
  if (allowed.includes("inventory:manage")) {
    return;
  }
  const roleAllowed = session.roles.some((role) =>
    ["super_admin", "company_owner", "owner", "warehouse_manager"].includes(role)
  );
  if (roleAllowed) return;
  throw new ForgeOSAuthError("forbidden", "Missing inventory management permission.", 403);
}

export function requireProductManagementPermission(session: ForgeOSSession): void {
  const allowed = session.permissions ?? [];
  if (allowed.includes("products:manage") || allowed.includes("inventory:manage")) {
    return;
  }
  const roleAllowed = session.roles.some((role) =>
    ["super_admin", "company_owner", "owner", "warehouse_manager"].includes(role)
  );
  if (roleAllowed) return;
  throw new ForgeOSAuthError("forbidden", "Missing product management permission.", 403);
}

export type MobileMovementPermission = "receive" | "issue" | "transfer" | "scan";

export function requireMobileMovementPermission(
  session: ForgeOSSession,
  action: MobileMovementPermission
): void {
  requireInventoryViewPermission(session);
  if (action === "scan") return;

  const allowed = session.permissions ?? [];
  if (allowed.includes("inventory:manage")) return;

  const receiveRoles = ["warehouse_manager", "machine_operator", "company_owner", "owner", "super_admin"];
  const issueRoles = ["warehouse_manager", "machine_operator", "company_owner", "owner", "super_admin"];
  const transferRoles = ["warehouse_manager", "machine_operator", "company_owner", "owner", "super_admin"];

  const roles = session.roles;
  if (action === "receive" && roles.some((role) => receiveRoles.includes(role))) return;
  if (action === "issue" && roles.some((role) => issueRoles.includes(role))) return;
  if (action === "transfer" && roles.some((role) => transferRoles.includes(role))) return;

  throw new ForgeOSAuthError("forbidden", `Missing permission for mobile ${action}.`, 403);
}
