import {
  generatePtPtEmail,
  validateQueue
} from "./workflow";
import { generateOutreachEmailWithAI } from "@/lib/ai/capabilities/outreach-email";
import { composeEmail } from "@/features/email-composition/renderer";
import { parseLegacyBodyOutput } from "@/lib/ai/capabilities/outreach-email-schema";
import type { CompanyProfileSnapshot, SenderIdentitySnapshot } from "@/domain/profile-types";
import type { ProductEmailSnapshot } from "@/domain/product-types";
import type {
  LeadOpsCampaign,
  LeadOpsCompanyContext,
  LeadOpsGeneratedMessage,
  LeadOpsLead,
  LeadOpsProductKey,
  LeadOpsTone,
  LeadOpsWorkflowState
} from "./types";

export type OutreachGenerationRequest = {
  campaign: LeadOpsCampaign;
  context: LeadOpsCompanyContext;
  lead: LeadOpsLead;
  productKeys: LeadOpsProductKey[];
  tone: LeadOpsTone;
  locale?: "pt-PT" | "en";
  companyProfile?: CompanyProfileSnapshot;
  senderIdentity?: SenderIdentitySnapshot;
  products?: ProductEmailSnapshot[];
};

export type OutreachGenerationResult = {
  body?: string;
  composition?: import("@/features/email-composition/types").EmailComposition;
  contextUsed?: string[];
  fallbackUsed?: boolean;
  message: LeadOpsGeneratedMessage;
  mode: "deterministic" | "abacus" | "openai" | "fallback" | string;
  model?: string;
  provider?: string;
  subject?: string;
  warning?: string;
  warnings?: string[];
};

export type OutreachDeliveryResult = {
  mode: "simulation" | "smartlead" | "brevo" | "configuration-missing" | "provider-error";
  providerMessageId?: string;
  providerStatus: "queued" | "sent" | "blocked" | "failed";
  error?: string;
};

export function generateDeterministicOutreachEmail(
  request: OutreachGenerationRequest
): OutreachGenerationResult {
  return generateFallbackMessage(request);
}

export async function generateOutreachEmail(
  request: OutreachGenerationRequest
): Promise<OutreachGenerationResult> {
  const result = await generateOutreachEmailWithAI(request);
  const generationMethod = result.fallbackUsed
    ? "deterministic-fallback"
    : result.provider === "abacus"
      ? "abacus"
      : result.provider === "openai"
        ? "openai"
        : "deterministic-template";

  return {
    body: result.body,
    composition: result.composition,
    contextUsed: result.contextUsed,
    fallbackUsed: result.fallbackUsed,
    message: {
      approved: false,
      body: result.body,
      composition: result.composition,
      edited: false,
      generationMethod,
      providerNotice: result.warnings.join(" "),
      senderIdentityId: result.composition.senderIdentityId,
      subject: result.subject
    },
    mode: result.fallbackUsed ? "fallback" : result.provider,
    model: result.model,
    provider: result.provider,
    subject: result.subject,
    warning: result.warnings[0],
    warnings: result.warnings
  };
}

function generateFallbackMessage(request: OutreachGenerationRequest): OutreachGenerationResult {
  const message = generatePtPtEmail(request);
  const locale = request.locale ?? "pt-PT";
  const aiCopy = parseLegacyBodyOutput(message.body, message.subject);
  const company = request.companyProfile;
  const sender = request.senderIdentity;
  const products = request.products ?? [];

  const composition =
    company && sender
      ? composeEmail({
          aiCopy,
          companyProfile: company,
          fallbackUsed: true,
          locale,
          model: "deterministic-template",
          products,
          provider: "deterministic",
          senderIdentity: sender
        })
      : undefined;

  return {
    body: composition?.plainText ?? message.body,
    composition,
    contextUsed: request.context.hasWebsiteContext
      ? ["stored website context", "lead industry", "lead location", "selected products"]
      : ["lead industry", "lead location", "selected products"],
    fallbackUsed: true,
    message: {
      ...message,
      body: composition?.plainText ?? message.body,
      composition: composition ?? null,
      senderIdentityId: composition?.senderIdentityId ?? null,
      subject: composition?.subject ?? message.subject
    },
    mode: "deterministic",
    model: "deterministic-template",
    provider: "deterministic",
    subject: composition?.subject ?? message.subject,
    warnings: []
  };
}

export async function deliverOutreachMessage(
  state: LeadOpsWorkflowState
): Promise<OutreachDeliveryResult> {
  const validation = validateQueue(state);

  if (!validation.ok && validation.reason !== "already-sent") {
    return {
      error: validation.message,
      mode: "simulation",
      providerStatus: "blocked"
    };
  }

  const provider =
    process.env.EMAIL_DELIVERY_PROVIDER ?? process.env.OUTREACH_DELIVERY_PROVIDER ?? "simulation";

  if (provider === "brevo") {
    return {
      error: "Brevo delivery is available only through the protected test-email workflow.",
      mode: "brevo",
      providerStatus: "blocked"
    };
  }

  if (provider === "smartlead") {
    return {
      error: "Smartlead delivery is deprecated. Use EMAIL_DELIVERY_PROVIDER=simulation or the protected Brevo test workflow.",
      mode: "configuration-missing",
      providerStatus: "blocked"
    };
  }

  return {
    mode: "simulation",
    providerMessageId: `simulation-${state.lead.id}`,
    providerStatus: "sent"
  };
}
