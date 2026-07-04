import { hasSendJobPermission } from "@/features/email-delivery/send-job-authorization";
import {
  resolveTrustedSendJobTenantMemberships,
  SendJobActorContextError,
  type TrustedSendJobActorContext
} from "@/features/email-delivery/send-job-actor-context";
import { resolveEffectivePersistenceMode } from "@/persistence/mode";

const PREPARATION_RELEVANT_PERMISSIONS = [
  "send_job:view",
  "send_job:prepare",
  "send_job:queue"
] as const;

export async function GET(request: Request): Promise<Response> {
  try {
    if (resolveEffectivePersistenceMode() !== "supabase") {
      return emptyTenantMembershipResponse();
    }

    const context = await resolveTrustedSendJobTenantMemberships(request);
    const memberships = context.memberships.map((membership) => ({
      permissions: PREPARATION_RELEVANT_PERMISSIONS.filter((permission) =>
        hasSendJobPermission(
          {
            correlationId: context.correlationId,
            permissions: membership.permissions,
            roles: membership.roles,
            source: context.source,
            tenantId: membership.tenantId,
            userId: context.userId
          } satisfies TrustedSendJobActorContext,
          permission
        )
      ),
      roles: membership.roles,
      tenantId: membership.tenantId
    }));
    return Response.json({
      ok: true,
      result: {
        memberships,
        selectedTenantId: memberships.length === 1 ? memberships[0].tenantId : null
      }
    });
  } catch (error) {
    if (error instanceof SendJobActorContextError) {
      const status = error.code === "invalid_actor_context" ? 400 : 401;
      return Response.json({ error: { code: error.code, message: error.message }, ok: false }, { status });
    }
    return Response.json(
      { error: { code: "internal_error", message: "Unexpected tenant membership lookup error." }, ok: false },
      { status: 500 }
    );
  }
}

function emptyTenantMembershipResponse(): Response {
  return Response.json({
    ok: true,
    result: {
      memberships: [],
      selectedTenantId: null
    }
  });
}
