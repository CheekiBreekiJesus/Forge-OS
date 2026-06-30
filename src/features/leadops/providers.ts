import {
  buildSequencePreview,
  generatePtPtEmail,
  validateQueue
} from "./workflow";
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
};

export type OutreachGenerationResult = {
  message: LeadOpsGeneratedMessage;
  mode: "deterministic" | "openai" | "fallback";
  warning?: string;
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
  return {
    message: generatePtPtEmail(request),
    mode: "deterministic"
  };
}

export async function generateOutreachEmail(
  request: OutreachGenerationRequest
): Promise<OutreachGenerationResult> {
  const deterministic = generateDeterministicOutreachEmail(request);
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_OUTREACH_MODEL;

  if (!apiKey || !model) {
    return deterministic;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      body: JSON.stringify({
        input: buildOpenAiPrompt(request),
        model,
        text: {
          format: {
            name: "outreach_email",
            schema: {
              additionalProperties: false,
              properties: {
                body: { type: "string" },
                subject: { type: "string" }
              },
              required: ["subject", "body"],
              type: "object"
            },
            type: "json_schema"
          }
        }
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    if (!response.ok) {
      return fallbackWithWarning(deterministic, "OpenAI generation failed; deterministic fallback used.");
    }

    const payload = await response.json();
    const parsed = parseOpenAiMessage(payload);

    if (!parsed) {
      return fallbackWithWarning(
        deterministic,
        "OpenAI returned invalid content; deterministic fallback used."
      );
    }

    return {
      message: {
        ...deterministic.message,
        approved: false,
        body: parsed.body,
        edited: false,
        generationMethod: "openai",
        subject: parsed.subject
      },
      mode: "openai"
    };
  } catch {
    return fallbackWithWarning(deterministic, "OpenAI request failed; deterministic fallback used.");
  }
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

function fallbackWithWarning(
  deterministic: OutreachGenerationResult,
  warning: string
): OutreachGenerationResult {
  return {
    message: {
      ...deterministic.message,
      generationMethod: "deterministic-fallback",
      providerNotice: warning
    },
    mode: "fallback",
    warning
  };
}

function buildOpenAiPrompt(request: OutreachGenerationRequest): string {
  const selectedProducts = request.productKeys.join(", ");
  const websiteContext = request.context.hasWebsiteContext
    ? request.context.summary
    : "No stored website context. Do not claim website review.";

  return [
    "Generate a concise European Portuguese cold outreach email for ForgeOS Outreach.",
    "Return only JSON with subject and body.",
    "Keep JH Gomes personalized plastic cups as the main offer.",
    "Avoid unverifiable claims, fake urgency, discounts, invented customers, certifications, delivery dates, or production capacity.",
    "Mention secondary products only when relevant.",
    `Lead: ${request.lead.companyName}, contact ${request.lead.contactName}, industry ${request.lead.industry}, location ${request.lead.location}.`,
    `Campaign objective: ${request.campaign.name}.`,
    `Tone: ${request.tone}.`,
    `Selected products: ${selectedProducts}.`,
    `Stored company context: ${websiteContext}.`
  ].join("\n");
}

function parseOpenAiMessage(payload: unknown): { body: string; subject: string } | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const maybeOutputText = (payload as { output_text?: unknown }).output_text;
  const text = typeof maybeOutputText === "string" ? maybeOutputText : "";

  try {
    const parsed = JSON.parse(text) as { body?: unknown; subject?: unknown };

    if (
      typeof parsed.subject === "string" &&
      parsed.subject.trim().length > 0 &&
      typeof parsed.body === "string" &&
      parsed.body.trim().length > 0
    ) {
      return {
        body: parsed.body.trim(),
        subject: parsed.subject.trim()
      };
    }
  } catch {
    return null;
  }

  return null;
}
