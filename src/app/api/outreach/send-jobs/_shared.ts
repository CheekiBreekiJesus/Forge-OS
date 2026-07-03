import type {
  SendJobServerMutationDependencies
} from "@/application/send-job-server-mutations";
import { SendJobServerMutationError } from "@/application/send-job-server-mutations";
import {
  resolveTrustedSendJobActorContext,
  SendJobActorContextError,
  type TrustedSendJobActorContext
} from "@/features/email-delivery/send-job-actor-context";

type SendJobOperation = (
  deps: SendJobServerMutationDependencies,
  actor: TrustedSendJobActorContext,
  body: unknown
) => Promise<unknown>;

type RouteHandlerOptions = {
  deps?: SendJobServerMutationDependencies | null;
  resolveActor?: (request: Request) => Promise<TrustedSendJobActorContext>;
};

export function createSendJobRouteHandler(
  operation: SendJobOperation,
  options: RouteHandlerOptions = {}
) {
  return async function sendJobRouteHandler(request: Request): Promise<Response> {
    try {
      const actor = await (options.resolveActor ?? resolveTrustedSendJobActorContext)(request);
      const deps = options.deps ?? getDefaultSendJobServerDependencies();
      if (!deps) {
        throw new SendJobServerMutationError(
          "server_persistence_unavailable",
          "Server send-job persistence is not configured.",
          503
        );
      }
      const body = await readJsonBody(request);
      const result = await operation(deps, actor, body);
      return Response.json({ ok: true, result });
    } catch (error) {
      return mapRouteError(error);
    }
  };
}

function getDefaultSendJobServerDependencies(): SendJobServerMutationDependencies | null {
  return null;
}

async function readJsonBody(request: Request): Promise<unknown> {
  return request.json().catch(() => {
    throw new SendJobServerMutationError("bad_request", "Request body must be valid JSON.", 400);
  });
}

function mapRouteError(error: unknown): Response {
  if (error instanceof SendJobServerMutationError) {
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message
        },
        ok: false
      },
      { status: error.status }
    );
  }
  if (error instanceof SendJobActorContextError) {
    const status = error.code === "invalid_actor_context" ? 400 : 401;
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message
        },
        ok: false
      },
      { status }
    );
  }
  return Response.json(
    {
      error: {
        code: "internal_error",
        message: "Unexpected send-job server error."
      },
      ok: false
    },
    { status: 500 }
  );
}
