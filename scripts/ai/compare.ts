import fs from "node:fs";
import path from "node:path";
import { generateOutreachEmailWithAI } from "../../src/lib/ai/capabilities/outreach-email";
import { loadDotEnvLocal, parseArgs } from "./shared";

loadDotEnvLocal();

const args = parseArgs(process.argv.slice(2));
const live = Boolean(args.get("live"));
const models = String(args.get("models") || "")
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

async function main() {
  if (!live) {
    console.log("Model comparison requires --live because it consumes provider credits.");
    return;
  }

  if (models.length > 3 && !args.get("confirm-more-than-three")) {
    console.log("Refusing more than three model calls without --confirm-more-than-three.");
    return;
  }

  const results = [];

  for (const model of models.slice(0, args.get("confirm-more-than-three") ? models.length : 3)) {
    process.env.ABACUS_MODEL = model;
    const start = Date.now();
    const result = await generateOutreachEmailWithAI({
      campaign: {
        id: "campaign_compare",
        name: "Synthetic personalized cups outreach",
        sentCount: 0,
        status: "active",
        tenantId: "tenant_compare",
        totalCount: 1
      },
      context: {
        hasWebsiteContext: false,
        personalizationNotes: ["Synthetic comparison fixture."],
        summary: "No website context is available."
      },
      lead: {
        campaignId: null,
        companyName: "Example Events Lda",
        consentStatus: "subscribed",
        contactName: "Rita Example",
        email: "rita@example.invalid",
        id: "lead_compare",
        industry: "Events",
        language: "pt-PT",
        location: "Lisbon, Portugal",
        providerState: "not_ready",
        quality: "high",
        source: "Synthetic",
        sourceDatabase: "synthetic",
        status: "ready",
        tenantId: "tenant_compare",
        website: null
      },
      productKeys: ["customized-plastic-cups"],
      tone: "professional"
    });
    results.push({
      fallbackUsed: result.fallbackUsed,
      latencyMs: Date.now() - start,
      model,
      provider: result.provider,
      structuredOutputValid: Boolean(result.subject && result.body),
      subject: result.subject,
      body: result.body,
      warnings: result.warnings
    });
  }

  const outDir = path.join(process.cwd(), "qa", "ai");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `model-compare-${Date.now()}.json`);
  fs.writeFileSync(outPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`);
  console.log(`saved sanitized comparison: ${outPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "model comparison failed");
  process.exitCode = 1;
});
