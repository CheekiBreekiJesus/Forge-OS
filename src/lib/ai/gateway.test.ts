import { afterEach, describe, expect, it, vi } from "vitest";
import { generateOutreachEmailWithAI } from "./capabilities/outreach-email";
import { getAIConfig } from "./config";
import { generateStructuredWithGateway } from "./gateway";
import type { GenerateStructuredResult } from "./types";

const lead = {
  campaignId: null,
  companyName: "Example Hospitality Group",
  consentStatus: "subscribed" as const,
  contactName: "Ana Example",
  email: "ana@example.invalid",
  id: "lead_test",
  industry: "Hospitality",
  language: "pt-PT",
  location: "Porto, Portugal",
  providerState: "not_ready" as const,
  quality: "high" as const,
  source: "Synthetic",
  sourceDatabase: "synthetic",
  status: "ready" as const,
  tenantId: "tenant_test",
  website: null
};

const campaign = {
  id: "campaign_test",
  name: "Synthetic outreach",
  sentCount: 0,
  status: "active" as const,
  tenantId: "tenant_test",
  totalCount: 1
};

describe("AI gateway outreach capability", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back deterministically when Abacus is not configured", async () => {
    vi.stubEnv("AI_OUTREACH_PROVIDER", "abacus");
    vi.stubEnv("ABACUS_API_KEY", "");

    const result = await generateOutreachEmailWithAI({
      campaign,
      context: {
        hasWebsiteContext: false,
        personalizationNotes: [],
        summary: "No website context."
      },
      lead,
      productKeys: ["customized-plastic-cups"],
      tone: "professional"
    });

    expect(result.provider).toBe("deterministic");
    expect(result.fallbackUsed).toBe(true);
    expect(result.body).toContain("copos de plástico personalizados");
    expect(result.body).not.toContain("Vi o contexto");
  });

  it("does not silently cascade to a second paid provider", async () => {
    const config = getAIConfig({
      AI_FALLBACK_PROVIDER: "openai",
      AI_MAX_RETRIES: "0",
      AI_OUTREACH_PROVIDER: "abacus"
    });

    await expect(
      generateStructuredWithGateway({
        config,
        fallback: () =>
          ({
            content: "{}",
            fallbackUsed: true,
            latencyMs: 0,
            model: "deterministic-template",
            parsed: { ok: true },
            provider: "deterministic",
            retryCount: 0,
            warnings: []
          }) satisfies GenerateStructuredResult<{ ok: boolean }>,
        provider: "abacus",
        request: {
          prompt: "Return JSON.",
          schema: {
            additionalProperties: false,
            properties: {
              ok: { type: "boolean" }
            },
            required: ["ok"],
            type: "object"
          },
          validate: (value) =>
            value && typeof value === "object" && "ok" in value
              ? (value as { ok: boolean })
              : null
        }
      })
    ).rejects.toThrow("Abacus API key is missing.");
  });
});
