import type { ForgeOSSession, ForgeOSAuthRole } from "./types";
import { ForgeOSAuthError, parseRoles } from "./types";
import { resolvePermissionsForRoles } from "@/lib/auth/permissions";
import {
  resolveMembershipAccessForUser,
  SELECTED_TENANT_COOKIE
} from "@/lib/auth/membership";
import { isSupabaseAuthConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { resolveTenantByKey, resolveTenantUuidByKey } from "@/lib/supabase/tenant";

export function readSelectedTenantIdFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  for (const part of cookieHeader.split(";")) {
    const [name, ...valueParts] = part.trim().split("=");
    if (name === SELECTED_TENANT_COOKIE) {
      const value = decodeURIComponent(valueParts.join("=").trim());
      return value || null;
    }
  }

  return null;
}

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

  return {
    permissions: resolvePermissionsForRoles(roles),
    roles,
    source,
    tenantId,
    userId
  };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function membershipAccessError(
  status: Exclude<Awaited<ReturnType<typeof resolveMembershipAccessForUser>>["status"], "active">
): ForgeOSAuthError {
  const message =
    status === "multiple_active"
      ? "Tenant selection required."
      : status === "pending"
        ? "Membership pending approval."
        : status === "denied"
          ? "Tenant access denied."
          : "No tenant membership.";

  return new ForgeOSAuthError("forbidden", message, 403);
}

async function resolveSupabaseSession(
  request: Request,
  env: Record<string, string | undefined>
): Promise<ForgeOSSession> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    throw new ForgeOSAuthError("unauthenticated", "Authentication required.", 401);
  }

  const configuredTenantKey = env.FORGEOS_ACTIVE_TENANT_KEY?.trim();
  const cookieTenantId = readSelectedTenantIdFromRequest(request);
  let selectedTenantId = cookieTenantId;

  if (configuredTenantKey) {
    const service = createSupabaseServiceClient();
    const tenant = await resolveTenantByKey(service, configuredTenantKey);
    if (!tenant) {
      throw new ForgeOSAuthError("forbidden", "Configured tenant not found.", 403);
    }
    selectedTenantId = tenant.id;
  }

  const access = await resolveMembershipAccessForUser(data.user, selectedTenantId);
  if (access.status !== "active") {
    throw membershipAccessError(access.status);
  }

  if (
    cookieTenantId &&
    !configuredTenantKey &&
    cookieTenantId !== access.context.tenantId
  ) {
    throw new ForgeOSAuthError("forbidden", "Tenant access denied.", 403);
  }

  const roles: ForgeOSAuthRole[] = [...new Set(access.context.roles)];
  if (roles.length === 0) {
    throw new ForgeOSAuthError("forbidden", "Invalid membership role.", 403);
  }

  return {
    membershipId: access.context.membershipId,
    permissions: access.context.permissions,
    userId: access.context.userId,
    tenantId: access.context.tenantId,
    roles,
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
    return resolveSupabaseSession(request, env);
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
