import { getAIConfig } from "../config";
import { generateStructuredWithGateway } from "../gateway";
import type {
  LeadOpsBridgeCampaign,
  LeadOpsBridgeContext,
  LeadOpsBridgeLead,
  LeadOpsBridgeProductKey,
  LeadOpsBridgeTone
} from "./outreach-types";
import type { GenerateStructuredResult } from "../types";
import {
  type OutreachEmailStructuredOutput,
  validateOutreachEmailOutput
} from "./outreach-email-schema";
import {
  generatePtPtEmail,
  leadOpsProductCatalog,
  recommendProductsForLead
} from "@/features/leadops/workflow";

export type OutreachAIGenerationRequest = {
  campaign: LeadOpsBridgeCampaign;
  context: LeadOpsBridgeContext;
  lead: LeadOpsBridgeLead;
  productKeys: LeadOpsBridgeProductKey[];
  tone: LeadOpsBridgeTone;
};

export type OutreachAIGenerationResult = {
  body: string;
  contextUsed: string[];
  fallbackUsed: boolean;
  model: string;
  provider: string;
  subject: string;
  warnings: string[];
};

export async function generateOutreachEmailWithAI(
  input: OutreachAIGenerationRequest
): Promise<OutreachAIGenerationResult> {
  const config = getAIConfig();
  const profile = config.outreach.profile;
  const providerConfig = config.providers[config.outreach.provider];
  const system = buildSystemPrompt(profile.language);
  const prompt = buildUserPrompt(input, providerConfig.toneOverride ?? profile.tone);
  const fallback = () => buildDeterministicFallback(input);
  const result = await generateStructuredWithGateway({
    config,
    fallback,
    provider: config.outreach.provider,
    request: {
      maxOutputTokens: providerConfig.maxOutputTokensOverride ?? profile.maxOutputTokens,
      model: providerConfig.model,
      prompt,
      reasoningPreference: providerConfig.reasoningOverride ?? profile.reasoningPreference,
      schema: profile.schema!,
      speedPreference: providerConfig.speedOverride ?? profile.speedPreference,
      system,
      temperature: providerConfig.temperatureOverride ?? profile.temperature,
      timeoutMs: providerConfig.timeoutMs ?? config.requestTimeoutMs,
      topP: providerConfig.topPOverride ?? profile.topP,
      validate: validateOutreachEmailOutput
    }
  });

  return {
    body: result.parsed.body,
    contextUsed: result.parsed.contextUsed,
    fallbackUsed: result.fallbackUsed,
    model: result.model,
    provider: result.provider,
    subject: result.parsed.subject,
    warnings: result.warnings
  };
}

function buildDeterministicFallback(
  input: OutreachAIGenerationRequest
): GenerateStructuredResult<OutreachEmailStructuredOutput> {
  const message = generatePtPtEmail({
    campaign: input.campaign,
    context: input.context,
    lead: input.lead,
    productKeys: input.productKeys,
    tone: input.tone
  });
  const parsed = {
    body: message.body,
    contextUsed: input.context.hasWebsiteContext
      ? ["stored website context", "lead industry", "lead location", "selected products"]
      : ["lead industry", "lead location", "selected products"],
    subject: message.subject
  };

  return {
    content: JSON.stringify(parsed),
    fallbackUsed: true,
    latencyMs: 0,
    model: "deterministic-template",
    parsed,
    provider: "deterministic",
    retryCount: 0,
    warnings: ["Deterministic fallback used."]
  };
}

function buildSystemPrompt(language: string): string {
  return [
    "You generate concise B2B outreach emails for ForgeOS Outreach.",
    `Language: ${language}. Use European Portuguese when language is pt-PT.`,
    "Personalized plastic cups are the primary JH Gomes offer.",
    "Mention secondary products only when relevant to the selected products and lead context.",
    "Do not invent facts, discounts, customers, certifications, production capacity, delivery dates, prices, or website observations.",
    "If no website context is provided, do not claim that a website was reviewed.",
    "Use a clear, low-pressure call to action.",
    "Return only JSON with subject, body, and contextUsed."
  ].join("\n");
}

function buildUserPrompt(input: OutreachAIGenerationRequest, tonePreference: string): string {
  const productKeys = input.productKeys.length
    ? input.productKeys
    : recommendProductsForLead(input.lead).map((item) => item.key);
  const selectedProducts = productKeys
    .map((key) => leadOpsProductCatalog[key].ptLabel)
    .join(", ");

  return [
    `Company: ${input.lead.companyName}`,
    `Contact: ${input.lead.contactName}`,
    `Sector: ${input.lead.industry}`,
    `Region: ${input.lead.location}`,
    `Website URL: ${input.lead.website ?? "not available"}`,
    `Website context source: ${input.context.hasWebsiteContext ? "stored context" : "missing"}`,
    `Website/company context: ${input.context.summary}`,
    `Selected products: ${selectedProducts}`,
    `Tone: ${input.tone}`,
    `Provider tone preference: ${tonePreference}`,
    `Campaign objective: ${input.campaign.name}`
  ].join("\n");
}
