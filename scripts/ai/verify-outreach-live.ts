import { generateOutreachEmailWithAI } from "../../src/lib/ai/capabilities/outreach-email";
import { loadDotEnvLocal } from "./shared";

loadDotEnvLocal();

async function main() {
  const start = Date.now();
  const result = await generateOutreachEmailWithAI({
    campaign: {
      id: "campaign_synthetic",
      name: "Synthetic outreach verification",
      sentCount: 0,
      status: "active",
      tenantId: "tenant_verification",
      totalCount: 1
    },
    context: {
      hasWebsiteContext: false,
      personalizationNotes: ["Synthetic verification only."],
      summary: "No website context. Use only synthetic lead fields."
    },
    lead: {
      campaignId: null,
      companyName: "Example Hospitality Group",
      consentStatus: "subscribed",
      contactName: "Ana Example",
      email: "ana@example.invalid",
      id: "lead_verification",
      industry: "Hospitality",
      language: "pt-PT",
      location: "Porto, Portugal",
      providerState: "not_ready",
      quality: "high",
      source: "Synthetic",
      sourceDatabase: "verification",
      status: "ready",
      tenantId: "tenant_verification",
      website: null
    },
    productKeys: ["customized-plastic-cups"],
    tone: "professional"
  });

  console.log(
    JSON.stringify(
      {
        fallbackUsed: result.fallbackUsed,
        latencyMs: Date.now() - start,
        model: result.model,
        provider: result.provider,
        subjectLength: result.subject.length,
        bodyContainsCups: result.body.toLowerCase().includes("copo"),
        bodyPreview: result.body.slice(0, 120),
        warnings: result.warnings
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "verification failed");
  process.exitCode = 1;
});
