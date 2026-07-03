import { NextResponse } from "next/server";
import {
  getOrganicSendSessionSnapshot
} from "@/features/outlook-graph/organic-send-session";
import { guardOutlookMutationRequest } from "@/features/outlook-graph/route-guard";
import { getOutlookSendServerDependencies } from "@/features/outlook-graph/server-dependencies";
import {
  handleOutlookOrganicSessionPost,
  mapOutlookRouteError
} from "@/app/api/integrations/outlook/_shared";
import { OutlookSendServiceError } from "@/application/outlook-send-service";

export async function GET() {
  return NextResponse.json({ session: getOrganicSendSessionSnapshot() });
}

export async function POST(request: Request) {
  try {
    const actor = await guardOutlookMutationRequest(request, "send_job:queue");
    const deps = getOutlookSendServerDependencies();
    if (!deps) {
      throw new OutlookSendServiceError(
        "server_persistence_unavailable",
        "Outlook server persistence is not configured.",
        503
      );
    }
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
      campaignId?: string;
      requestedMaximum?: number;
      enabled?: boolean;
      confirmation?: string;
      items?: unknown;
    };
    const result = await handleOutlookOrganicSessionPost(deps, actor, body);
    const status = body.action ? 200 : 201;
    return NextResponse.json(result, { status });
  } catch (error) {
    return mapOutlookRouteError(error);
  }
}
