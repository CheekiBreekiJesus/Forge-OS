import { assertServerOnlyModule } from "./server-only";
import {
  SendJobActorContextError,
  type SendJobRole,
  type TrustedSendJobActorContext,
  type TrustedSendJobTenantMembership,
  type TrustedSendJobTenantMembershipList
} from "./send-job-actor-types";

export type {
  SendJobRole,
  TrustedSendJobActorContext,
  TrustedSendJobTenantMembership,
  TrustedSendJobTenantMembershipList
} from "./send-job-actor-types";
export { SendJobActorContextError } from "./send-job-actor-types";

assertServerOnlyModule();

const ROLE_VALUES: SendJobRole[] = [
  "super_admin",
  "company_owner",
  "marketing_manager",
  "outreach_operator",
  "sales",
  "owner",
  "viewer"
];

const ROLE_SET = new Set<string>(ROLE_VALUES);

type AuthConfig = {
  anonKey: string;
  serviceRoleKey: string;
  supabaseUrl: string;
};

type SupabaseUserResponse = {
  id?: unknown;
};

type TenantMembershipRow = {
  tenant_id?: unknown;
  role?: unknown;
  permissions?: unknown;
  status?: unknown;
};

export async function resolveTrustedSendJobActorContext(
  request: Request,
  env: Record<string, string | undefined> = process.env,
  fetcher: typeof fetch = fetch
): Promise<TrustedSendJobActorContext> {
  if (env.NODE_ENV === "production") {
    return resolveProductionActorContext(request, env, fetcher);
  }

  const userId = readHeader(request, "x-forgeos-actor-id");
  const tenantId = readHeader(request, "x-forgeos-tenant-id");
  const roleHeader = readHeader(request, "x-forgeos-roles");
  const correlationId = readHeader(request, "x-forgeos-correlation-id") || crypto.randomUUID();

  if (!userId || !tenantId || !roleHeader) {
    throw new SendJobActorContextError(
      "authentication_required",
      "Trusted actor headers are required in development and test."
    );
  }

  const roles = roleHeader
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);

  if (roles.length === 0 || roles.some((role) => !ROLE_SET.has(role))) {
    throw new SendJobActorContextError("invalid_actor_context", "Trusted actor role is invalid.");
  }

  return {
    correlationId,
    permissions: [],
    roles: roles as SendJobRole[],
    source: "development_headers",
    tenantId,
    userId
  };
}

export async function resolveTrustedSendJobTenantMemberships(
  request: Request,
  env: Record<string, string | undefined> = process.env,
  fetcher: typeof fetch = fetch
): Promise<TrustedSendJobTenantMembershipList> {
  if (env.NODE_ENV === "production") {
    return resolveProductionTenantMemberships(request, env, fetcher);
  }

  const actor = await resolveTrustedSendJobActorContext(request, env, fetcher);
  return {
    correlationId: actor.correlationId,
    memberships: [
      {
        permissions: actor.permissions,
        roles: actor.roles,
        tenantId: actor.tenantId
      }
    ],
    source: actor.source,
    userId: actor.userId
  };
}

function readHeader(request: Request, key: string): string {
  return request.headers.get(key)?.trim() ?? "";
}

async function resolveProductionActorContext(
  request: Request,
  env: Record<string, string | undefined>,
  fetcher: typeof fetch
): Promise<TrustedSendJobActorContext> {
  const config = readProductionAuthConfig(env);
  if (!config) {
    throw new SendJobActorContextError(
      "production_auth_not_configured",
      "Production send-job auth adapter is not configured."
    );
  }

  const accessToken = readBearerToken(request);
  if (!accessToken) {
    throw new SendJobActorContextError("authentication_required", "Authenticated session is required.");
  }

  const userId = await fetchSupabaseUserId(config, accessToken, fetcher);
  if (!userId) {
    throw new SendJobActorContextError("authentication_required", "Authenticated session is invalid.");
  }

  const memberships = await fetchActiveMemberships(config, userId, fetcher);
  if (memberships.length === 0) {
    throw new SendJobActorContextError(
      "tenant_membership_required",
      "Active tenant membership is required."
    );
  }
  const selectedTenantId = readHeader(request, "x-forgeos-selected-tenant-id");
  if (memberships.length > 1 && !selectedTenantId) {
    throw new SendJobActorContextError(
      "tenant_selection_required",
      "Multiple active tenant memberships require a trusted tenant selector."
    );
  }

  const membership = selectedTenantId
    ? memberships.find((row) => row.tenantId === selectedTenantId)
    : memberships[0];
  if (!membership) {
    throw new SendJobActorContextError(
      "tenant_membership_required",
      "Selected tenant membership is not active for this user."
    );
  }

  return {
    correlationId: crypto.randomUUID(),
    permissions: membership.permissions,
    roles: membership.roles,
    source: "production_session",
    tenantId: membership.tenantId,
    userId
  };
}

