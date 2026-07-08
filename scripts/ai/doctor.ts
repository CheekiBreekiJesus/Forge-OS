import fs from "node:fs";
import { getAIConfig } from "../../src/lib/ai/config";
import { generateOutreachEmailWithAI } from "../../src/lib/ai/capabilities/outreach-email";
import {
  discoverAbacusModels,
  fallbackAbacusModels,
  loadDotEnvLocal,
  parseArgs,
  resolvePythonBin
} from "./shared";

loadDotEnvLocal();

const args = parseArgs(process.argv.slice(2));
const provider = String(args.get("provider") || "abacus");
const live = Boolean(args.get("live"));
const config = getAIConfig();

async function main() {
  const lines: string[] = [];
  lines.push(`active provider: ${config.outreach.provider}`);
  lines.push(`fallback provider: ${config.fallbackProvider}`);
  lines.push(`outreach profile: ${config.outreach.profileId}`);

  if (provider === "abacus") {
    const abacus = config.providers.abacus;
    const pythonBin = resolvePythonBin(abacus.pythonBin);
    const discovered = discoverAbacusModels(pythonBin);
    const models = discovered.models.length ? discovered.models : fallbackAbacusModels;
    lines.push(`python command: ${pythonBin}`);
    lines.push(`abacus sdk available: ${discovered.ok}`);
    lines.push(`abacus sdk version: ${discovered.version ?? "unavailable"}`);
    lines.push(`abacus api key present: ${Boolean(abacus.apiKey && !abacus.apiKey.includes("replace-with"))}`);
    lines.push(`abacus model selected: ${abacus.model ?? "missing"}`);
    lines.push(`abacus model in local catalog: ${models.includes(abacus.model ?? "")}`);
    lines.push(`python bridge present: ${fs.existsSync("scripts/ai/abacus_bridge.py")}`);
  }

  if (live) {
    if (provider !== "abacus") {
      lines.push("live check skipped: only Abacus live doctor is implemented.");
    } else if (!config.providers.abacus.apiKey || config.providers.abacus.apiKey.includes("replace-with")) {
      lines.push("live check skipped: Abacus API key is missing.");
    } else {
      const start = Date.now();
      const result = await generateOutreachEmailWithAI({
        campaign: {
          id: "campaign_synthetic",
          name: "Synthetic outreach diagnostic",
          sentCount: 0,
          status: "active",
          tenantId: "tenant_diagnostic",
          totalCount: 1
        },
        context: {
          hasWebsiteContext: false,
          personalizationNotes: ["Synthetic diagnostic only."],
          summary: "No website context. Use only synthetic lead fields."
        },
        lead: {
          campaignId: null,
          companyName: "Example Hospitality Group",
          consentStatus: "subscribed",
          contactName: "Ana Example",
          email: "ana@example.invalid",
          id: "lead_diagnostic",
          industry: "Hospitality",
          language: "pt-PT",
          location: "Porto, Portugal",
          providerState: "not_ready",
          quality: "high",
          source: "Synthetic",
          sourceDatabase: "diagnostic",
          status: "ready",
          tenantId: "tenant_diagnostic",
          website: null
        },
        productKeys: ["customized-plastic-cups"],
        tone: "professional"
      });
      lines.push(`live check success: ${!result.fallbackUsed}`);
      lines.push(`live provider: ${result.provider}`);
      lines.push(`live model: ${result.model}`);
      lines.push(`live latency ms: ${Date.now() - start}`);
      lines.push(`structured output valid: ${Boolean(result.subject && result.body)}`);
      lines.push(`fallback used: ${result.fallbackUsed}`);
      if (result.fallbackUsed) {
        process.exitCode = 1;
      }
    }
  }

  console.log(lines.join("\n"));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "doctor failed");
  process.exitCode = 1;
});
