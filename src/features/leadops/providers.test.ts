import { afterEach, describe, expect, it, vi } from "vitest";
import * as python from "@/lib/ai/python";
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
