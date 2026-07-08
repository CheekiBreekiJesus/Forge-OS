import { getCapabilityProfile } from "./capabilities/profiles";
import type {
  AICapabilityProfile,
  AIProviderId,
  AIReasoningPreference,
  AISpeedPreference,
  ProviderRuntimeConfig
} from "./types";

export type AIAppConfig = {
  allowBrowserProviderSelection: boolean;
  defaultProvider: AIProviderId;
  fallbackProvider: AIProviderId;
  logPrompts: boolean;
  logResponses: boolean;
  maxRetries: number;
  outreach: {
    profile: AICapabilityProfile;
    profileId: string;
    provider: AIProviderId;
  };
  providers: Record<AIProviderId, ProviderRuntimeConfig>;
  requestTimeoutMs: number;
};

const providerIds: AIProviderId[] = [
  "deterministic",
  "abacus",
  "openai",
  "anthropic",
  "google",
  "deepseek",
  "xai",
  "mistral",
  "groq",
  "openrouter",
  "together",
  "ollama",
  "lmstudio",
  "vllm"
];

export function getAIConfig(env: Record<string, string | undefined> = process.env): AIAppConfig {
  const baseProfile = getCapabilityProfile(env.AI_OUTREACH_PROFILE);
  const outreachProfile = applyCapabilityEnvOverrides(baseProfile, env);
  const defaultProvider = parseProvider(env.AI_DEFAULT_PROVIDER, "abacus");
  const fallbackProvider = parseProvider(env.AI_FALLBACK_PROVIDER, "deterministic");

  return {
    allowBrowserProviderSelection: parseBoolean(env.AI_ALLOW_BROWSER_PROVIDER_SELECTION, false),
    defaultProvider,
    fallbackProvider,
    logPrompts: parseBoolean(env.AI_LOG_PROMPTS, false),
    logResponses: parseBoolean(env.AI_LOG_RESPONSES, false),
    maxRetries: parseNumber(env.AI_MAX_RETRIES, 2),
    outreach: {
      profile: outreachProfile,
      profileId: env.AI_OUTREACH_PROFILE || "outreach-fast",
      provider: parseProvider(env.AI_OUTREACH_PROVIDER, defaultProvider)
    },
    providers: {
      abacus: providerRuntime("ABACUS", env, {
        model: "OPENAI_GPT5_4_MINI",
        pythonBin: process.platform === "win32" ? "python" : "python3",
        transport: "python-bridge"
      }),
      anthropic: providerRuntime("ANTHROPIC", env),
      deepseek: providerRuntime("DEEPSEEK", env, { baseUrl: "https://api.deepseek.com/v1" }),
      deterministic: {},
      google: providerRuntime("GOOGLE_AI", env),
      groq: providerRuntime("GROQ", env, { baseUrl: "https://api.groq.com/openai/v1" }),
      lmstudio: providerRuntime("LMSTUDIO", env, {
        apiKey: "lm-studio",
        baseUrl: "http://127.0.0.1:1234/v1",
        timeoutMs: 120000
      }),
      mistral: providerRuntime("MISTRAL", env, { baseUrl: "https://api.mistral.ai/v1" }),
      ollama: providerRuntime("OLLAMA", env, {
        baseUrl: "http://127.0.0.1:11434",
        timeoutMs: 120000
      }),
      openai: providerRuntime("OPENAI", env, { baseUrl: "https://api.openai.com/v1" }),
      openrouter: providerRuntime("OPENROUTER", env, { baseUrl: "https://openrouter.ai/api/v1" }),
      together: providerRuntime("TOGETHER", env, { baseUrl: "https://api.together.xyz/v1" }),
      vllm: providerRuntime("VLLM", env, {
        baseUrl: "http://127.0.0.1:8000/v1",
        timeoutMs: 120000
      }),
      xai: providerRuntime("XAI", env, { baseUrl: "https://api.x.ai/v1" })
    },
    requestTimeoutMs: parseNumber(env.AI_REQUEST_TIMEOUT_MS, 45000)
  };
}

export function getProviderConfig(config: AIAppConfig, provider: AIProviderId): ProviderRuntimeConfig {
  return config.providers[provider];
}

