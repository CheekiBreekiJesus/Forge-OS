import type { LeadOpsBridgeLead } from "@/lib/ai/capabilities/outreach-types";

/** Fields explicitly allowed in AI prompts — excludes VAT, address, phone, legal footer. */
export type MinimizedAIInput = {
  leadCompanyName: string;
  leadContactName: string;
  leadIndustry: string;
  leadLocation: string;
  leadWebsite: string | null;
  hasWebsiteContext: boolean;
  websiteSummary: string;
  selectedProductNames: string[];
  tone: string;
  campaignObjective: string;
  language: string;
};

export function buildMinimizedAIInput(input: {
  lead: LeadOpsBridgeLead;
  hasWebsiteContext: boolean;
  websiteSummary: string;
  selectedProductNames: string[];
  tone: string;
  campaignObjective: string;
  language: string;
}): MinimizedAIInput {
  return {
    campaignObjective: input.campaignObjective,
    hasWebsiteContext: input.hasWebsiteContext,
    language: input.language,
    leadCompanyName: input.lead.companyName,
    leadContactName: input.lead.contactName,
    leadIndustry: input.lead.industry,
    leadLocation: input.lead.location,
    leadWebsite: input.lead.website ?? null,
    selectedProductNames: input.selectedProductNames,
    tone: input.tone,
    websiteSummary: input.websiteSummary
  };
}

export function minimizedInputToPrompt(input: MinimizedAIInput): string {
  return [
    `Company: ${input.leadCompanyName}`,
    `Contact: ${input.leadContactName}`,
    `Sector: ${input.leadIndustry}`,
    `Region: ${input.leadLocation}`,
    `Website URL: ${input.leadWebsite ?? "not available"}`,
    `Website context source: ${input.hasWebsiteContext ? "stored context" : "missing"}`,
    `Website/company context: ${input.websiteSummary}`,
    `Selected products: ${input.selectedProductNames.join(", ")}`,
    `Tone: ${input.tone}`,
    `Campaign objective: ${input.campaignObjective}`,
    `Language: ${input.language}`,
    "Do NOT include URLs, contact details, signatures, legal footers, or image paths in your output."
  ].join("\n");
}
