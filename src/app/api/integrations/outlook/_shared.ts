import { randomUUID } from "node:crypto";
import {
  executeOutlookTestSend,
  mapCanonicalError,
  OutlookSendServiceError,
  selectOrganicEligibleRecipients,
  OUTLOOK_ORGANIC_SESSION_CONFIRMATION
} from "@/application/outlook-send-service";
import { loadCanonicalOutlookSendContext, toOutlookApprovedPayload } from "@/features/outlook-graph/canonical-send";
import {
  guardOutlookMutationRequest,
  mapOutlookGuardErrorStatus,
  OutlookRouteGuardError
} from "@/features/outlook-graph/route-guard";
import { appendOutlookAuditEvent } from "@/features/outlook-graph/outlook-audit";
import type { OutlookSendServerDependencies } from "@/features/outlook-graph/server-dependencies";
import { getOutlookSendServerDependencies } from "@/features/outlook-graph/server-dependencies";
import type { TrustedSendJobActorContext } from "@/features/email-delivery/send-job-actor-context";
import {
  buildOrganicIdempotencyKey,
  createOrganicSendSessionFromCommands,
  getOrganicSendSessionSnapshot,
  pauseOrganicSendSession,
  processOrganicSendSessionTick,
  resumeOrganicSendSession
} from "@/features/outlook-graph/organic-send-session";
import { NextResponse } from "next/server";

type RouteOptions = {
  deps?: OutlookSendServerDependencies | null;
};

export function createOutlookMutationHandler<TBody>(
  permission: "send_job:process" | "send_job:queue" | "send_job:pause" | "send_job:resume",
  operation: (
    deps: OutlookSendServerDependencies,
    actor: TrustedSendJobActorContext,
    body: TBody
  ) => Promise<unknown>
) {
  return async function outlookMutationHandler(
    request: Request,
    options: RouteOptions = {}
  ): Promise<Response> {
    try {
      const actor = await guardOutlookMutationRequest(request, permission);
      const deps = options.deps ?? getOutlookSendServerDependencies();
      if (!deps) {
        throw new OutlookSendServiceError(
          "server_persistence_unavailable",
          "Outlook server persistence is not configured.",
          503
        );
      }
      const body = (await request.json().catch(() => ({}))) as TBody;
      const result = await operation(deps, actor, body);
      return NextResponse.json({ ok: true, result });
    } catch (error) {
      return mapOutlookRouteError(error);
    }
  };
}

export async function handleOutlookTestSend(
  deps: OutlookSendServerDependencies,
  actor: TrustedSendJobActorContext,
  body: { confirmation?: string; campaignId?: string; recipientId?: string }
) {
  const result = await executeOutlookTestSend(deps, actor, {
    campaignId: body.campaignId ?? "",
    confirmation: body.confirmation ?? "",
    recipientId: body.recipientId ?? ""
  });
  const status =
    result.result.classification === "accepted"
      ? 202
      : result.result.classification === "blocked"
        ? 403
        : result.result.classification === "reconnect_required"
          ? 401
          : 502;
  return { ...result, httpStatus: status };
}

export async function handleOutlookOrganicSessionPost(
  deps: OutlookSendServerDependencies,
  actor: TrustedSendJobActorContext,
  body: {
    action?: string;
    campaignId?: string;
    requestedMaximum?: number;
    enabled?: boolean;
    confirmation?: string;
    items?: unknown;
  }
) {
  if (body.items !== undefined) {
    throw new OutlookSendServiceError(
      "bad_request",
      "Client-supplied send payloads are not allowed.",
      400
    );
  }

  if (body.action === "pause") {
    const session = pauseOrganicSendSession();
    if (session) {
      await appendOutlookAuditEvent(
        deps.repos,
        actor.tenantId,
        "outlook_organic_session_paused",
        body.campaignId ?? session.sessionId,
        "Outlook organic session paused",
        { sessionId: session.sessionId }
      );
    }
    return { session };
  }

  if (body.action === "resume") {
    const session = resumeOrganicSendSession();
    if (session) {
      await appendOutlookAuditEvent(
        deps.repos,
        actor.tenantId,
        "outlook_organic_session_resumed",
        body.campaignId ?? session.sessionId,
        "Outlook organic session resumed",
        { sessionId: session.sessionId }
      );
    }
    return { session };
  }

  if (body.action === "tick") {
    const session = await processOrganicSendSessionTick(deps);
    return { session };
  }

  if (body.confirmation !== OUTLOOK_ORGANIC_SESSION_CONFIRMATION) {
    throw new OutlookSendServiceError("confirmation_required", "Organic session confirmation required.");
  }
  if (!body.campaignId) {
    throw new OutlookSendServiceError("bad_request", "campaignId is required.");
  }

  const requestedMaximum = Math.min(body.requestedMaximum ?? 5, 5);
  const eligible = await selectOrganicEligibleRecipients(
    deps,
    actor,
    body.campaignId,
    requestedMaximum
  );

  const commands = await Promise.all(
    eligible.map(async (recipient) => {
      const context = await loadCanonicalOutlookSendContext(
        deps.repos,
        actor.tenantId,
        body.campaignId!,
        recipient.id,
        {
          attemptStore: deps.attemptStore,
          outlookConfig: deps.config
        }
      );
      return {
        campaignId: context.campaign.id,
        idempotencyKey: context.idempotencyKey,
        payload: toOutlookApprovedPayload(randomUUID(), context),
        recipientId: context.recipient.id,
        snapshotHash: context.approvedDraftVersion
      };
    })
  );

  const session = createOrganicSendSessionFromCommands(commands, {
    campaignId: body.campaignId,
    enabled: body.enabled ?? false,
    tenantId: actor.tenantId
  });

  await appendOutlookAuditEvent(
    deps.repos,
    actor.tenantId,
    "outlook_organic_session_created",
    body.campaignId,
    "Outlook organic session created",
    {
      itemCount: session.items.length,
      sessionId: session.sessionId
    }
  );

  return { session };
}

export async function handleOutlookDisconnect(
  deps: OutlookSendServerDependencies,
  actor: TrustedSendJobActorContext
) {
  await deps.provider.disconnect();
  await appendOutlookAuditEvent(
    deps.repos,
    actor.tenantId,
    "outlook_disconnected",
    actor.tenantId,
    "Outlook disconnected",
    { actorId: actor.userId }
  );
  return { disconnected: true };
}

function mapOutlookRouteError(error: unknown): Response {
  if (error instanceof OutlookRouteGuardError) {
    return NextResponse.json({ error: error.message, code: error.code }, {
      status: mapOutlookGuardErrorStatus(error.code)
    });
  }
  if (error instanceof OutlookSendServiceError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details ?? null
      },
      { status: error.status }
    );
  }
  const mapped = mapCanonicalError(error);
  return NextResponse.json(
    {
      error: mapped.message,
      code: mapped.code,
      details: mapped.details ?? null
    },
    { status: mapped.status }
  );
}

export { mapOutlookRouteError };
