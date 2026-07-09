import { listCampaignSendJobsThroughServer } from "@/application/send-job-server-mutations";
import { SendJobServerMutationError } from "@/application/send-job-server-mutations";
import {
  resolveTrustedSendJobActorContext,
  SendJobActorContextError
} from "@/features/email-delivery/send-job-actor-context";
import { createHostedSendJobServerDependencies } from "@/features/email-delivery/hosted-send-job-repositories";

export async function GET(request: Request): Promise<Response> {
  try {
    const actor = await resolveTrustedSendJobActorContext(request);
    const campaignId = new URL(request.url).searchParams.get("campaignId")?.trim() ?? "";
    const deps = createHostedSendJobServerDependencies();
    if (!deps) {
      throw new SendJobServerMutationError(
        "server_persistence_unavailable",
        "Server send-job persistence is not configured.",
        503
      );
    }
    const result = await listCampaignSendJobsThroughServer(deps, actor, campaignId);
    return Response.json({ ok: true, result });
  } catch (error) {
    return mapError(error);
  }
}

function mapError(error: unknown): Response {
  if (error instanceof SendJobServerMutationError) {
    return Response.json(
      { error: { code: error.code, message: error.message }, ok: false },
      { status: error.status }
    );
  }
  if (error instanceof SendJobActorContextError) {
    const status = error.code === "invalid_actor_context" ? 400 : 401;
    return Response.json({ error: { code: error.code, message: error.message }, ok: false }, { status });
  }
  return Response.json(
    { error: { code: "internal_error", message: "Unexpected hosted send-job lookup error." }, ok: false },
    { status: 500 }
  );
}
