import { NextResponse } from "next/server";
import { createOutlookGraphEmailProvider } from "@/features/outlook-graph/outlook-graph-provider";
import { guardOutlookMutationRequest, mapOutlookGuardErrorStatus, OutlookRouteGuardError } from "@/features/outlook-graph/route-guard";
import { getOutlookSendServerDependencies } from "@/features/outlook-graph/server-dependencies";
import { appendOutlookAuditEvent } from "@/features/outlook-graph/outlook-audit";

export async function POST(request: Request) {
  try {
    const actor = await guardOutlookMutationRequest(request, "send_job:view");
    const provider = createOutlookGraphEmailProvider();
    const result = await provider.validateConnection();
    const deps = getOutlookSendServerDependencies();
    if (deps && result.ok) {
      const status = await provider.getConnectionStatus();
      await appendOutlookAuditEvent(
        deps.repos,
        actor.tenantId,
        "outlook_mailbox_validated",
        actor.tenantId,
        "Outlook mailbox validated",
        { mailboxAddress: status.mailboxAddress, status: status.status }
      );
    }
    return NextResponse.json(result, { status: result.ok ? 200 : 401 });
  } catch (error) {
    if (error instanceof OutlookRouteGuardError) {
      return NextResponse.json({ error: error.message, code: error.code }, {
        status: mapOutlookGuardErrorStatus(error.code)
      });
    }
    throw error;
  }
}
