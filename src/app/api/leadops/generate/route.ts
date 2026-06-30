import { NextResponse } from "next/server";
import { generateOutreachEmail } from "@/features/leadops/providers";
import type { CompanyProfileSnapshot, SenderIdentitySnapshot } from "@/domain/profile-types";
import type { ProductEmailSnapshot } from "@/domain/product-types";
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
      locale?: "pt-PT" | "en";
      companyProfile?: CompanyProfileSnapshot;
      senderIdentity?: SenderIdentitySnapshot;
      products?: ProductEmailSnapshot[];
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
  const locale = value.locale;
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
    companyProfile: value.companyProfile as CompanyProfileSnapshot | undefined,
    context,
    lead,
    locale: locale === "en" ? "en" : "pt-PT",
    productKeys: selectedProductKeys,
    products: Array.isArray(value.products)
      ? (value.products as ProductEmailSnapshot[])
      : undefined,
    senderIdentity: value.senderIdentity as SenderIdentitySnapshot | undefined,
    tone: tone as LeadOpsTone
  };
}
