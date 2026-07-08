import { prepareHostedCampaignProjection } from "@/features/email-delivery/hosted-send-job-repositories";
import {
  requireSendJobPermission,
  SendJobAuthorizationError
} from "@/features/email-delivery/send-job-authorization";
import {
  resolveTrustedSendJobActorContext,
  SendJobActorContextError
} from "@/features/email-delivery/send-job-actor-context";
import { PersistenceError } from "@/persistence/interfaces";

export async function POST(request: Request): Promise<Response> {
  try {
    const actor = await resolveTrustedSendJobActorContext(request);
    requireSendJobPermission(actor, "send_job:prepare");
    const body = await request.json().catch(() => {
      throw new PersistenceError("unavailable", "Request body must be valid JSON.");
    });
    const result = await prepareHostedCampaignProjection(body, actor);
    return Response.json({ ok: true, result });
  } catch (error) {
    return mapError(error);
  }
}

function mapError(error: unknown): Response {
  if (error instanceof SendJobActorContextError) {
    const status = error.code === "invalid_actor_context" ? 400 : 401;
    return Response.json({ error: { code: error.code, message: error.message }, ok: false }, { status });
  }
  if (error instanceof SendJobAuthorizationError) {
    return Response.json(
      { error: { code: "forbidden", message: "Actor is not authorized to prepare campaigns for server sending." }, ok: false },
      { status: 403 }
    );
  }
  if (error instanceof PersistenceError) {
    const status =
      error.code === "forbidden" ? 403 : error.code === "not_found" ? 404 : error.code === "duplicate" ? 409 : 400;
    return Response.json({ error: { code: error.code, message: error.message }, ok: false }, { status });
  }
  return Response.json(
    { error: { code: "internal_error", message: "Unexpected hosted campaign preparation error." }, ok: false },
    { status: 500 }
  );
}
