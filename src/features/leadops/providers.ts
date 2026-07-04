import type {
  OutreachApprovedDeliveryRequest,
  OutreachApprovedDeliveryResult
} from "@/domain/outreach-approved-delivery";
import {
  mapWorkflowStateToApprovedDelivery
} from "@/domain/outreach-approved-delivery";
import { generatePtPtEmail } from "./workflow";
import { generateOutreachEmailWithAI } from "@/lib/ai/capabilities/outreach-email";
import { composeEmail } from "@/features/email-composition/renderer";
import { parseLegacyBodyOutput } from "@/lib/ai/capabilities/outreach-email-schema";
import type { CompanyProfileSnapshot, SenderIdentitySnapshot } from "@/domain/profile-types";
import type { ProductEmailSnapshot } from "@/domain/product-types";
import { readEmailDeliveryConfig } from "@/features/email-delivery/config";
import { SimulationEmailDeliveryProvider } from "@/features/email-delivery/simulation-provider";
import type {
  LeadOpsCampaign,
  LeadOpsCompanyContext,
  LeadOpsGeneratedMessage,
  LeadOpsLead,
  LeadOpsProductKey,
  LeadOpsTone,
  LeadOpsWorkflowState
} from "./types";
import { validateOutreachDelivery } from "./delivery-validation";

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

/** @deprecated Use OutreachApprovedDeliveryResult */
export type OutreachDeliveryResult = OutreachApprovedDeliveryResult;

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

export type OutreachDeliveryInvocation = {  invoked: boolean;
  provider: string;
};

/** Tracks whether a provider adapter was called — for tests only. */
let lastDeliveryInvocation: OutreachDeliveryInvocation | null = null;

export function readLastDeliveryInvocation(): OutreachDeliveryInvocation | null {
  return lastDeliveryInvocation;
}

export function resetDeliveryInvocationForTests(): void {
  lastDeliveryInvocation = null;
}

function blockDelivery(
  error: string,
  mode: OutreachApprovedDeliveryResult["mode"]
): OutreachApprovedDeliveryResult {
  lastDeliveryInvocation = { invoked: false, provider: mode };
  return {
    error,
    mode,
    providerStatus: "blocked"
  };
}

export async function deliverApprovedOutreachMessage(
  request: OutreachApprovedDeliveryRequest
): Promise<OutreachApprovedDeliveryResult> {
  const provider =
    process.env.EMAIL_DELIVERY_PROVIDER?.trim().toLowerCase() ??
    process.env.OUTREACH_DELIVERY_PROVIDER?.trim().toLowerCase() ??
    "simulation";

  if (provider === "brevo") {
    return blockDelivery(
      "Brevo delivery is available only through the protected test-email workflow.",
      "brevo"
    );
  }

  if (provider === "smartlead") {
    return deliverViaSmartlead();
  }

  return deliverViaSimulation(request);
}

async function deliverViaSimulation(
  request: OutreachApprovedDeliveryRequest
): Promise<OutreachApprovedDeliveryResult> {
  const config = readEmailDeliveryConfig();
  const simulation = new SimulationEmailDeliveryProvider(config);

  lastDeliveryInvocation = { invoked: true, provider: "simulation" };

  const response = await simulation.send({
    tenantId: request.tenantId,
    campaignId: request.campaignId,
    campaignRecipientId: request.messageId,
    leadId: request.leadId,
    approvedContentHash: request.messageVersion,
    idempotencyKey: request.idempotencyKey,
    toEmail: request.recipientEmail,
    toName: request.recipientName,
    subject: request.approvedSubject,
    plainText: request.approvedPlainText,
    html: request.approvedHtml,
    initiatedBy: "outreach-delivery",
    mode: "simulation"
  });

  if (response.status === "accepted") {
    return {
      deliveredHtml: request.approvedHtml,
      deliveredPlainText: request.approvedPlainText,
      deliveredSubject: request.approvedSubject,
      mode: "simulation",
      providerMessageId: response.providerMessageId ?? `simulation-${request.idempotencyKey}`,
      providerStatus: "sent"
    };
  }

  return {
    error: response.errorMessage ?? "Simulation delivery blocked.",
    mode: "simulation",
    providerStatus: "blocked"
  };
}

async function deliverViaSmartlead(): Promise<OutreachApprovedDeliveryResult> {
  const apiKey = process.env.SMARTLEAD_API_KEY?.trim();
  const campaignId = process.env.SMARTLEAD_DEFAULT_CAMPAIGN_ID?.trim();

  if (!apiKey || !campaignId) {
    return blockDelivery(
      "Smartlead is not configured. Set SMARTLEAD_API_KEY and SMARTLEAD_DEFAULT_CAMPAIGN_ID or use simulation.",
      "configuration-missing"
    );
  }

  // Repository documents Smartlead via campaign templates — exact ForgeOS body mapping
  // requires documented custom-field names. Without them, block live delivery.
  const subjectField = process.env.SMARTLEAD_SUBJECT_FIELD?.trim();
  const bodyField = process.env.SMARTLEAD_BODY_FIELD?.trim();

  if (!subjectField || !bodyField) {
    return blockDelivery(
      "Smartlead exact-content delivery requires SMARTLEAD_SUBJECT_FIELD and SMARTLEAD_BODY_FIELD. Without documented mapping, live send is blocked.",
      "unsupported-exact-content"
    );
  }

  lastDeliveryInvocation = { invoked: true, provider: "smartlead" };

  // Adapter boundary only — no undocumented API calls in this release slice.
  return blockDelivery(
    "Smartlead live adapter is not enabled in this release. Configure simulation delivery instead.",
    "unsupported-exact-content"
  );
}

export async function deliverOutreachMessage(
  state: LeadOpsWorkflowState,
  options?: { messageId?: string; messageVersion?: string }
): Promise<OutreachApprovedDeliveryResult> {
  const validation = validateOutreachDelivery(state);

  if (!validation.ok) {
    return blockDelivery(validation.message, "simulation");
  }

  const messageId = options?.messageId ?? `msg_${state.lead.id}`;
  const messageVersion =
    options?.messageVersion ??
    `${state.message!.subject.trim().length}:${state.message!.body.trim().length}`;

  const request = mapWorkflowStateToApprovedDelivery(state, messageId, messageVersion);
  if (!request) {
    return blockDelivery("Invalid outreach delivery request.", "simulation");
  }

  return deliverApprovedOutreachMessage(request);
}
