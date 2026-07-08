import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { resolvePythonBin } from "../../src/lib/ai/python";

export function parseArgs(argv: string[]) {
  const args = new Map<string, string | boolean>();

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index]!;
    if (!item.startsWith("--")) {
      continue;
    }

    const key = item.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith("--")) {
      args.set(key, true);
      continue;
    }

    args.set(key, next);
    index += 1;
  }

  return args;
}

export function loadDotEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) {
      continue;
    }

    const [key, ...rest] = line.split("=");
    const value = rest.join("=");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

export const fallbackAbacusModels = [
  "OPENAI_GPT4O",
  "OPENAI_GPT4O_MINI",
  "OPENAI_O3",
  "OPENAI_O4_MINI",
  "OPENAI_GPT5",
  "OPENAI_GPT5_MINI",
  "OPENAI_GPT5_4",
  "OPENAI_GPT5_4_MINI",
  "CLAUDE_V4_6_SONNET",
  "CLAUDE_V4_6_OPUS",
  "GEMINI_3_PRO",
  "GEMINI_3_FLASH",
  "XAI_GROK_4",
  "LLAMA3_3_70B",
  "ABACUS_SMAUG3",
  "ABACUS_DRACARYS",
  "QWEN3_32B",
  "DEEPSEEK_R1"
];

export const deprecatedAbacusModels = [
  "OPENAI_GPT3_5",
  "OPENAI_GPT4",
  "OPENAI_O1_MINI",
  "GEMINI_1_5_PRO",
  "XAI_GROK",
  "CLAUDE_V3_HAIKU",
  "CLAUDE_V4_SONNET",
  "LLAMA3_LARGE_CHAT",
  "QWEN_2_5_32B_BASE"
];

export { resolvePythonBin } from "../../src/lib/ai/python";

export function discoverAbacusModels(pythonBin: string) {
  const resolved = resolvePythonBin(pythonBin);
  const script = [
    "import json",
    "try:",
    " from importlib.metadata import version",
    " from abacusai import LLMName",
    " models=[]",
    " for name in dir(LLMName):",
    "  if name.startswith('_'): continue",
    "  value=getattr(LLMName,name)",
    "  if isinstance(value,str):",
    "   models.append(value)",
    "  elif hasattr(value,'value'):",
    "   models.append(value.value)",
    " print(json.dumps({'ok': True, 'version': version('abacusai'), 'models': sorted(set(models))}))",
    "except Exception:",
    " print(json.dumps({'ok': False, 'version': None, 'models': []}))"
  ].join("\n");
  const result = spawnSync(resolved, ["-c", script], {
    encoding: "utf8",
    windowsHide: true
  });

  try {
    const parsed = JSON.parse(result.stdout || "{}") as {
      models?: string[];
      ok?: boolean;
      version?: string | null;
    };

    return {
      models: parsed.models ?? [],
      ok: Boolean(parsed.ok),
      version: parsed.version ?? null
    };
  } catch {
    return { models: [], ok: false, version: null };
  }
}

export function abacusFamily(model: string): string {
  if (model.startsWith("OPENAI_")) return "OpenAI";
  if (model.startsWith("CLAUDE_")) return "Anthropic Claude";
  if (model.startsWith("GEMINI_")) return "Google Gemini";
  if (model.startsWith("XAI_")) return "xAI";
  if (model.startsWith("LLAMA")) return "Meta Llama";
  if (model.startsWith("QWEN") || model.startsWith("QWQ")) return "Qwen";
  if (model.startsWith("DEEPSEEK")) return "DeepSeek";
  if (model.startsWith("ABACUS")) return "Abacus";
  return "Other";
}
