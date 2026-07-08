import { describe, expect, it } from "vitest";
import {
  cupTypeFromProductCategory,
  formatCupSizeLabel,
  normalizeCupSize,
  normalizeCupType,
  PAPER_CUP_SIZES_ML,
  REUSABLE_PP_SIZES_ML,
  sizesForCupType
} from "./cup-catalog";

describe("cup-catalog", () => {
  it("exposes reusable PP sizes 250–500 ml including 430 ml", () => {
    expect(REUSABLE_PP_SIZES_ML).toEqual([250, 330, 430, 500]);
  });

  it("exposes verified paper size 250 ml from catalog", () => {
    expect(PAPER_CUP_SIZES_ML).toEqual([250]);
  });

  it("returns sizes per cup type", () => {
    expect(sizesForCupType("reusable_pp")).toEqual([250, 330, 430, 500]);
    expect(sizesForCupType("paper")).toEqual([250]);
  });

  it("maps product categories to cup types", () => {
    expect(cupTypeFromProductCategory("paper-cups")).toBe("paper");
    expect(cupTypeFromProductCategory("personalized-cups")).toBe("reusable_pp");
    expect(cupTypeFromProductCategory("reusable-cups")).toBe("reusable_pp");
  });

  it("normalizes legacy cup type strings", () => {
    expect(normalizeCupType("paper-cups")).toBe("paper");
    expect(normalizeCupType("personalized-cups")).toBe("reusable_pp");
    expect(normalizeCupType("PP")).toBe("reusable_pp");
  });

  it("clamps cup size to allowed values for cup type", () => {
    expect(normalizeCupSize("400 ml", "reusable_pp")).toBe(330);
    expect(normalizeCupSize("250 ml", "paper")).toBe(250);
    expect(normalizeCupSize("500 ml", "paper")).toBe(250);
  });

  it("formats cup size labels with locale", () => {
    expect(formatCupSizeLabel(330, "en")).toMatch(/330\s*ml/);
    expect(formatCupSizeLabel(330, "pt-PT")).toMatch(/330\s*ml/);
  });
});
