import { describe, expect, it } from "vitest";
import { buildPreviewExportSvg } from "./preview-export";
import { resolvePreviewSceneAssetPath, resolveReusablePPCupAssetPath } from "../config/visual-assets";

describe("cup preview layers", () => {
  it("orders export layers as scene, cup, then artwork", () => {
    const svg = buildPreviewExportSvg({
      artworkDataUrl: "data:image/png;base64,logo",
      artworkOffsetX: 0,
      artworkOffsetY: 0,
      artworkRotation: 0,
      artworkScale: 1,
      cupImageDataUrl: "data:image/png;base64,cup",
      cupSizeMl: 330,
      sceneBackgroundDataUrl: "data:image/png;base64,scene",
      cupSizeLabel: "330 ml",
      cupTypeLabel: "Reusable PP cup",
      printArea: "deg_180",
      printAreaLabel: "180°",
      productName: "Cup",
      productSku: "SKU",
      quantity: 100,
      totalLabel: "EUR 10"
    });

    const sceneIndex = svg.indexOf("data:image/png;base64,scene");
    const cupIndex = svg.indexOf("data:image/png;base64,cup");
    const artworkIndex = svg.indexOf("data:image/png;base64,logo");
    expect(sceneIndex).toBeGreaterThan(-1);
    expect(cupIndex).toBeGreaterThan(sceneIndex);
    expect(artworkIndex).toBeGreaterThan(cupIndex);
  });

  it("uses square export dimensions and preserves cup aspect ratio when provided", () => {
    const svg = buildPreviewExportSvg({
      artworkDataUrl: null,
      artworkOffsetX: 0,
      artworkOffsetY: 0,
      artworkRotation: 0,
      artworkScale: 1,
      cupImageDataUrl: "data:image/png;base64,cup",
      cupSizeMl: 500,
      sceneBackgroundDataUrl: null,
      cupSizeLabel: "500 ml",
      cupTypeLabel: "Reusable PP cup",
      printArea: "deg_180",
      printAreaLabel: "180°",
      productName: "Cup",
      productSku: "SKU",
      quantity: 100,
      totalLabel: "EUR 10"
    });

    expect(svg).toContain('width="720" height="720"');
    expect(svg).toContain('preserveAspectRatio="xMidYMax meet"');
  });

  it("resolves scene and cup asset paths used by the live preview", () => {
    expect(resolvePreviewSceneAssetPath("day")).toBe("/assets/cup-customizer/backgrounds/day.png");
    expect(resolvePreviewSceneAssetPath("night")).toBe("/assets/cup-customizer/backgrounds/night.png");
    expect(resolveReusablePPCupAssetPath(250)).toBe("/assets/cup-customizer/cups/reusable-pp/250ml.png");
    expect(resolveReusablePPCupAssetPath(330)).toBe("/assets/cup-customizer/cups/reusable-pp/330ml.png");
    expect(resolveReusablePPCupAssetPath(430)).toBe("/assets/cup-customizer/cups/reusable-pp/430ml.png");
    expect(resolveReusablePPCupAssetPath(500)).toBe("/assets/cup-customizer/cups/reusable-pp/500ml.png");
  });
});
