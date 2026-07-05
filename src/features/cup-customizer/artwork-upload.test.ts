import { describe, expect, it } from "vitest";
import type { Product } from "@/domain/product-types";
import { defaultConfiguration } from "./configuration";
import { validateCustomizerArtwork } from "./artwork-upload";
import { buildMockupAssetBlob, buildMockupFileName } from "./mockup";

function sampleCup(): Product {
  return {
    active: true,
    archiveReason: null,
    archivedAt: null,
    archivedBy: null,
    basePrice: 0.052,
    capacity: "330 ml",
    category: "personalized-cups",
    color: "Transparent",
    compatibleLidsAccessories: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    customizerUrl: "",
    defaultCtaLabel: "",
    emailDescription: "",
    emailTitle: "",
    id: "prod_pp_cup_330",
    image: "/demo/products/pp-cup-330.svg",
    imageUrl: "/demo/products/pp-cup-330.svg",
    isEmailPromotable: false,
    leadTimeDays: 7,
    material: "Polypropylene",
    name: "Personalized PP Cup 330 ml",
    personalizationAvailable: true,
    printArea: "wrap",
    productPageUrl: "",
    screenCost: 28,
    setupCost: 35,
    sku: "JHG-CUP-PP-330",
    sourceUrl: null,
    stacksPerBox: 20,
    tenantId: "tenant",
    thumbnailUrl: "/demo/products/pp-cup-330.svg",
    unitsPerBox: 1000,
    unitsPerStack: 50,
    updatedAt: "2026-01-01T00:00:00.000Z"
  };
}

describe("cup customizer artwork upload", () => {
  it("accepts supported raster artwork", () => {
    expect(validateCustomizerArtwork({ name: "logo.png", size: 1200, type: "image/png" }).ok).toBe(
      true
    );
  });

  it("rejects oversized files", () => {
    const result = validateCustomizerArtwork({
      name: "logo.png",
      size: 3 * 1024 * 1024,
      type: "image/png"
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorKey).toBe("fileTooLarge");
    }
  });

  it("rejects unsafe executable uploads", () => {
    const result = validateCustomizerArtwork({
      name: "payload.exe",
      size: 1000,
      type: "image/png"
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errorKey).toBe("unsafeFile");
    }
  });
});

describe("cup customizer mockup export", () => {
  it("builds a safe SVG mockup blob and filename", async () => {
    const product = sampleCup();
    const blob = buildMockupAssetBlob(product, defaultConfiguration(product), 1000, {
      assumptions: [],
      isEstimate: true,
      manualUnitPriceOverride: null,
      overrideReason: null,
      ruleId: "rule",
      setupCost: 50,
      subtotal: 500,
      total: 615,
      unitPrice: 0.45,
      vat: 115
    });
    const text = await blob.text();
    expect(blob.type).toBe("image/svg+xml");
    expect(text).toContain("Personalized PP Cup 330 ml");
    expect(text).not.toContain("<script");
    expect(buildMockupFileName(product.sku)).toBe("jhg-cup-pp-330-customizer-mockup.svg");
  });
});
