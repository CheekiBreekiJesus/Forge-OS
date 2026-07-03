import {
  resolveTrustedSendJobActorContext,
  SendJobActorContextError,
  type TrustedSendJobActorContext
} from "@/features/email-delivery/send-job-actor-context";
import { requireSendJobPermission } from "@/features/email-delivery/send-job-authorization";
import { assertOutlookServerOnlyModule } from "./server-only";

assertOutlookServerOnlyModule();

export class OutlookRouteGuardError extends Error {
  constructor(
    public readonly code:
      | "bad_request"
      | "forbidden_origin"
      | "localhost_required"
      | "authentication_required"
      | "invalid_actor_context"
      | "production_auth_not_configured",
    message: string
  ) {
    super(message);
    this.name = "OutlookRouteGuardError";
  }
}

function readPublicBaseUrl(env: Record<string, string | undefined> = process.env): string {
  return (env.FORGEOS_PUBLIC_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function isLocalRuntime(env: Record<string, string | undefined> = process.env): boolean {
  return env.NODE_ENV !== "production" || readBoolean(env.OUTLOOK_GRAPH_ENABLED) === false;
}

function readBoolean(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

export function validateOutlookMutationOrigin(
  request: Request,
  env: Record<string, string | undefined> = process.env
): void {
  const origin = request.headers.get("origin")?.trim();
  if (!origin) return;
  const expected = readPublicBaseUrl(env);
  if (origin !== expected) {
    throw new OutlookRouteGuardError(
      "forbidden_origin",
      `Origin ${origin} does not match ${expected}.`
    );
  }
}

export function validateOutlookMutationContentType(request: Request): void {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new OutlookRouteGuardError("bad_request", "Mutation requests must use application/json.");
  }
}

export function validateOutlookLocalhostBoundary(
  request: Request,
  env: Record<string, string | undefined> = process.env
): void {
  if (!isLocalRuntime(env)) return;
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    throw new OutlookRouteGuardError(
      "localhost_required",
      "Outlook local-runtime mutations are limited to localhost."
    );
  }
}

export async function guardOutlookMutationRequest(
  request: Request,
  permission: "send_job:process" | "send_job:queue" | "send_job:pause" | "send_job:resume" | "send_job:cancel" | "send_job:view",
  env: Record<string, string | undefined> = process.env
): Promise<TrustedSendJobActorContext> {
  if (request.method !== "GET") {
    validateOutlookMutationContentType(request);
  }
  validateOutlookMutationOrigin(request, env);
  validateOutlookLocalhostBoundary(request, env);
  try {
    const actor = await resolveTrustedSendJobActorContext(request, env);
    requireSendJobPermission(actor, permission);
    return actor;
  } catch (error) {
    if (error instanceof SendJobActorContextError) {
      throw new OutlookRouteGuardError(error.code, error.message);
    }
    throw error;
  }
}

export function mapOutlookGuardErrorStatus(code: OutlookRouteGuardError["code"]): number {
  switch (code) {
    case "bad_request":
    case "invalid_actor_context":
      return 400;
    case "authentication_required":
    case "production_auth_not_configured":
      return 401;
    case "forbidden_origin":
    case "localhost_required":
      return 403;
    default: {
      const _exhaustive: never = code;
      return _exhaustive;
    }
  }
}
