import type { ForgeOSSession } from "@/lib/auth/types";
import { ForgeOSAuthError } from "@/lib/auth/types";

export function requireProductImportPermission(session: ForgeOSSession): void {
  const allowed = session.permissions ?? [];
  if (allowed.includes("products:manage") || allowed.includes("inventory:manage")) {
    return;
  }

  const roleAllowed = session.roles.some((role) =>
    ["super_admin", "company_owner", "owner", "warehouse_manager"].includes(role)
  );
  if (roleAllowed) return;

  throw new ForgeOSAuthError(
    "forbidden",
    "Missing product or inventory management permission.",
    403
  );
}
