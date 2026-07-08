export const forgeOSRoles = [
  "super_admin",
  "company_owner",
  "production_manager",
  "warehouse_manager",
  "maintenance_technician",
  "machine_operator",
  "sales_representative",
  "marketing_manager",
  "accountant",
  "customer_portal_user",
  "supplier_portal_user",
  "outreach_operator",
  "sales",
  "owner",
  "viewer"
] as const;

export type ForgeOSAuthRole = (typeof forgeOSRoles)[number];

export type ForgeOSPermission =
  | "app:access"
  | "tenant:select"
  | "settings:view"
  | "settings:manage"
  | "crm:view"
  | "crm:manage"
  | "customers:view"
  | "customers:manage"
  | "products:view"
  | "products:manage"
  | "orders:view"
  | "orders:manage"
  | "production:view"
  | "production:manage"
  | "inventory:view"
  | "inventory:manage"
  | "machines:view"
  | "machines:manage"
  | "maintenance:view"
  | "maintenance:manage"
  | "marketing:view"
  | "marketing:manage"
  | "leadops:view"
  | "leadops:manage"
  | "send_job:view"
  | "send_job:view_errors"
  | "send_job:prepare"
  | "send_job:queue"
  | "send_job:process"
  | "send_job:pause"
  | "send_job:resume"
  | "send_job:cancel"
  | "send_job:retry";

const allPermissions: ForgeOSPermission[] = [
  "app:access",
  "tenant:select",
  "settings:view",
  "settings:manage",
  "crm:view",
  "crm:manage",
  "customers:view",
  "customers:manage",
  "products:view",
  "products:manage",
  "orders:view",
  "orders:manage",
  "production:view",
  "production:manage",
  "inventory:view",
  "inventory:manage",
  "machines:view",
  "machines:manage",
  "maintenance:view",
  "maintenance:manage",
  "marketing:view",
  "marketing:manage",
  "leadops:view",
  "leadops:manage",
  "send_job:view",
  "send_job:view_errors",
  "send_job:prepare",
  "send_job:queue",
  "send_job:process",
  "send_job:pause",
  "send_job:resume",
  "send_job:cancel",
  "send_job:retry"
];

const sendJobOperatorPermissions: ForgeOSPermission[] = [
  "send_job:view",
  "send_job:prepare",
  "send_job:queue",
  "send_job:process",
  "send_job:pause",
  "send_job:resume",
  "send_job:cancel",
  "send_job:retry"
];

const rolePermissions: Record<ForgeOSAuthRole, ForgeOSPermission[]> = {
  super_admin: allPermissions,
  company_owner: allPermissions,
  owner: allPermissions,
  production_manager: [
    "app:access",
    "orders:view",
    "production:view",
    "production:manage",
    "machines:view",
    "maintenance:view",
    "inventory:view"
  ],
  warehouse_manager: ["app:access", "inventory:view", "inventory:manage", "products:view"],
  maintenance_technician: ["app:access", "machines:view", "maintenance:view", "maintenance:manage"],
  machine_operator: ["app:access", "production:view", "machines:view", "inventory:view"],
  sales_representative: [
    "app:access",
    "crm:view",
    "crm:manage",
    "customers:view",
    "customers:manage",
    "orders:view",
    "orders:manage",
    "products:view"
  ],
  sales: [
    "app:access",
    "crm:view",
    "customers:view",
    "orders:view",
    "send_job:view",
    "send_job:queue",
    "send_job:process",
    "send_job:pause",
    "send_job:resume"
  ],
  marketing_manager: [
    "app:access",
    "marketing:view",
    "marketing:manage",
    "leadops:view",
    "leadops:manage",
    ...sendJobOperatorPermissions,
    "send_job:view_errors"
  ],
  outreach_operator: ["app:access", "marketing:view", "leadops:view", ...sendJobOperatorPermissions],
  accountant: ["app:access", "orders:view", "customers:view", "products:view"],
  customer_portal_user: ["app:access", "orders:view"],
  supplier_portal_user: ["app:access", "inventory:view"],
  viewer: ["app:access", "crm:view", "customers:view", "products:view", "orders:view"]
};

const roleSet = new Set<string>(forgeOSRoles);
const permissionSet = new Set<string>(allPermissions);

export function isForgeOSRole(value: string): value is ForgeOSAuthRole {
  return roleSet.has(value);
}

export function isForgeOSPermission(value: string): value is ForgeOSPermission {
  return permissionSet.has(value);
}

export function parseForgeOSRoles(raw: string): ForgeOSAuthRole[] {
  const roles = raw
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);

  if (roles.length === 0 || roles.some((role) => !isForgeOSRole(role))) {
    return [];
  }

  return [...new Set(roles)] as ForgeOSAuthRole[];
}

export function resolvePermissionsForRoles(
  roles: ForgeOSAuthRole[],
  explicitPermissions: string[] = []
): ForgeOSPermission[] {
  const resolved = new Set<ForgeOSPermission>();

  for (const role of roles) {
    for (const permission of rolePermissions[role] ?? []) {
      resolved.add(permission);
    }
  }

  for (const permission of explicitPermissions) {
    if (isForgeOSPermission(permission)) {
      resolved.add(permission);
    }
  }

  return [...resolved].sort();
}
