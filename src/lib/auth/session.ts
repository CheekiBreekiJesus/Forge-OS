import type { ForgeOSSession } from "./types";
import { ForgeOSAuthError, parseRoles } from "./types";

function readHeader(request: Request, key: string): string {
  return request.headers.get(key)?.trim() ?? "";
}

function isTestAuthEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.FORGEOS_TEST_AUTH_ENABLED === "true" || env.FORGEOS_E2E === "true";
}

function isDevelopmentAuthEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.NODE_ENV !== "production" && env.FORGEOS_ALLOW_DEV_AUTH_HEADERS === "true";
}

export async function resolveForgeOSSession(
  request: Request,
  env: Record<string, string | undefined> = process.env
): Promise<ForgeOSSession> {
  if (env.NODE_ENV === "production" && !env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new ForgeOSAuthError(
      "auth_not_configured",
      "Production authentication is not configured.",
      503
    );
  }

  if (isTestAuthEnabled(env) || isDevelopmentAuthEnabled(env)) {
    const userId = readHeader(request, "x-forgeos-actor-id") || env.FORGEOS_TEST_USER_ID;
    const tenantId = readHeader(request, "x-forgeos-tenant-id") || env.FORGEOS_TEST_TENANT_ID;
    const roleHeader = readHeader(request, "x-forgeos-roles") || env.FORGEOS_TEST_ROLES;

    if (userId && tenantId && roleHeader) {
      return {
        userId,
        tenantId,
        roles: parseRoles(roleHeader),
        source: isTestAuthEnabled(env) ? "test_adapter" : "development_headers"
      };
    }
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