async function resolveProductionTenantMemberships(
  request: Request,
  env: Record<string, string | undefined>,
  fetcher: typeof fetch
): Promise<TrustedSendJobTenantMembershipList> {
  const config = readProductionAuthConfig(env);
  if (!config) {
    throw new SendJobActorContextError(
      "production_auth_not_configured",
      "Production send-job auth adapter is not configured."
    );
  }

  const accessToken = readBearerToken(request);
  if (!accessToken) {
    throw new SendJobActorContextError("authentication_required", "Authenticated session is required.");
  }

  const userId = await fetchSupabaseUserId(config, accessToken, fetcher);
  if (!userId) {
    throw new SendJobActorContextError("authentication_required", "Authenticated session is invalid.");
  }

  const memberships = await fetchActiveMemberships(config, userId, fetcher);
  if (memberships.length === 0) {
    throw new SendJobActorContextError(
      "tenant_membership_required",
      "Active tenant membership is required."
    );
  }

  return {
    correlationId: crypto.randomUUID(),
    memberships,
    source: "production_session",
    userId
  };
}

function readProductionAuthConfig(env: Record<string, string | undefined>): AuthConfig | null {
  const supabaseUrl = (env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/$/, "");
  const anonKey = (
    env.SUPABASE_ANON_KEY ??
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    env.SUPABASE_PUBLISHABLE_KEY ??
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    ""
  ).trim();
  const serviceRoleKey = (env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return null;
  return { anonKey, serviceRoleKey, supabaseUrl };
}

function readBearerToken(request: Request): string {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  return match?.[1]?.trim() ?? "";
}

async function fetchSupabaseUserId(
  config: AuthConfig,
  accessToken: string,
  fetcher: typeof fetch
): Promise<string> {
  const response = await fetcher(`${config.supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: config.anonKey,
      authorization: `Bearer ${accessToken}`
    },
    method: "GET"
  });
  if (!response.ok) return "";
  const payload = (await response.json().catch(() => null)) as SupabaseUserResponse | null;
  return typeof payload?.id === "string" ? payload.id : "";
}

async function fetchActiveMemberships(
  config: AuthConfig,
  userId: string,
  fetcher: typeof fetch
): Promise<TrustedSendJobTenantMembership[]> {
  const params = new URLSearchParams({
    select: "tenant_id,role,permissions,status",
    status: "eq.active",
    user_id: `eq.${userId}`
  });
  const response = await fetcher(`${config.supabaseUrl}/rest/v1/tenant_memberships?${params}`, {
    headers: {
      apikey: config.serviceRoleKey,
      authorization: `Bearer ${config.serviceRoleKey}`
    },
    method: "GET"
  });
  if (!response.ok) return [];
  const payload = (await response.json().catch(() => null)) as unknown;
  if (!Array.isArray(payload)) return [];
  return payload
    .map(parseMembership)
    .filter((membership): membership is TrustedSendJobTenantMembership => Boolean(membership));
}

function parseMembership(row: TenantMembershipRow): TrustedSendJobTenantMembership | null {
  if (row.status !== "active") return null;
  const tenantId = typeof row.tenant_id === "string" ? row.tenant_id.trim() : "";
  const role = typeof row.role === "string" ? row.role.trim() : "";
  if (!tenantId || !ROLE_SET.has(role)) return null;
  const permissions = Array.isArray(row.permissions)
    ? row.permissions.filter((permission): permission is string => typeof permission === "string")
    : [];
  return { permissions, roles: [role as SendJobRole], tenantId };
}
