import type { ForgeOSSession, ForgeOSAuthRole } from "./types";
import { ForgeOSAuthError, parseRoles } from "./types";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import {
  listTenantMemberships,
  mapMembershipRoleToForgeOSRole,
  resolveTenantByKey,
  resolveTenantUuidByKey
} from "@/lib/supabase/tenant";

function readHeader(request: Request, key: string): string {
  return request.headers.get(key)?.trim() ?? "";
}

function isTestAuthEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.FORGEOS_TEST_AUTH_ENABLED === "true" || env.FORGEOS_E2E === "true";
}

function isDevelopmentAuthEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.NODE_ENV !== "production" && env.FORGEOS_ALLOW_DEV_AUTH_HEADERS === "true";
}

async function resolveTestOrDevSession(
  request: Request,
  env: Record<string, string | undefined>,
  source: ForgeOSSession["source"]
): Promise<ForgeOSSession | null> {
  const userId = readHeader(request, "x-forgeos-actor-id") || env.FORGEOS_TEST_USER_ID;
  const tenantRef = readHeader(request, "x-forgeos-tenant-id") || env.FORGEOS_TEST_TENANT_ID;
  const roleHeader = readHeader(request, "x-forgeos-roles") || env.FORGEOS_TEST_ROLES;

  if (!userId || !tenantRef || !roleHeader) return null;

  const roles = parseRoles(roleHeader);
  let tenantId = tenantRef;

  if (isSupabaseAuthConfigured(env) && !isUuid(tenantRef)) {
    const client = createSupabaseServiceClient();
    const resolved = await resolveTenantUuidByKey(client, tenantRef);
    if (!resolved) {
      throw new ForgeOSAuthError("forbidden", "Tenant not found for test session.", 403);
    }
    tenantId = resolved;
  }

  return { userId, tenantId, roles, source };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function resolveSupabaseSession(
  env: Record<string, string | undefined>
): Promise<ForgeOSSession> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new ForgeOSAuthError("unauthenticated", "Authentication required.", 401);
  }

  const service = createSupabaseServiceClient();
  const memberships = await listTenantMemberships(service, data.user.id);
  if (memberships.length === 0) {
    throw new ForgeOSAuthError("forbidden", "No tenant membership.", 403);
  }

  const configuredTenantKey = env.FORGEOS_ACTIVE_TENANT_KEY?.trim();
  let membership = memberships[0];

  if (configuredTenantKey) {
    const tenant = await resolveTenantByKey(service, configuredTenantKey);
    if (!tenant) {
      throw new ForgeOSAuthError("forbidden", "Configured tenant not found.", 403);
    }
    const match = memberships.find((row) => row.tenantId === tenant.id);
    if (!match) {
      throw new ForgeOSAuthError("forbidden", "Tenant access denied.", 403);
    }
    membership = match;
  }

  const mappedRole = mapMembershipRoleToForgeOSRole(membership.role);
  if (!mappedRole) {
    throw new ForgeOSAuthError("forbidden", "Invalid membership role.", 403);
  }

  const roles: ForgeOSAuthRole[] = memberships
    .filter((row) => row.tenantId === membership.tenantId)
    .map((row) => mapMembershipRoleToForgeOSRole(row.role))
    .filter((role): role is ForgeOSAuthRole => role !== null);

  if (roles.length === 0) {
    roles.push(mappedRole);
  }

  return {
    userId: data.user.id,
    tenantId: membership.tenantId,
    roles: [...new Set(roles)],
    source: "supabase"
  };
}

export async function resolveForgeOSSession(
  request: Request,
  env: Record<string, string | undefined> = process.env
): Promise<ForgeOSSession> {
  if (env.NODE_ENV === "production" && !isSupabaseAuthConfigured(env)) {
    throw new ForgeOSAuthError(
      "auth_not_configured",
      "Production authentication is not configured.",
      503
    );
  }

  if (isTestAuthEnabled(env)) {
    const testSession = await resolveTestOrDevSession(request, env, "test_adapter");
    if (testSession) return testSession;
  }

  if (isDevelopmentAuthEnabled(env)) {
    const devSession = await resolveTestOrDevSession(request, env, "development_headers");
    if (devSession) return devSession;
  }

  if (isSupabaseAuthConfigured(env)) {
    return resolveSupabaseSession(env);
  }

  if (env.NODE_ENV === "production") {
    throw new ForgeOSAuthError("unauthenticated", "Authentication required.", 401);
  }

  throw new ForgeOSAuthError(
    "unauthenticated",
    "No session resolved. Enable FORGEOS_TEST_AUTH_ENABLED or dev auth headers.",
    401
  );
}

export function assertTenantAccess(session: ForgeOSSession, tenantId: string): void {
  if (session.tenantId !== tenantId) {
    throw new ForgeOSAuthError("forbidden", "Tenant access denied.", 403);
  }
}
