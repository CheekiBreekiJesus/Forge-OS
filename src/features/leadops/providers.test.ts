import { afterEach, describe, expect, it, vi } from "vitest";
import * as python from "@/lib/ai/python";
import {
  deliverApprovedOutreachMessage,
  deliverOutreachMessage,
  readLastDeliveryInvocation,
  resetDeliveryInvocationForTests
} from "./server-delivery";
import { generateOutreachEmail } from "./providers";
import {
  getTenantCampaigns,
  leadOpsLeads,
  LEADOPS_DEMO_TENANT_ID
} from "./seed";
import type { LeadOpsWorkflowState } from "./types";
import { generatePtPtEmail, getCompanyContext } from "./workflow";
import type { OutreachApprovedDeliveryRequest } from "@/domain/outreach-approved-delivery";

const lead = leadOpsLeads.find((item) => item.id === "leadops_001")!;
const campaign = getTenantCampaigns(LEADOPS_DEMO_TENANT_ID)[0]!;

function buildApprovedState(overrides: Partial<LeadOpsWorkflowState> = {}): LeadOpsWorkflowState {
  const message = {
    ...generatePtPtEmail({
      campaign,
      context: getCompanyContext(lead),
      lead,
      productKeys: ["customized-plastic-cups"],
      tone: "professional"
    }),
    approved: true
  };

  return {
    activities: [],
    campaign,
    lead,
    message,
    metricsUpdated: false,
    providerState: "queued",
    queuedAt: "2026-06-30T10:00:00.000Z",
    sentAt: null,
    ...overrides
  };
}

function buildDeliveryRequest(
  overrides: Partial<OutreachApprovedDeliveryRequest> = {}
): OutreachApprovedDeliveryRequest {
  const state = buildApprovedState();
  return {
    tenantId: lead.tenantId,
    messageId: "msg_test_001",
    leadId: lead.id,
    campaignId: campaign.id,
    recipientEmail: lead.email,
    recipientName: lead.contactName,
    companyName: lead.companyName,
    approvedSubject: state.message!.subject,
    approvedPlainText: state.message!.body,
    messageVersion: "content-v1",
    idempotencyKey: "outreach-send:tenant:msg:content-v1",
    ...overrides
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  resetDeliveryInvocationForTests();
});

describe("LeadOps providers", () => {
  it("uses deterministic generation when Abacus is not configured", async () => {
    vi.stubEnv("AI_OUTREACH_PROVIDER", "abacus");
    vi.stubEnv("ABACUS_API_KEY", "");

    const result = await generateOutreachEmail({
      campaign,
      context: getCompanyContext(lead),
      lead,
      productKeys: ["customized-plastic-cups"],
      tone: "friendly"
    });

    expect(result.mode).toBe("fallback");
    expect(result.fallbackUsed).toBe(true);
    expect(result.message.body).toContain("copos de plástico personalizados");
  });

  it("falls back safely when Abacus is unavailable", async () => {
    vi.spyOn(python, "resolvePythonBin").mockReturnValue("missing-python-bin");
    vi.stubEnv("AI_OUTREACH_PROVIDER", "abacus");
    vi.stubEnv("ABACUS_API_KEY", "test-key");
    vi.stubEnv("ABACUS_PYTHON_BIN", "missing-python-bin");

    const result = await generateOutreachEmail({
      campaign,
      context: getCompanyContext(lead),
      lead,
      productKeys: ["customized-plastic-cups"],
      tone: "direct"
    });

    expect(result.mode).toBe("fallback");
    expect(result.message.generationMethod).toBe("deterministic-fallback");
    expect(result.provider).toBe("deterministic");
  });

  it("simulation delivery returns exact approved subject and body", async () => {
    const request = buildDeliveryRequest({
      approvedSubject: "Exact Subject Line",
      approvedPlainText: "Exact body paragraph one.\n\nExact body paragraph two."
    });

    const result = await deliverApprovedOutreachMessage(request);

    expect(result.mode).toBe("simulation");
    expect(result.providerStatus).toBe("sent");
    expect(result.deliveredSubject).toBe("Exact Subject Line");
    expect(result.deliveredPlainText).toBe("Exact body paragraph one.\n\nExact body paragraph two.");
    expect(readLastDeliveryInvocation()?.invoked).toBe(true);
  });

  it("uses simulation delivery by default", async () => {
    const result = await deliverOutreachMessage(buildApprovedState());

    expect(result.mode).toBe("simulation");
    expect(result.providerStatus).toBe("sent");
    expect(result.deliveredSubject).toBe(buildApprovedState().message!.subject);
    expect(result.deliveredPlainText).toBe(buildApprovedState().message!.body);
  });

  it("blocks already-sent messages without invoking provider", async () => {
    const sentState = buildApprovedState({
      providerState: "sent",
      sentAt: "2026-06-30T11:00:00.000Z"
    });

    const result = await deliverOutreachMessage(sentState);

    expect(result.providerStatus).toBe("blocked");
    expect(result.error).toContain("já enviada");
    expect(readLastDeliveryInvocation()?.invoked).toBe(false);
  });

  it("blocks unapproved messages without invoking provider", async () => {
    const state = buildApprovedState({
      message: {
        ...buildApprovedState().message!,
        approved: false
      }
    });

    const result = await deliverOutreachMessage(state);

    expect(result.providerStatus).toBe("blocked");
    expect(result.error).toContain("aprovação");
    expect(readLastDeliveryInvocation()?.invoked).toBe(false);
  });

  it("blocks bounced leads without invoking provider", async () => {
    const state = buildApprovedState({
      lead: { ...lead, status: "bounced" }
    });

    const result = await deliverOutreachMessage(state);

    expect(result.providerStatus).toBe("blocked");
    expect(readLastDeliveryInvocation()?.invoked).toBe(false);
  });

  it("reports missing Smartlead configuration without sending", async () => {
    vi.stubEnv("OUTREACH_DELIVERY_PROVIDER", "smartlead");
    vi.stubEnv("SMARTLEAD_API_KEY", "");

    const result = await deliverOutreachMessage(buildApprovedState());

    expect(result.mode).toBe("configuration-missing");
    expect(result.providerStatus).toBe("blocked");
    expect(readLastDeliveryInvocation()?.invoked).toBe(false);
  });

  it("blocks Smartlead without exact-content field mapping", async () => {
    vi.stubEnv("OUTREACH_DELIVERY_PROVIDER", "smartlead");
    vi.stubEnv("SMARTLEAD_API_KEY", "test-key");
    vi.stubEnv("SMARTLEAD_DEFAULT_CAMPAIGN_ID", "camp-1");

    const result = await deliverOutreachMessage(buildApprovedState());

    expect(result.mode).toBe("unsupported-exact-content");
    expect(result.providerStatus).toBe("blocked");
    expect(readLastDeliveryInvocation()?.invoked).toBe(false);
  });
});
