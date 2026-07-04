import { resolveForgeOSSession } from "@/lib/auth/session";
import { ForgeOSAuthError } from "@/lib/auth/types";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { listTenantMemberships, type TenantMembershipRecord } from "@/lib/supabase/tenant";
import { assertServerOnlyModule } from "./server-only";

assertServerOnlyModule();

export type SendJobRole =
  | "super_admin"
  | "company_owner"
  | "marketing_manager"
  | "outreach_operator"
  | "sales"
  | "owner"
  | "viewer";

export type TrustedSendJobActorContext = {
  userId: string;
  tenantId: string;
  roles: SendJobRole[];
  permissions: string[];
  source: "development_headers" | "production_session";
  correlationId: string;
};

export type TrustedSendJobTenantMembership = {
  tenantId: string;
  roles: SendJobRole[];
  permissions: string[];
};

export type TrustedSendJobTenantMembershipList = {
  userId: string;
  memberships: TrustedSendJobTenantMembership[];
  source: TrustedSendJobActorContext["source"];
  correlationId: string;
};

export class SendJobActorContextError extends Error {
  constructor(
    public readonly code:
      | "authentication_required"
      | "production_auth_not_configured"
      | "tenant_membership_required"
      | "tenant_selection_required"
      | "invalid_actor_context",
    message: string
  ) {
    super(message);
    this.name = "SendJobActorContextError";
  }
}

type ActorContextDependencies = {
  resolveSession?: typeof resolveForgeOSSession;
  listMemberships?: (userId: string) => Promise<TenantMembershipRecord[]>;
};

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

export async function resolveTrustedSendJobActorContext(
  request: Request,
  env: Record<string, string | undefined> = process.env,
  deps: ActorContextDependencies = {}
): Promise<TrustedSendJobActorContext> {
  if (env.NODE_ENV === "production") {
    return resolveProductionActorContext(request, env, deps);
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

  const roles = parseRoles(roleHeader);

  return {
    correlationId,
    permissions: [],
    roles,
    source: "development_headers",
    tenantId,
    userId
  };
}

export async function resolveTrustedSendJobTenantMemberships(
  request: Request,
  env: Record<string, string | undefined> = process.env,
  deps: ActorContextDependencies = {}
): Promise<TrustedSendJobTenantMembershipList> {
  if (env.NODE_ENV === "production") {
    return resolveProductionTenantMemberships(request, env, deps);
  }

  const actor = await resolveTrustedSendJobActorContext(request, env, deps);
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
  deps: ActorContextDependencies
): Promise<TrustedSendJobActorContext> {
  const session = await resolveSessionOrThrow(request, env, deps);
  const memberships = await loadTrustedMemberships(session.userId, deps);
  if (memberships.length === 0) {
    throw new SendJobActorContextError(
      "tenant_membership_required",
      "Active tenant membership is required."
    );
  }

  const selectedTenantId = readHeader(request, "x-forgeos-selected-tenant-id");
  if (memberships.length > 1 && !selectedTenantId && !env.FORGEOS_ACTIVE_TENANT_KEY?.trim()) {
    throw new SendJobActorContextError(
      "tenant_selection_required",
      "Multiple active tenant memberships require a trusted tenant selector."
    );
  }

  const tenantId = selectedTenantId || session.tenantId;
  const membership = memberships.find((row) => row.tenantId === tenantId);
  if (!membership) {
    throw new SendJobActorContextError(
      "tenant_membership_required",
      "Selected tenant membership is not active for this user."
    );
  }

  return {
    correlationId: readHeader(request, "x-forgeos-correlation-id") || crypto.randomUUID(),
    permissions: membership.permissions,
    roles: membership.roles,
    source: "production_session",
    tenantId: membership.tenantId,
    userId: session.userId
  };
}

async function resolveProductionTenantMemberships(
  request: Request,
  env: Record<string, string | undefined>,
  deps: ActorContextDependencies
): Promise<TrustedSendJobTenantMembershipList> {
  const session = await resolveSessionOrThrow(request, env, deps);
  const memberships = await loadTrustedMemberships(session.userId, deps);
  if (memberships.length === 0) {
    throw new SendJobActorContextError(
      "tenant_membership_required",
      "Active tenant membership is required."
    );
  }

  return {
    correlationId: readHeader(request, "x-forgeos-correlation-id") || crypto.randomUUID(),
    memberships,
    source: "production_session",
    userId: session.userId
  };
}

async function resolveSessionOrThrow(
  request: Request,
  env: Record<string, string | undefined>,
  deps: ActorContextDependencies
) {
  try {
    return await (deps.resolveSession ?? resolveForgeOSSession)(request, env);
  } catch (error) {
    if (error instanceof ForgeOSAuthError) {
      throw new SendJobActorContextError(
        error.code === "auth_not_configured" ? "production_auth_not_configured" : "authentication_required",
        error.message
      );
    }
    throw error;
  }
}

async function loadTrustedMemberships(
  userId: string,
  deps: ActorContextDependencies
): Promise<TrustedSendJobTenantMembership[]> {
  const rows = await (deps.listMemberships ?? defaultListMemberships)(userId);
  return rows
    .filter((row) => row.status === "active")
    .map(parseMembership)
    .filter((membership): membership is TrustedSendJobTenantMembership => Boolean(membership));
}

async function defaultListMemberships(userId: string): Promise<TenantMembershipRecord[]> {
  const service = createSupabaseServiceClient();
  return listTenantMemberships(service, userId);
}

function parseRoles(roleHeader: string): SendJobRole[] {
  const roles = roleHeader
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);

  if (roles.length === 0 || roles.some((role) => !ROLE_SET.has(role))) {
    throw new SendJobActorContextError("invalid_actor_context", "Trusted actor role is invalid.");
  }

  return roles as SendJobRole[];
}

function parseMembership(row: TenantMembershipRecord): TrustedSendJobTenantMembership | null {
  const tenantId = row.tenantId.trim();
  if (!tenantId || !ROLE_SET.has(row.role)) return null;
  return {
    permissions: row.permissions,
    roles: [row.role as SendJobRole],
    tenantId
  };
}
