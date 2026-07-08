import fs from "node:fs";
import path from "node:path";
import { getAIConfig } from "../../src/lib/ai/config";
import type { ModelCatalogEntry } from "../../src/lib/ai/types";
import {
  abacusFamily,
  deprecatedAbacusModels,
  discoverAbacusModels,
  fallbackAbacusModels,
  loadDotEnvLocal,
  parseArgs,
  resolvePythonBin
} from "./shared";

loadDotEnvLocal();

const args = parseArgs(process.argv.slice(2));
const provider = String(args.get("provider") || "abacus");
const config = getAIConfig();

async function main() {
  if (provider === "abacus" || provider === "all") {
    writeAbacusCatalog();
  }

  if (provider === "ollama" || provider === "all") {
    await writeOllamaCatalog();
  }
}

function writeAbacusCatalog() {
  const discovered = discoverAbacusModels(
    resolvePythonBin(config.providers.abacus.pythonBin)
  );
  const models = discovered.models.length ? discovered.models : fallbackAbacusModels;
  const entries: ModelCatalogEntry[] = models.map((model) => ({
    deprecated: deprecatedAbacusModels.includes(model),
    family: abacusFamily(model),
    id: model,
    provider: "abacus"
  }));
  const catalog = {
    discoveredSdkVersion: discovered.version,
    generatedAt: new Date().toISOString(),
    sdkAvailable: discovered.ok,
    source: discovered.ok ? "abacusai.LLMName" : "bundled-fallback",
    models: entries
  };
  const outPath = path.join(process.cwd(), "config", "ai", "catalogs", "abacus.generated.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`abacus models: ${entries.length} (${catalog.source})`);
}

async function writeOllamaCatalog() {
  const baseUrl = config.providers.ollama.baseUrl ?? "http://127.0.0.1:11434";
  const outPath = path.join(process.cwd(), "config", "ai", "catalogs", "ollama.generated.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  try {
    const response = await fetch(new URL("/api/tags", baseUrl));
    const payload = response.ok ? ((await response.json()) as { models?: Array<{ name?: string }> }) : {};
    const models = (payload.models ?? [])
      .filter((model): model is { name: string } => typeof model.name === "string")
      .map((model) => ({ deprecated: false, family: "local", id: model.name, provider: "ollama" }));
    fs.writeFileSync(
      outPath,
      `${JSON.stringify({ generatedAt: new Date().toISOString(), models, serverAvailable: response.ok }, null, 2)}\n`
    );
    console.log(`ollama models: ${models.length}`);
  } catch {
    fs.writeFileSync(
      outPath,
      `${JSON.stringify({ generatedAt: new Date().toISOString(), models: [], serverAvailable: false }, null, 2)}\n`
    );
    console.log("ollama models: 0 (server unavailable)");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "model catalog failed");
  process.exitCode = 1;
});
