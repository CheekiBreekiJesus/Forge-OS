export type ForgeOSAuthRole =
  | "super_admin"
  | "company_owner"
  | "marketing_manager"
  | "outreach_operator"
  | "sales"
  | "owner"
  | "viewer";

export type ForgeOSSession = {
  userId: string;
  tenantId: string;
  roles: ForgeOSAuthRole[];
  source: "supabase" | "test_adapter" | "development_headers";
};

export class ForgeOSAuthError extends Error {
  constructor(
    public readonly code: "unauthenticated" | "unauthorized" | "forbidden" | "auth_not_configured",
    message: string,
    public readonly status: 401 | 403 | 503 = 401
  ) {
    super(message);
    this.name = "ForgeOSAuthError";
  }
}

const ROLE_SET = new Set<string>([
  "super_admin",
  "company_owner",
  "marketing_manager",
  "outreach_operator",
  "sales",
  "owner",
  "viewer"
]);

export function parseRoles(raw: string): ForgeOSAuthRole[] {
  const roles = raw
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);

  if (roles.length === 0 || roles.some((role) => !ROLE_SET.has(role))) {
    throw new ForgeOSAuthError("unauthorized", "Invalid role in session.", 403);
  }

  return roles as ForgeOSAuthRole[];
}

export function requireOutreachPermission(
  session: ForgeOSSession,
  permission: "generate" | "approve" | "deliver"
): void {
  const allowed = new Set<ForgeOSAuthRole>([
    "super_admin",
    "company_owner",
    "marketing_manager",
    "outreach_operator",
    "owner"
  ]);

  if (permission === "deliver") {
    allowed.delete("marketing_manager");
  }

  if (!session.roles.some((role) => allowed.has(role))) {
    throw new ForgeOSAuthError("forbidden", `Missing outreach permission: ${permission}`, 403);
  }
}
