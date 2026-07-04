import { describe, expect, it } from "vitest";
import {
  buildConfigurationFingerprint,
  getNextStep,
  getPreviousStep,
  isStepComplete,
  validatePrintConfiguration
} from "./workflow";
import {
  buildPhotorealisticMockupBlob,
  resolveMockupGenerationStatus
} from "./mockup-generation";
import { deriveWorkflowStatus } from "./workflow-status";
import type { CustomizerConfiguration } from "@/domain/customizer-types";

const baseConfiguration: CustomizerConfiguration = {
  artworkOffsetX: 0,
  artworkOffsetY: 0,
  artworkPosition: "center",
  artworkRotation: 0,
  artworkScale: 1,
  cupSize: "330 ml",
  cupType: "personalized-cups",
  desiredDeliveryDate: null,
  material: "PP",
  printArea: "wrap",
  printColorCount: 1
};

describe("cup customizer workflow", () => {
  it("navigates steps in order", () => {
    expect(getNextStep("product")).toBe("printing");
    expect(getPreviousStep("quotation")).toBe("preview");
  });

  it("rejects unsupported print colour counts", () => {
    expect(validatePrintConfiguration({ ...baseConfiguration, printColorCount: 4 }).ok).toBe(false);
  });

  it("tracks step completion from workflow context", () => {
    expect(
      isStepComplete("product", {
        hasArtwork: false,
        hasPreview: false,
        hasPricing: false,
        hasProduct: true,
        hasValidPrinting: true
      })
    ).toBe(true);
  });

  it("builds stable configuration fingerprints", () => {
    const first = buildConfigurationFingerprint("prod_1", baseConfiguration, 1000, "asset_1");
    const second = buildConfigurationFingerprint("prod_1", baseConfiguration, 1000, "asset_1");
    const changed = buildConfigurationFingerprint("prod_1", baseConfiguration, 500, "asset_1");
    expect(first).toBe(second);
    expect(first).not.toBe(changed);
  });
});

describe("cup customizer mockup generation", () => {
  it("marks stale mockups when fingerprint changes", () => {
    const meta = {
      configurationFingerprint: "old",
      generatedAt: "2026-01-01T00:00:00.000Z",
      promptVersion: "v1",
      provider: "deterministic" as const,
      realisticMockupAssetId: "asset_1",
      status: "complete" as const
    };
    expect(resolveMockupGenerationStatus(meta, "new")).toBe("stale");
  });

  it("builds photorealistic mockup blob with disclaimer text", async () => {
    const blob = buildPhotorealisticMockupBlob(
      {
        active: true,
        archiveReason: null,
        archivedAt: null,
        archivedBy: null,
        basePrice: 0.05,
        capacity: "330 ml",
        category: "personalized-cups",
        color: "White",
        compatibleLidsAccessories: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        customizerUrl: "",
        defaultCtaLabel: "",
        emailDescription: "",
        emailTitle: "",
        id: "prod",
        image: "",
        imageUrl: "",
        isEmailPromotable: false,
        leadTimeDays: 7,
        material: "PP",
        name: "Cup 330",
        personalizationAvailable: true,
        printArea: "wrap",
        productPageUrl: "",
        screenCost: 20,
        setupCost: 30,
        sku: "JHG-CUP-PP-330",
        sourceUrl: null,
        stacksPerBox: 10,
        tenantId: "tenant",
        thumbnailUrl: "",
        unitsPerBox: 1000,
        unitsPerStack: 50,
        updatedAt: "2026-01-01T00:00:00.000Z"
      },
      baseConfiguration,
      1000,
      {
        assumptions: [],
        isEstimate: true,
        manualUnitPriceOverride: null,
        overrideReason: null,
        ruleId: "rule",
        setupCost: 30,
        subtotal: 100,
        total: 123,
        unitPrice: 0.1,
        vat: 23
      }
    );
    const text = await blob.text();
    expect(text).toContain("AI-generated visualization");
  });
});

describe("cup customizer workflow status", () => {
  it("derives pricing required when commercial data is missing", () => {
    expect(
      deriveWorkflowStatus({
        artworkAssetId: null,
        pricing: {
          assumptions: [],
          isEstimate: true,
          manualUnitPriceOverride: null,
          overrideReason: null,
          ruleId: null,
          setupCost: 0,
          subtotal: 0,
          total: 0,
          unitPrice: 0,
          vat: 0
        },
        quoteId: null,
        status: "draft"
      })
    ).toBe("PRICING_REQUIRED");
  });
});
