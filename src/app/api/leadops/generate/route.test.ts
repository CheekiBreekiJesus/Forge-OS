import { describe, expect, it, vi, afterEach } from "vitest";
import { POST } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("/api/leadops/generate", () => {
  it("generates through the AI gateway and returns safe provider metadata", async () => {
    vi.stubEnv("AI_OUTREACH_PROVIDER", "abacus");
    vi.stubEnv("ABACUS_API_KEY", "");

    const request = new Request("http://localhost/api/leadops/generate", {
      body: JSON.stringify({
        campaign: {
          id: "campaign_test",
          name: "Synthetic outreach",
          sentCount: 0,
          status: "active",
          tenantId: "tenant_test",
          totalCount: 1
        },
        context: {
          hasWebsiteContext: false,
          personalizationNotes: [],
          summary: "No website context."
        },
        lead: {
          campaignId: null,
          companyName: "Example Hospitality Group",
          consentStatus: "subscribed",
          contactName: "Ana Example",
          email: "ana@example.invalid",
          id: "lead_test",
          industry: "Hospitality",
          language: "pt-PT",
          location: "Porto, Portugal",
          providerState: "not_ready",
          quality: "high",
          source: "Synthetic",
          sourceDatabase: "synthetic",
          status: "ready",
          tenantId: "tenant_test",
          website: null
        },
        productKeys: ["customized-plastic-cups"],
        tone: "professional"
      }),
      method: "POST"
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.message.body).toContain("copos de plástico personalizados");
    expect(payload.provider).toBe("deterministic");
    expect(JSON.stringify(payload)).not.toContain("test-key");
  });
});