function applyCapabilityEnvOverrides(
  profile: AICapabilityProfile,
  env: Record<string, string | undefined>
): AICapabilityProfile {
  return {
    ...profile,
    language: env.AI_OUTREACH_LANGUAGE || profile.language,
    maxOutputTokens: parseNumber(env.AI_OUTREACH_MAX_TOKENS, profile.maxOutputTokens),
    reasoningPreference: parseReasoning(env.AI_OUTREACH_REASONING, profile.reasoningPreference),
    speedPreference: parseSpeed(env.AI_OUTREACH_SPEED, profile.speedPreference),
    temperature: parseNumber(env.AI_OUTREACH_TEMPERATURE, profile.temperature),
    tone: env.AI_OUTREACH_TONE || profile.tone,
    topP: parseNumber(env.AI_OUTREACH_TOP_P, profile.topP)
  };
}

function providerRuntime(
  prefix: string,
  env: Record<string, string | undefined>,
  defaults: ProviderRuntimeConfig = {}
): ProviderRuntimeConfig {
  return {
    apiKey: clean(env[`${prefix}_API_KEY`]) ?? defaults.apiKey,
    baseUrl: clean(env[`${prefix}_BASE_URL`]) ?? defaults.baseUrl,
    maxRetries: parseOptionalNumber(env[`${prefix}_MAX_RETRIES`]) ?? defaults.maxRetries,
    maxOutputTokensOverride:
      parseOptionalNumber(env[`${prefix}_MAX_TOKENS_OVERRIDE`]) ?? defaults.maxOutputTokensOverride,
    model: clean(env[`${prefix}_MODEL`]) ?? defaults.model,
    pythonBin: clean(env[`${prefix}_PYTHON_BIN`]) ?? defaults.pythonBin,
    reasoningOverride:
      parseOptionalReasoning(env[`${prefix}_REASONING_OVERRIDE`]) ?? defaults.reasoningOverride,
    speedOverride: parseOptionalSpeed(env[`${prefix}_SPEED_OVERRIDE`]) ?? defaults.speedOverride,
    temperatureOverride:
      parseOptionalNumber(env[`${prefix}_TEMPERATURE_OVERRIDE`]) ?? defaults.temperatureOverride,
    timeoutMs: parseOptionalNumber(env[`${prefix}_TIMEOUT_MS`]) ?? defaults.timeoutMs,
    toneOverride: clean(env[`${prefix}_TONE_OVERRIDE`]) ?? defaults.toneOverride,
    topPOverride: parseOptionalNumber(env[`${prefix}_TOP_P_OVERRIDE`]) ?? defaults.topPOverride,
    transport: clean(env[`${prefix}_TRANSPORT`]) ?? defaults.transport
  };
}

function parseProvider(value: string | undefined, fallback: AIProviderId): AIProviderId {
  return providerIds.includes(value as AIProviderId) ? (value as AIProviderId) : fallback;
}

function parseSpeed(value: string | undefined, fallback: AISpeedPreference): AISpeedPreference {
  return ["economy", "fast", "balanced", "quality"].includes(value ?? "")
    ? (value as AISpeedPreference)
    : fallback;
}

function parseReasoning(
  value: string | undefined,
  fallback: AIReasoningPreference
): AIReasoningPreference {
  return ["none", "low", "medium", "high"].includes(value ?? "")
    ? (value as AIReasoningPreference)
    : fallback;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
}

function parseNumber(value: string | undefined, fallback: number): number {
  const cleaned = clean(value);
  if (!cleaned) {
    return fallback;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOptionalNumber(value: string | undefined): number | undefined {
  const cleaned = clean(value);
  if (!cleaned) {
    return undefined;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseOptionalSpeed(value: string | undefined): AISpeedPreference | undefined {
  return ["economy", "fast", "balanced", "quality"].includes(value ?? "")
    ? (value as AISpeedPreference)
    : undefined;
}

function parseOptionalReasoning(value: string | undefined): AIReasoningPreference | undefined {
  return ["none", "low", "medium", "high"].includes(value ?? "")
    ? (value as AIReasoningPreference)
    : undefined;
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
