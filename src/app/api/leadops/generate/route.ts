import { NextResponse } from "next/server";
import { generateOutreachEmail } from "@/features/leadops/providers";
import type {
  LeadOpsCampaign,
  LeadOpsCompanyContext,
  LeadOpsLead,
  LeadOpsProductKey,
  LeadOpsTone
} from "@/features/leadops/types";

const productKeys = new Set<LeadOpsProductKey>([
  "customized-plastic-cups",
  "customized-paper-cups",
  "paper-cups",
  "biodegradable-cutlery",
  "disposable-food-service",
  "packaging-products"
]);

const tones = new Set<LeadOpsTone>(["professional", "friendly", "direct"]);

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = parseGenerationPayload(payload);

  if (!parsed) {
    return NextResponse.json({ error: "Invalid outreach generation request." }, { status: 400 });
  }

  const result = await generateOutreachEmail(parsed);

  return NextResponse.json(result);
}

function parseGenerationPayload(payload: unknown):
  | {
      campaign: LeadOpsCampaign;
      context: LeadOpsCompanyContext;
      lead: LeadOpsLead;
      productKeys: LeadOpsProductKey[];
      tone: LeadOpsTone;
    }
  | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const value = payload as Record<string, unknown>;
  const lead = value.lead as LeadOpsLead | undefined;
  const campaign = value.campaign as LeadOpsCampaign | undefined;
  const context = value.context as LeadOpsCompanyContext | undefined;
  const tone = value.tone;
  const selectedProductKeys = Array.isArray(value.productKeys)
    ? value.productKeys.filter((key): key is LeadOpsProductKey =>
        typeof key === "string" && productKeys.has(key as LeadOpsProductKey)
      )
    : [];

  if (
    !lead?.id ||
    !lead.tenantId ||
    !lead.companyName ||
    !campaign?.id ||
    !campaign.tenantId ||
    campaign.tenantId !== lead.tenantId ||
    !context ||
    typeof context.hasWebsiteContext !== "boolean" ||
    typeof context.summary !== "string" ||
    !Array.isArray(context.personalizationNotes) ||
    typeof tone !== "string" ||
    !tones.has(tone as LeadOpsTone)
  ) {
    return null;
  }

  return {
    campaign,
    context,
    lead,
    productKeys: selectedProductKeys,
    tone: tone as LeadOpsTone
  };
}
