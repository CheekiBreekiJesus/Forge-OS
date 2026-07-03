import { NextResponse } from "next/server";
import { handleOutlookTestSend, mapOutlookRouteError } from "@/app/api/integrations/outlook/_shared";
import { guardOutlookMutationRequest } from "@/features/outlook-graph/route-guard";
import { getOutlookSendServerDependencies } from "@/features/outlook-graph/server-dependencies";
import { OutlookSendServiceError } from "@/application/outlook-send-service";

export async function POST(request: Request) {
  try {
    const actor = await guardOutlookMutationRequest(request, "send_job:process");
    const deps = getOutlookSendServerDependencies();
    if (!deps) {
      throw new OutlookSendServiceError(
        "server_persistence_unavailable",
        "Outlook server persistence is not configured.",
        503
      );
    }
    const body = (await request.json().catch(() => ({}))) as {
      confirmation?: string;
      campaignId?: string;
      recipientId?: string;
      subject?: string;
      renderedBody?: string;
      approvedDraftVersion?: string;
      recipientEmail?: string;
      senderSnapshot?: Record<string, string | null>;
    };
    const result = await handleOutlookTestSend(deps, actor, body);
    return NextResponse.json(
      {
        attemptId: result.attemptId,
        result: result.result,
        acceptedByGraph: result.acceptedByGraph,
        deliveryNote: result.deliveryNote,
        blockedByExistingAttempt: result.blockedByExistingAttempt
      },
      { status: result.httpStatus }
    );
  } catch (error) {
    return mapOutlookRouteError(error);
  }
}
