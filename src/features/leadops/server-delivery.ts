import type {
  OutreachApprovedDeliveryRequest,
  OutreachApprovedDeliveryResult
} from "@/domain/outreach-approved-delivery";
import { mapWorkflowStateToApprovedDelivery } from "@/domain/outreach-approved-delivery";
import { readEmailDeliveryConfig } from "@/features/email-delivery/config";
import { assertServerOnlyModule } from "@/features/email-delivery/server-only";
import { SimulationEmailDeliveryProvider } from "@/features/email-delivery/simulation-provider";
import { validateOutreachDelivery } from "./delivery-validation";
import type { LeadOpsWorkflowState } from "./types";

assertServerOnlyModule();

export type OutreachDeliveryInvocation = {
  invoked: boolean;
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

  const subjectField = process.env.SMARTLEAD_SUBJECT_FIELD?.trim();
  const bodyField = process.env.SMARTLEAD_BODY_FIELD?.trim();

  if (!subjectField || !bodyField) {
    return blockDelivery(
      "Smartlead exact-content delivery requires SMARTLEAD_SUBJECT_FIELD and SMARTLEAD_BODY_FIELD. Without documented mapping, live send is blocked.",
      "unsupported-exact-content"
    );
  }

  lastDeliveryInvocation = { invoked: true, provider: "smartlead" };

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
