import { NextResponse } from "next/server";
import { handleOutlookDisconnect, mapOutlookRouteError } from "@/app/api/integrations/outlook/_shared";
import { guardOutlookMutationRequest } from "@/features/outlook-graph/route-guard";
import { getOutlookSendServerDependencies } from "@/features/outlook-graph/server-dependencies";
import { OutlookSendServiceError } from "@/application/outlook-send-service";

export async function POST(request: Request) {
  try {
    const actor = await guardOutlookMutationRequest(request, "send_job:cancel");
    const deps = getOutlookSendServerDependencies();
    if (!deps) {
      throw new OutlookSendServiceError(
        "server_persistence_unavailable",
        "Outlook server persistence is not configured.",
        503
      );
    }
    const result = await handleOutlookDisconnect(deps, actor);
    return NextResponse.json(result);
  } catch (error) {
    return mapOutlookRouteError(error);
  }
}
