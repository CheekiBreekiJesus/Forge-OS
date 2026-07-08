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
  parseLegacyBodyOutput,
  validateOutreachEmailOutput
} from "./outreach-email-schema";
import {
  generatePtPtEmail,
  leadOpsProductCatalog,
  recommendProductsForLead
} from "@/features/leadops/workflow";
import { buildMinimizedAIInput, minimizedInputToPrompt } from "@/features/email-composition/ai-input";
import type { CompanyProfileSnapshot, SenderIdentitySnapshot } from "@/domain/profile-types";
import type { ProductEmailSnapshot } from "@/domain/product-types";
import { composeEmail } from "@/features/email-composition/renderer";
import type { EmailComposition } from "@/features/email-composition/types";

export type OutreachAIGenerationRequest = {
  campaign: LeadOpsBridgeCampaign;
  context: LeadOpsBridgeContext;
  lead: LeadOpsBridgeLead;
  productKeys: LeadOpsBridgeProductKey[];
  tone: LeadOpsBridgeTone;
  locale?: "pt-PT" | "en";
  companyProfile?: CompanyProfileSnapshot;
  senderIdentity?: SenderIdentitySnapshot;
  products?: ProductEmailSnapshot[];
};

export type OutreachAIGenerationResult = {
  aiCopy: OutreachEmailStructuredOutput;
  composition: EmailComposition;
  contextUsed: string[];
  fallbackUsed: boolean;
  model: string;
  provider: string;
  subject: string;
  body: string;
  warnings: string[];
};

export async function generateOutreachEmailWithAI(
  input: OutreachAIGenerationRequest
): Promise<OutreachAIGenerationResult> {
  const config = getAIConfig();
  const profile = config.outreach.profile;
  const providerConfig = config.providers[config.outreach.provider];
  const locale = input.locale ?? "pt-PT";
  const system = buildSystemPrompt(locale);
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

  const composition = buildCompositionFromAi(
    result.parsed,
    input,
    result.provider,
    result.model,
    result.fallbackUsed,
    locale
  );

  return {
    aiCopy: result.parsed,
    body: composition.plainText,
    composition,
    contextUsed: result.parsed.contextUsed,
    fallbackUsed: result.fallbackUsed,
    model: result.model,
    provider: result.provider,
    subject: composition.subject,
    warnings: result.warnings
  };
}

function buildCompositionFromAi(
  aiCopy: OutreachEmailStructuredOutput,
  input: OutreachAIGenerationRequest,
  provider: string,
  model: string,
  fallbackUsed: boolean,
  locale: "pt-PT" | "en"
): EmailComposition {
  const company = input.companyProfile ?? defaultCompanySnapshot();
  const sender = input.senderIdentity ?? defaultSenderSnapshot(company);
  const products = input.products ?? [];

  return composeEmail({
    aiCopy,
    companyProfile: company,
    fallbackUsed,
    locale,
    model,
    products,
    provider,
    senderIdentity: sender
  });
}

function defaultCompanySnapshot(): CompanyProfileSnapshot {
  return {
    addressLine1: "",
    addressLine2: "",
    city: "",
    country: "Portugal",
    defaultCurrency: "EUR",
    defaultLanguage: "pt-PT",
    facebookUrl: "",
    generalEmail: "",
    generalPhone: "",
    id: "default",
    legalFooter: "",
    legalName: "JH Gomes",
    linkedinUrl: "",
    logoLocalAssetId: null,
    logoPublicUrl: "",
    postalCode: "",
    region: "",
    tenantId: "tenant_jh_gomes",
    tradingName: "JH Gomes",
    vatNumber: "",
    websiteUrl: "https://www.jhgomes.pt"
  };
}

function defaultSenderSnapshot(company: CompanyProfileSnapshot): SenderIdentitySnapshot {
  return {
    active: true,
    companyProfileId: company.id,
    defaultLanguage: "pt-PT",
    displayName: "Equipa Comercial",
    fromEmail: company.generalEmail || "comercial@demo.local",
    id: "default-sender",
    isDefault: true,
    jobTitle: "Comercial",
    phone: company.generalPhone,
    replyToEmail: company.generalEmail || "comercial@demo.local",
    signatureHtml: "",
    signatureText: "",
    tenantId: company.tenantId,
    userProfileId: "default-user"
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
  const parsed = parseLegacyBodyOutput(message.body, message.subject);
  if (!parsed.contextUsed.length) {
    parsed.contextUsed = input.context.hasWebsiteContext
      ? ["stored website context", "lead industry", "lead location", "selected products"]
      : ["lead industry", "lead location", "selected products"];
  }

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
    "You generate concise B2B outreach email COPY ONLY for ForgeOS Outreach.",
    `Language: ${language}. Use European Portuguese when language is pt-PT.`,
    "Generate ONLY: subject, optional preheader, greeting, introduction, offerBody, callToAction, contextUsed.",
    "Do NOT include URLs, email addresses, phone numbers, signatures, legal footers, VAT numbers, addresses, or image references.",
    "Do NOT invent facts, discounts, customers, certifications, production capacity, delivery dates, or prices.",
    "If no website context is provided, do not claim that a website was reviewed.",
    "Use a clear, low-pressure call to action.",
    "Return only JSON matching the schema."
  ].join("\n");
}

function buildUserPrompt(input: OutreachAIGenerationRequest, tonePreference: string): string {
  const productKeys = input.productKeys.length
    ? input.productKeys
    : recommendProductsForLead(input.lead).map((item) => item.key);
  const selectedProductNames = productKeys.map((key) => leadOpsProductCatalog[key].ptLabel);

  const minimized = buildMinimizedAIInput({
    campaignObjective: input.campaign.name,
    hasWebsiteContext: input.context.hasWebsiteContext,
    language: input.locale ?? "pt-PT",
    lead: input.lead,
    selectedProductNames,
    tone: input.tone,
    websiteSummary: input.context.summary
  });

  return `${minimizedInputToPrompt(minimized)}\nProvider tone preference: ${tonePreference}`;
}
