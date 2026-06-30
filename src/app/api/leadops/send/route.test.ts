import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { getTenantCampaigns, leadOpsLeads, LEADOPS_DEMO_TENANT_ID } from "@/features/leadops/seed";
import { generatePtPtEmail, getCompanyContext } from "@/features/leadops/workflow";

const lead = leadOpsLeads.find((item) => item.id === "leadops_001")!;
const campaign = getTenantCampaigns(LEADOPS_DEMO_TENANT_ID)[0]!;

function approvedWorkflowState() {
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
});

describe("/api/leadops/send", () => {
  it("delivers through simulation by default and returns sent status", async () => {
    const request = new Request("http://localhost/api/leadops/send", {
      body: JSON.stringify(approvedWorkflowState()),
      method: "POST"
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.mode).toBe("simulation");
    expect(payload.providerStatus).toBe("sent");
    expect(payload.providerMessageId).toContain("simulation-");
  });

  it("returns 400 for an empty body", async () => {
    const request = new Request("http://localhost/api/leadops/send", {
      body: "{}",
      method: "POST"
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("returns 400 when the message is not approved", async () => {
    const state = approvedWorkflowState();
    state.message.approved = false;

    const request = new Request("http://localhost/api/leadops/send", {
      body: JSON.stringify(state),
      method: "POST"
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("returns 400 when tenant IDs do not match", async () => {
    const state = approvedWorkflowState();
    state.campaign = { ...campaign, tenantId: "tenant_other" };

    const request = new Request("http://localhost/api/leadops/send", {
      body: JSON.stringify(state),
      method: "POST"
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("reports blocked when Smartlead is selected but not configured", async () => {
    vi.stubEnv("OUTREACH_DELIVERY_PROVIDER", "smartlead");
    vi.stubEnv("SMARTLEAD_API_KEY", "");

    const request = new Request("http://localhost/api/leadops/send", {
      body: JSON.stringify(approvedWorkflowState()),
      method: "POST"
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.mode).toBe("configuration-missing");
    expect(payload.providerStatus).toBe("blocked");
  });
});
