import { getHostedCampaignPreparationStatus } from "@/features/email-delivery/hosted-send-job-repositories";
import {
  requireSendJobPermission,
  SendJobAuthorizationError
} from "@/features/email-delivery/send-job-authorization";
import {
  resolveTrustedSendJobActorContext,
  SendJobActorContextError
} from "@/features/email-delivery/send-job-actor-context";
import { PersistenceError } from "@/persistence/interfaces";
import { resolveEffectivePersistenceMode } from "@/persistence/mode";

export async function GET(request: Request): Promise<Response> {
  try {
    const campaignId = new URL(request.url).searchParams.get("campaignId")?.trim() ?? "";
    if (!campaignId) {
      throw new PersistenceError("invalid_transition", "campaignId is required.");
    }
    if (resolveEffectivePersistenceMode() !== "supabase") {
      return Response.json({
        ok: true,
        result: {
          activity: [],
          campaignId,
          preparedAt: null,
          preparedBy: null,
          preparedRecipients: 0,
          snapshotFingerprint: null,
          status: "not_prepared"
        }
      });
    }
    const actor = await resolveTrustedSendJobActorContext(request);
    requireSendJobPermission(actor, "send_job:view");
    const result = await getHostedCampaignPreparationStatus(campaignId, actor);
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
      { error: { code: "forbidden", message: "Actor is not authorized to view hosted preparation status." }, ok: false },
      { status: 403 }
    );
  }
  if (error instanceof PersistenceError) {
    const status = error.code === "not_found" ? 404 : error.code === "forbidden" ? 403 : 400;
    return Response.json({ error: { code: error.code, message: error.message }, ok: false }, { status });
  }
  return Response.json(
    { error: { code: "internal_error", message: "Unexpected hosted preparation status error." }, ok: false },
    { status: 500 }
  );
}
