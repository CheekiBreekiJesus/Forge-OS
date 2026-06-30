import { afterEach, describe, expect, it, vi } from "vitest";
import { deliverOutreachMessage, generateOutreachEmail } from "./providers";
import {
  getTenantCampaigns,
  leadOpsLeads,
  LEADOPS_DEMO_TENANT_ID
} from "./seed";
import type { LeadOpsWorkflowState } from "./types";
import { generatePtPtEmail, getCompanyContext } from "./workflow";

const lead = leadOpsLeads.find((item) => item.id === "leadops_001")!;
const campaign = getTenantCampaigns(LEADOPS_DEMO_TENANT_ID)[0]!;

function buildApprovedState(): LeadOpsWorkflowState {
  return {
    activities: [],
    campaign,
    lead,
    message: {
      ...generatePtPtEmail({
        campaign,
        context: getCompanyContext(lead),
        lead,
        productKeys: ["customized-plastic-cups"],
        tone: "professional"
      }),
      approved: true
    },
    metricsUpdated: false,
    providerState: "queued",
    queuedAt: "2026-06-30T10:00:00.000Z",
    sentAt: null
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("LeadOps providers", () => {
  it("uses deterministic generation when OpenAI is not configured", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("OPENAI_OUTREACH_MODEL", "");

    const result = await generateOutreachEmail({
      campaign,
      context: getCompanyContext(lead),
      lead,
      productKeys: ["customized-plastic-cups"],
      tone: "friendly"
    });

    expect(result.mode).toBe("deterministic");
    expect(result.message.body).toContain("copos de plástico personalizados");
  });

  it("falls back safely when OpenAI fails", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("OPENAI_OUTREACH_MODEL", "test-model");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false
      })
    );

    const result = await generateOutreachEmail({
      campaign,
      context: getCompanyContext(lead),
      lead,
      productKeys: ["customized-plastic-cups"],
      tone: "direct"
    });

    expect(result.mode).toBe("fallback");
    expect(result.message.generationMethod).toBe("deterministic-fallback");
  });

  it("uses simulation delivery by default", async () => {
    const result = await deliverOutreachMessage(buildApprovedState());

    expect(result.mode).toBe("simulation");
    expect(result.providerStatus).toBe("sent");
  });

  it("reports missing Smartlead configuration without sending", async () => {
    vi.stubEnv("OUTREACH_DELIVERY_PROVIDER", "smartlead");
    vi.stubEnv("SMARTLEAD_API_KEY", "");

    const result = await deliverOutreachMessage(buildApprovedState());

    expect(result.mode).toBe("configuration-missing");
    expect(result.providerStatus).toBe("blocked");
  });
});
