import { NextResponse } from "next/server";
import { deliverOutreachMessage } from "@/features/leadops/server-delivery";
import type { LeadOpsWorkflowState } from "@/features/leadops/types";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const state = parseWorkflowState(payload);

  if (!state) {
    return NextResponse.json({ error: "Invalid outreach delivery request." }, { status: 400 });
  }

  const result = await deliverOutreachMessage(state);
  const status = result.providerStatus === "failed" ? 502 : 200;

  return NextResponse.json(result, { status });
}

function parseWorkflowState(payload: unknown): LeadOpsWorkflowState | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const state = payload as LeadOpsWorkflowState;

  if (
    !state.lead?.id ||
    !state.lead.tenantId ||
    !state.lead.companyName ||
    !state.message?.subject ||
    !state.message.body ||
    !state.message.approved ||
    state.campaign?.tenantId !== state.lead.tenantId ||
    !Array.isArray(state.activities)
  ) {
    return null;
  }

  return state;
}
