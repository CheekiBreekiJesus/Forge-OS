import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { defaultLocale, isSupportedLocale, type Locale } from "@/i18n/config";
import { sanitizeAuthRedirect, sanitizeInternalRedirect } from "@/lib/auth/safe-redirect";
import {
  resolvePermissionsForRoles,
  type ForgeOSAuthRole,
  type ForgeOSPermission
} from "@/lib/auth/permissions";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import {
  listTenantMembershipsForUser,
  mapMembershipRoleToForgeOSRole,
  type TenantMembershipRecord
} from "@/lib/supabase/tenant";

export const SELECTED_TENANT_COOKIE = "forgeos.selected_tenant_id";

export type ForgeOSMembershipStatus = "pending" | "active" | "suspended" | "revoked";

export type TrustedTenantMembership = {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string | null;
  tenantKey: string | null;
  status: ForgeOSMembershipStatus;
  roles: ForgeOSAuthRole[];
  permissions: ForgeOSPermission[];
};

export type TrustedAuthContext = {
  correlationId: string;
  membershipId: string;
  permissions: ForgeOSPermission[];
  roles: ForgeOSAuthRole[];
  tenantId: string;
  userId: string;
};

export type MembershipAccessResult =
  | { status: "active"; context: TrustedAuthContext; memberships: TrustedTenantMembership[] }
  | { status: "multiple_active"; memberships: TrustedTenantMembership[] }
  | { status: "pending"; memberships: TrustedTenantMembership[] }
  | { status: "denied"; memberships: TrustedTenantMembership[] }
  | { status: "missing"; memberships: TrustedTenantMembership[] };

export type PersistenceMode = "local" | "supabase";

type MembershipDependencies = {
  createServiceClient?: () => SupabaseClient;
  listMemberships?: (client: SupabaseClient, userId: string) => Promise<TenantMembershipRecord[]>;
  randomUUID?: () => string;
};

export function getForgeOSPersistenceMode(
  env: Record<string, string | undefined> = process.env
): PersistenceMode {
  return env.FORGEOS_PERSISTENCE_MODE?.trim().toLowerCase() === "supabase" ||
    env.NEXT_PUBLIC_FORGEOS_PERSISTENCE_MODE?.trim().toLowerCase() === "supabase"
    ? "supabase"
    : "local";
}

export function selectedTenantCookieOptions(env: Record<string, string | undefined> = process.env) {
  return {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    sameSite: "lax" as const,
    secure: env.NODE_ENV === "production"
  };
}

export async function resolveMembershipAccessForUser(
  user: Pick<User, "id">,
  selectedTenantId?: string | null,
  deps: MembershipDependencies = {}
): Promise<MembershipAccessResult> {
  const service = (deps.createServiceClient ?? createSupabaseServiceClient)();
  const rows = await (deps.listMemberships ?? defaultListMemberships)(service, user.id);
  const memberships = rows.map(normalizeMembership).filter(Boolean) as TrustedTenantMembership[];
  const activeMemberships = memberships.filter((membership) => membership.status === "active");

  if (activeMemberships.length === 0) {
    if (memberships.some((membership) => membership.status === "pending")) {
      return { memberships, status: "pending" };
    }

    if (
      memberships.some(
        (membership) => membership.status === "suspended" || membership.status === "revoked"
      )
    ) {
      return { memberships, status: "denied" };
    }

    return { memberships, status: "missing" };
  }

  const selected = selectedTenantId
    ? activeMemberships.find((membership) => membership.tenantId === selectedTenantId)
    : null;

  if (selected) {
    return {
      context: buildAuthContext(user.id, selected, deps.randomUUID),
      memberships,
      status: "active"
    };
  }

  if (activeMemberships.length === 1) {
    return {
      context: buildAuthContext(user.id, activeMemberships[0]!, deps.randomUUID),
      memberships,
      status: "active"
    };
  }

  return { memberships: activeMemberships, status: "multiple_active" };
}

export function membershipAccessPath(
  locale: Locale,
  access: Exclude<MembershipAccessResult["status"], "active">,
  nextPath = `/${locale}`
): string {
  const safeNext = sanitizeAuthRedirect(nextPath, `/${locale}`);
  const params = new URLSearchParams({ next: safeNext });
  const page =
    access === "multiple_active"
      ? "tenants"
      : access === "denied"
        ? "denied"
        : "pending";
  return `/${locale}/access/${page}?${params.toString()}`;
}

export function loginRedirectPath(locale: Locale, nextPath: string): string {
  const safeNext = sanitizeAuthRedirect(nextPath, `/${locale}`);
  const params = new URLSearchParams({ next: safeNext });
  return `/${locale}/login?${params.toString()}`;
}

export function localeFromPathname(pathname: string): Locale {
  const firstSegment = pathname.split("/").filter(Boolean)[0] ?? "";
  return isSupportedLocale(firstSegment) ? firstSegment : defaultLocale;
}

export async function requireActiveMembershipForPage(
  locale: Locale,
  currentPath: string
): Promise<TrustedAuthContext | null> {
  if (getForgeOSPersistenceMode() !== "supabase") return null;
  const cookieStore = await cookies();
  const selectedTenantId = cookieStore.get(SELECTED_TENANT_COOKIE)?.value ?? null;

  const { createSupabaseServerClient } = await import("@/lib/supabase/server-client");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  const safeCurrentPath = sanitizeInternalRedirect(currentPath, `/${locale}`);

  if (error || !data.user) {
    redirect(loginRedirectPath(locale, safeCurrentPath));
  }

  const result = await resolveMembershipAccessForUser(data.user, selectedTenantId);
  if (result.status === "active") {
    return result.context;
  }

  redirect(membershipAccessPath(locale, result.status, safeCurrentPath));
}

function defaultListMemberships(
  client: SupabaseClient,
  userId: string
): Promise<TenantMembershipRecord[]> {
  return listTenantMembershipsForUser(client, userId);
}

function normalizeMembership(row: TenantMembershipRecord): TrustedTenantMembership | null {
  const status = normalizeStatus(row.status);
  if (!status) return null;

  const role = mapMembershipRoleToForgeOSRole(row.role);
  if (!role) return null;

  const roles: ForgeOSAuthRole[] = [role];
  return {
    id: row.id,
    permissions: resolvePermissionsForRoles(roles, row.permissions),
    roles,
    status,
    tenantId: row.tenantId,
    tenantKey: row.tenantKey,
    tenantName: row.tenantName ?? row.tenantKey ?? row.tenantSlug ?? "ForgeOS tenant",
    tenantSlug: row.tenantSlug
  };
}

function normalizeStatus(status: string): ForgeOSMembershipStatus | null {
  return status === "pending" ||
    status === "active" ||
    status === "suspended" ||
    status === "revoked"
    ? status
    : null;
}

function buildAuthContext(
  userId: string,
  membership: TrustedTenantMembership,
  randomUUID: MembershipDependencies["randomUUID"] = crypto.randomUUID
): TrustedAuthContext {
  return {
    correlationId: randomUUID(),
    membershipId: membership.id,
    permissions: membership.permissions,
    roles: membership.roles,
    tenantId: membership.tenantId,
    userId
  };
}
