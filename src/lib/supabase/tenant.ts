import type { SupabaseClient } from "@supabase/supabase-js";
import { PersistenceError } from "@/persistence/interfaces";
import { isForgeOSRole } from "@/lib/auth/permissions";

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
  id: string;
  tenantId: string;
  tenantName: string | null;
  tenantSlug: string | null;
  tenantKey: string | null;
  role: string;
  permissions: string[];
  status: "pending" | "active" | "suspended" | "revoked" | string;
  createdAt: string | null;
  updatedAt: string | null;
};

export async function resolveTenantMembership(
  client: SupabaseClient,
  userId: string,
  tenantUuid: string
): Promise<TenantMembershipRecord | null> {
  const { data, error } = await client
    .from("tenant_memberships")
    .select("id, tenant_id, role, permissions, status, created_at, updated_at")
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
  return listTenantMembershipsForUser(client, userId, { activeOnly: true });
}

export async function listTenantMembershipsForUser(
  client: SupabaseClient,
  userId: string,
  options: { activeOnly?: boolean } = {}
): Promise<TenantMembershipRecord[]> {
  let query = client
    .from("tenant_memberships")
    .select(
      "id, tenant_id, role, permissions, status, created_at, updated_at, tenants(name, slug, tenant_key)"
    )
    .eq("user_id", userId);

  if (options.activeOnly) {
    query = query.eq("status", "active");
  }

  const { data, error } = await query;

  if (error) {
    throw new PersistenceError("unavailable", "Tenant membership lookup failed.");
  }

  return (data ?? []).map((row) => mapTenantMembershipRow(row));
}

function mapTenantMembershipRow(row: {
  id?: unknown;
  tenant_id?: unknown;
  tenants?: unknown;
  role?: unknown;
  permissions?: unknown;
  status?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
}): TenantMembershipRecord {
  const tenant = Array.isArray(row.tenants) ? row.tenants[0] : row.tenants;
  const tenantRecord =
    tenant && typeof tenant === "object" ? (tenant as Record<string, unknown>) : {};

  return {
    id: String(row.id ?? ""),
    tenantId: String(row.tenant_id),
    tenantKey: typeof tenantRecord.tenant_key === "string" ? tenantRecord.tenant_key : null,
    tenantName: typeof tenantRecord.name === "string" ? tenantRecord.name : null,
    tenantSlug: typeof tenantRecord.slug === "string" ? tenantRecord.slug : null,
    role: String(row.role),
    permissions: Array.isArray(row.permissions)
      ? row.permissions.filter((permission): permission is string => typeof permission === "string")
      : [],
    status: String(row.status ?? "active"),
    createdAt: typeof row.created_at === "string" ? row.created_at : null,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : null
  };
}

export function mapMembershipRoleToForgeOSRole(role: string): import("@/lib/auth/types").ForgeOSAuthRole | null {
  return isForgeOSRole(role) ? role : null;
}
