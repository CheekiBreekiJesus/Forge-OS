import { NextResponse } from "next/server";
import { sendApprovedOutreachMessage } from "@/application/outreach-message-send-service";
import { resolveForgeOSSession, assertTenantAccess } from "@/lib/auth/session";
import { requireOutreachPermission, ForgeOSAuthError } from "@/lib/auth/types";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { outreachMessageSendBodySchema } from "@/lib/validation/outreach-schemas";
import { PersistenceError } from "@/persistence/interfaces";
import {
  getServerOutreachRepositories,
  ServerPersistenceUnavailableError
} from "@/persistence/server-factory";

type RouteContext = {
  params: Promise<{ messageId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await resolveForgeOSSession(request);
    requireOutreachPermission(session, "deliver");

    const limit = checkRateLimit(`deliver:${session.userId}`, 30, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)) } }
      );
    }

    const { messageId } = await context.params;
    const payload = await request.json().catch(() => ({}));
    outreachMessageSendBodySchema.parse(payload);

    const repos = await getServerOutreachRepositories();
    const recipient = await repos.campaignRecipients.getById(session.tenantId, messageId);
    if (!recipient) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }

    assertTenantAccess(session, recipient.tenantId);

    const result = await sendApprovedOutreachMessage(repos, {
      tenantId: session.tenantId,
      campaignId: recipient.campaignId,
      recipientId: recipient.id,
      actorId: session.userId
    });

    const status = result.alreadyProcessed ? 409 : 202;
    return NextResponse.json(
      {
        alreadyProcessed: result.alreadyProcessed,
        delivery: {
          mode: result.delivery.mode,
          providerStatus: result.delivery.providerStatus,
          deliveredSubject: result.delivery.deliveredSubject,
          deliveredPlainText: result.delivery.deliveredPlainText
        },
        idempotencyKey: result.idempotencyKey,
        ok: true
      },
      { status }
    );
  } catch (error) {
    return mapError(error);
  }
}

function mapError(error: unknown): NextResponse {
  if (error instanceof ForgeOSAuthError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }
  if (error instanceof ServerPersistenceUnavailableError) {
    return NextResponse.json({ error: error.message, code: "server_persistence_unavailable" }, { status: 503 });
  }
  if (error instanceof PersistenceError) {
    const status =
      error.code === "not_found" ? 404 : error.code === "forbidden" ? 403 : 422;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }
  if (error && typeof error === "object" && "issues" in error) {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
  return NextResponse.json({ error: "Unexpected outreach delivery error." }, { status: 500 });
}
