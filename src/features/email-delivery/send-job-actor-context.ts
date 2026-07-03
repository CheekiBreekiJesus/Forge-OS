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
  source: "development_headers" | "production_session";
  correlationId: string;
};

export class SendJobActorContextError extends Error {
  constructor(
    public readonly code: "authentication_required" | "production_auth_not_configured" | "invalid_actor_context",
    message: string
  ) {
    super(message);
    this.name = "SendJobActorContextError";
  }
}

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
  env: Record<string, string | undefined> = process.env
): Promise<TrustedSendJobActorContext> {
  if (env.NODE_ENV === "production") {
    throw new SendJobActorContextError(
      "production_auth_not_configured",
      "Production send-job auth adapter is not configured."
    );
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
    roles: roles as SendJobRole[],
    source: "development_headers",
    tenantId,
    userId
  };
}

function readHeader(request: Request, key: string): string {
  return request.headers.get(key)?.trim() ?? "";
}
