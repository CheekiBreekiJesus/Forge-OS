import type { SupabaseClient } from "@supabase/supabase-js";
import { PersistenceError } from "@/persistence/interfaces";

export type TenantRecord = {
  id: string;
  tenantKey: string;
  slug: string;
  defaultLocale: string;
};

type TenantRow = {
  id: string;
  tenant_key: string;
  slug: string;
  default_locale: string;
};

function mapTenant(row: TenantRow): TenantRecord {
  return {
    id: row.id,
    tenantKey: row.tenant_key,
    slug: row.slug,
    defaultLocale: row.default_locale
  };
}

export async function resolveTenantByKey(
  client: SupabaseClient,
  tenantKey: string
): Promise<TenantRecord | null> {
  const { data, error } = await client
    .from("tenants")
    .select("id, tenant_key, slug, default_locale")
    .eq("tenant_key", tenantKey)
    .maybeSingle();

  if (error) {
    throw new PersistenceError("unavailable", "Tenant lookup failed.");
  }
  return data ? mapTenant(data as TenantRow) : null;
}

export async function resolveTenantUuidByKey(
  client: SupabaseClient,
  tenantKey: string
): Promise<string | null> {
  const tenant = await resolveTenantByKey(client, tenantKey);
  return tenant?.id ?? null;
}

export async function resolveTenantKeyByUuid(
  client: SupabaseClient,
  tenantUuid: string
): Promise<string | null> {
  const { data, error } = await client
    .from("tenants")
    .select("tenant_key")
    .eq("id", tenantUuid)
    .maybeSingle();

  if (error) {
    throw new PersistenceError("unavailable", "Tenant lookup failed.");
  }
  return data?.tenant_key ?? null;
}

export type TenantMembershipRecord = {
  tenantId: string;
  role: string;
  permissions: string[];
  status: string;
};

export async function resolveTenantMembership(
  client: SupabaseClient,
  userId: string,
  tenantUuid: string
): Promise<TenantMembershipRecord | null> {
  const { data, error } = await client
    .from("tenant_memberships")
    .select("tenant_id, role, permissions, status")
    .eq("user_id", userId)
    .eq("tenant_id", tenantUuid)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new PersistenceError("unavailable", "Tenant membership lookup failed.");
  }
  return data ? mapTenantMembershipRow(data) : null;
}

export async function listTenantMemberships(
  client: SupabaseClient,
  userId: string
): Promise<TenantMembershipRecord[]> {
  const { data, error } = await client
    .from("tenant_memberships")
    .select("tenant_id, role, permissions, status")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    throw new PersistenceError("unavailable", "Tenant membership lookup failed.");
  }

  return (data ?? []).map((row) => mapTenantMembershipRow(row));
}

function mapTenantMembershipRow(row: {
  tenant_id?: unknown;
  role?: unknown;
  permissions?: unknown;
  status?: unknown;
}): TenantMembershipRecord {
  return {
    tenantId: String(row.tenant_id),
    role: String(row.role),
    permissions: Array.isArray(row.permissions)
      ? row.permissions.filter((permission): permission is string => typeof permission === "string")
      : [],
    status: String(row.status ?? "active")
  };
}

const ROLE_MAP: Record<string, import("@/lib/auth/types").ForgeOSAuthRole> = {
  super_admin: "super_admin",
  company_owner: "company_owner",
  marketing_manager: "marketing_manager",
  outreach_operator: "outreach_operator",
  sales: "sales",
  owner: "owner",
  viewer: "viewer"
};

export function mapMembershipRoleToForgeOSRole(role: string): import("@/lib/auth/types").ForgeOSAuthRole | null {
  return ROLE_MAP[role] ?? null;
}
