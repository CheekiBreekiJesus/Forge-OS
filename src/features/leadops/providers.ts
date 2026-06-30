import {
  buildSequencePreview,
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
  mode: "simulation" | "smartlead" | "configuration-missing" | "provider-error";
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

  const provider = process.env.OUTREACH_DELIVERY_PROVIDER ?? "simulation";

  if (provider !== "smartlead") {
    return {
      mode: "simulation",
      providerMessageId: `simulation-${state.lead.id}`,
      providerStatus: "sent"
    };
  }

  const apiKey = process.env.SMARTLEAD_API_KEY;
  const apiBaseUrl = process.env.SMARTLEAD_API_BASE_URL;
  const campaignId = process.env.SMARTLEAD_DEFAULT_CAMPAIGN_ID;

  if (!apiKey || !apiBaseUrl || !campaignId) {
    return {
      error: "Smartlead delivery is selected but configuration is incomplete.",
      mode: "configuration-missing",
      providerStatus: "blocked"
    };
  }

  try {
    const endpoint = new URL(`/api/v1/campaigns/${campaignId}/leads`, apiBaseUrl);
    endpoint.searchParams.set("api_key", apiKey);

    const response = await fetch(endpoint, {
      body: JSON.stringify({
        lead_list: [
          {
            company_name: state.lead.companyName,
            custom_fields: {
              forgeos_lead_id: state.lead.id,
              forgeos_sequence_preview: buildSequencePreview(state.message)
                .map((step) => `${step.delay}: ${step.title}`)
                .join(" | ")
            },
            email: state.lead.email,
            first_name: state.lead.contactName.split(" ")[0] ?? state.lead.contactName,
            last_name: state.lead.contactName.split(" ").slice(1).join(" ")
          }
        ]
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    if (!response.ok) {
      return {
        error: "Smartlead rejected the delivery request.",
        mode: "provider-error",
        providerStatus: "failed"
      };
    }

    const payload = await response.json().catch(() => ({}));

    return {
      mode: "smartlead",
      providerMessageId: String(payload.id ?? payload.lead_id ?? `smartlead-${state.lead.id}`),
      providerStatus: "queued"
    };
  } catch {
    return {
      error: "Smartlead delivery request failed.",
      mode: "provider-error",
      providerStatus: "failed"
    };
  }
}
