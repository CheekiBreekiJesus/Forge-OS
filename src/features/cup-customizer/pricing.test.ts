import { describe, expect, it } from "vitest";
import type { Product } from "@/domain/product-types";
import { defaultConfiguration } from "./configuration";
import { buildPricingSnapshot, validateQuantity } from "./pricing";
import { estimateCupPricing } from "@cup-customizer";

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

describe("cup customizer pricing", () => {
  it("returns estimate pricing for seeded cup rules", () => {
    const configuration = defaultConfiguration(sampleCup());
    const snapshot = buildPricingSnapshot(sampleCup(), configuration, 1000, "", null, "");
    expect(snapshot.isEstimate).toBe(true);
    expect(snapshot.total).toBeGreaterThan(0);
    expect(snapshot.ruleId).toBeTruthy();
    expect(snapshot.assumptions.some((line) => line.includes("Estimate"))).toBe(true);
  });

  it("applies manual unit price overrides", () => {
    const configuration = defaultConfiguration(sampleCup());
    const snapshot = buildPricingSnapshot(sampleCup(), configuration, 1000, "", 0.25, "VIP");
    expect(snapshot.manualUnitPriceOverride).toBe(0.25);
    expect(snapshot.unitPrice).toBe(0.25);
  });

  it("matches the shared pricing engine output", () => {
    const product = sampleCup();
    const configuration = defaultConfiguration(product);
    const fromFeature = buildPricingSnapshot(product, configuration, 1000, "note", null, "");
    const fromEngine = estimateCupPricing({
      configuration: { ...configuration, notes: "note", quantity: 1000 },
      productId: product.id,
      productName: product.name,
      productSku: product.sku
    });
    expect(fromFeature.total).toBe(fromEngine.pricing.total);
    expect(fromFeature.ruleId).toBe(fromEngine.ruleId);
  });

  it("validates quantity as a positive integer", () => {
    expect(validateQuantity(0)).toBe(1);
    expect(validateQuantity(12.8)).toBe(12);
    expect(validateQuantity(Number.NaN)).toBe(1);
  });
});
