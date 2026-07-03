import {
  resolveTrustedSendJobActorContext,
  SendJobActorContextError,
  type TrustedSendJobActorContext
} from "@/features/email-delivery/send-job-actor-context";
import { assertServerOnlyModule } from "@/features/email-delivery/server-only";
import {
  JhGomesMailAuthorizationError,
  requireJhGomesMailPermission,
  type JhGomesMailPermission
} from "./authorization";

assertServerOnlyModule();

export class JhGomesMailRouteGuardError extends Error {
  constructor(
    public readonly code:
      | "bad_request"
      | "authentication_required"
      | "invalid_actor_context"
      | "production_auth_not_configured"
      | "tenant_membership_required"
      | "tenant_selection_required"
      | "forbidden",
    message: string
  ) {
    super(message);
    this.name = "JhGomesMailRouteGuardError";
  }
}

export async function guardJhGomesMailMutationRequest(
  request: Request,
  permission: JhGomesMailPermission,
  env: Record<string, string | undefined> = process.env
): Promise<TrustedSendJobActorContext> {
  validateJsonContentType(request);
  try {
    const actor = await resolveTrustedSendJobActorContext(request, env);
    requireJhGomesMailPermission(actor, permission);
    return actor;
  } catch (error) {
    if (error instanceof SendJobActorContextError) {
      throw new JhGomesMailRouteGuardError(error.code, error.message);
    }
    if (error instanceof JhGomesMailAuthorizationError) {
      throw new JhGomesMailRouteGuardError("forbidden", error.message);
    }
    throw error;
  }
}

function validateJsonContentType(request: Request): void {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new JhGomesMailRouteGuardError(
      "bad_request",
      "Mutation requests must use application/json."
    );
  }
}

export function mapJhGomesMailGuardErrorStatus(code: JhGomesMailRouteGuardError["code"]): number {
  switch (code) {
    case "bad_request":
    case "invalid_actor_context":
      return 400;
    case "authentication_required":
    case "production_auth_not_configured":
    case "tenant_membership_required":
    case "tenant_selection_required":
      return 401;
    case "forbidden":
      return 403;
    default: {
      const _exhaustive: never = code;
      return _exhaustive;
    }
  }
}
