import { describe, expect, it } from "vitest";
import type { Product } from "@/domain/product-types";
import {
  clampArtworkOffset,
  clampArtworkScale,
  defaultConfiguration,
  normalizeArtworkRotation,
  normalizeConfiguration
} from "./configuration";
import { isCupProduct, resolveProductPreviewUrl } from "./products";

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

describe("cup customizer configuration", () => {
  it("defaults to the selected product capacity and print area", () => {
    expect(defaultConfiguration(sampleCup())).toMatchObject({
      cupSize: "330 ml",
      cupType: "personalized-cups",
      material: "Polypropylene",
      printArea: "wrap"
    });
  });

  it("clamps artwork transforms to supported bounds", () => {
    expect(clampArtworkScale(2)).toBe(1.6);
    expect(clampArtworkScale(0.1)).toBe(0.5);
    expect(clampArtworkOffset(40)).toBe(20);
    expect(clampArtworkOffset(-40)).toBe(-20);
    expect(normalizeArtworkRotation(45)).toBe(30);
    expect(normalizeArtworkRotation(-45)).toBe(-30);
  });

  it("normalizes partial configuration values", () => {
    const normalized = normalizeConfiguration(
      {
        artworkOffsetX: 99,
        artworkRotation: -12.4,
        artworkScale: 0.25,
        printColorCount: 0
      },
      sampleCup()
    );
    expect(normalized.artworkOffsetX).toBe(20);
    expect(normalized.artworkRotation).toBe(-12.4);
    expect(normalized.artworkScale).toBe(0.5);
    expect(normalized.printColorCount).toBe(1);
  });
});

describe("cup customizer products", () => {
  it("detects cup products by personalization flag, category, or sku", () => {
    expect(isCupProduct(sampleCup())).toBe(true);
    expect(
      isCupProduct({
        ...sampleCup(),
        category: "bags",
        personalizationAvailable: false,
        sku: "JHG-BAG"
      })
    ).toBe(false);
  });

  it("resolves preview URLs from catalog image fields", () => {
    expect(resolveProductPreviewUrl(sampleCup())).toBe("/demo/products/pp-cup-330.svg");
    expect(resolveProductPreviewUrl({ ...sampleCup(), image: "", imageUrl: "/img.svg" })).toBe(
      "/img.svg"
    );
  });
});
