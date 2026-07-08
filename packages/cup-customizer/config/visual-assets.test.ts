import { describe, expect, it } from "vitest";
import {
  CUP_CUSTOMIZER_SHOW_PAPER_CUPS,
  CUP_PLACEMENT_BY_SIZE,
  DEFAULT_PREVIEW_BACKGROUND,
  normalizeCustomizerCupTypeForUi,
  normalizePreviewBackground,
  previewBackgrounds,
  reusablePPCups,
  resolvePreviewSceneAssetPath,
  resolveReusablePPCupAssetPath,
  visibleCupTypesInCustomizer,
  isHiddenPaperCupSelection
} from "./visual-assets";
import { PAPER_CUP_SIZES_ML, REUSABLE_PP_SIZES_ML, sizesForCupType } from "./cup-catalog";

describe("visual-assets", () => {
  it("exposes only reusable PP in the current customizer UI", () => {
    expect(CUP_CUSTOMIZER_SHOW_PAPER_CUPS).toBe(false);
    expect(visibleCupTypesInCustomizer()).toEqual(["reusable_pp"]);
  });

  it("keeps paper cup domain sizes without removing them", () => {
    expect(PAPER_CUP_SIZES_ML).toEqual([250]);
    expect(sizesForCupType("paper")).toEqual([250]);
  });

  it("maps reusable PP sizes to asset paths", () => {
    expect(REUSABLE_PP_SIZES_ML).toEqual([250, 330, 430, 500]);
    expect(Object.keys(reusablePPCups)).toEqual(["250ml", "330ml", "430ml", "500ml"]);
    expect(resolveReusablePPCupAssetPath(250)).toBe("/assets/cup-customizer/cups/reusable-pp/250ml.png");
    expect(resolveReusablePPCupAssetPath(330)).toBe("/assets/cup-customizer/cups/reusable-pp/330ml.png");
    expect(resolveReusablePPCupAssetPath(430)).toBe("/assets/cup-customizer/cups/reusable-pp/430ml.png");
    expect(resolveReusablePPCupAssetPath(500)).toBe("/assets/cup-customizer/cups/reusable-pp/500ml.png");
  });

  it("defaults preview scene to day", () => {
    expect(DEFAULT_PREVIEW_BACKGROUND).toBe("day");
    expect(normalizePreviewBackground(undefined)).toBe("day");
    expect(normalizePreviewBackground("")).toBe("day");
  });

  it("resolves day and night scene assets", () => {
    expect(resolvePreviewSceneAssetPath("day")).toBe(previewBackgrounds.day.assetPath);
    expect(resolvePreviewSceneAssetPath("night")).toBe(previewBackgrounds.night.assetPath);
    expect(previewBackgrounds.day.assetPath).toBe("/assets/cup-customizer/backgrounds/day.png");
    expect(previewBackgrounds.night.assetPath).toBe("/assets/cup-customizer/backgrounds/night.png");
  });

  it("normalizes Portuguese night label", () => {
    expect(normalizePreviewBackground("noite")).toBe("night");
  });

  it("defines per-size placement without equalizing cup heights", () => {
    const widths = REUSABLE_PP_SIZES_ML.map((size) => CUP_PLACEMENT_BY_SIZE[size].cupTransform.widthPercent);
    expect(new Set(widths).size).toBeGreaterThan(1);
  });

  it("normalizes hidden legacy paper selections for UI review", () => {
    expect(isHiddenPaperCupSelection("paper")).toBe(true);
    expect(normalizeCustomizerCupTypeForUi("paper")).toBe("reusable_pp");
    expect(normalizeCustomizerCupTypeForUi("paper-cups")).toBe("reusable_pp");
    expect(normalizeCustomizerCupTypeForUi("reusable_pp")).toBe("reusable_pp");
  });
});
