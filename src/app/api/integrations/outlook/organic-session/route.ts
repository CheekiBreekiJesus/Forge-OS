import { NextResponse } from "next/server";
import {
  createOrganicSendSession,
  getOrganicSendSessionSnapshot,
  pauseOrganicSendSession,
  processOrganicSendSessionTick,
  resumeOrganicSendSession
} from "@/features/outlook-graph/organic-send-session";
import { createOutlookGraphEmailProvider } from "@/features/outlook-graph/outlook-graph-provider";
import type { OutlookApprovedSendPayload } from "@/features/outlook-graph/types";

export async function GET() {
  return NextResponse.json({ session: getOrganicSendSessionSnapshot() });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    enabled?: boolean;
    items?: OutlookApprovedSendPayload[];
  };

  if (body.action === "pause") {
    return NextResponse.json({ session: pauseOrganicSendSession() });
  }
  if (body.action === "resume") {
    return NextResponse.json({ session: resumeOrganicSendSession() });
  }
  if (body.action === "tick") {
    const provider = createOutlookGraphEmailProvider();
    const session = await processOrganicSendSessionTick(provider);
    return NextResponse.json({ session });
  }

  const session = createOrganicSendSession(body.items ?? [], {
    enabled: body.enabled ?? false
  });
  return NextResponse.json({ session }, { status: 201 });
}
