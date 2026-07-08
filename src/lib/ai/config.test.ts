import { describe, expect, it } from "vitest";
import { getAIConfig } from "./config";

describe("AI config", () => {
  it("parses provider routing and outreach capability defaults", () => {
    const config = getAIConfig({});

    expect(config.defaultProvider).toBe("abacus");
    expect(config.fallbackProvider).toBe("deterministic");
    expect(config.outreach.provider).toBe("abacus");
    expect(config.outreach.profile.temperature).toBe(0.25);
  });

  it("applies capability env overrides without provider conditionals", () => {
    const config = getAIConfig({
      AI_OUTREACH_MAX_TOKENS: "512",
      AI_OUTREACH_REASONING: "medium",
      AI_OUTREACH_SPEED: "quality",
      AI_OUTREACH_TEMPERATURE: "0.5",
      AI_OUTREACH_TONE: "direct",
      AI_OUTREACH_TOP_P: "0.8"
    });

    expect(config.outreach.profile).toMatchObject({
      maxOutputTokens: 512,
      reasoningPreference: "medium",
      speedPreference: "quality",
      temperature: 0.5,
      tone: "direct",
      topP: 0.8
    });
  });

  it("keeps invalid optional provider config from breaking the active provider", () => {
    const config = getAIConfig({
      AI_OUTREACH_PROVIDER: "abacus",
      ABACUS_MAX_TOKENS_OVERRIDE: "640",
      ABACUS_REASONING_OVERRIDE: "medium",
      ABACUS_TEMPERATURE_OVERRIDE: "0.2",
      OPENAI_TIMEOUT_MS: "not-a-number"
    });

    expect(config.outreach.provider).toBe("abacus");
    expect(config.providers.abacus.maxOutputTokensOverride).toBe(640);
    expect(config.providers.abacus.reasoningOverride).toBe("medium");
    expect(config.providers.abacus.temperatureOverride).toBe(0.2);
    expect(config.providers.openai.timeoutMs).toBeUndefined();
  });

  it("treats blank numeric placeholders as unset", () => {
    const config = getAIConfig({
      ABACUS_MAX_RETRIES: "",
      ABACUS_TIMEOUT_MS: "",
      AI_OUTREACH_MAX_TOKENS: ""
    });

    expect(config.outreach.profile.maxOutputTokens).toBe(700);
    expect(config.providers.abacus.maxRetries).toBeUndefined();
    expect(config.providers.abacus.timeoutMs).toBeUndefined();
  });
});
