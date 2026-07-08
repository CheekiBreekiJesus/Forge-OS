import { describe, expect, it } from "vitest";
import { buildPreviewExportSvg } from "../rendering/preview-export";

describe("preview-export", () => {
  it("embeds artwork transforms in exported SVG", () => {
    const svg = buildPreviewExportSvg({
      artworkDataUrl: "data:image/png;base64,abc",
      artworkOffsetX: 8,
      artworkOffsetY: -4,
      artworkRotation: 12,
      artworkScale: 1.25,
      cupImageDataUrl: "data:image/png;base64,cup",
      cupSizeMl: 330,
      sceneBackgroundDataUrl: "data:image/png;base64,scene",
      cupSizeLabel: "330 ml",
      cupTypeLabel: "Reusable PP cup",
      printArea: "deg_180",
      printAreaLabel: "180°",
      productName: "Test Cup",
      productSku: "SKU-1",
      quantity: 1000,
      totalLabel: "EUR 615.00"
    });

    expect(svg).toContain("rotate(12)");
    expect(svg).toContain("data:image/png;base64,abc");
    expect(svg).toContain("data:image/png;base64,scene");
    expect(svg).toContain("data:image/png;base64,cup");
    expect(svg).toContain("180°");
  });

  it("uses a wider print clip band for 360 degree wrap", () => {
    const half = buildPreviewExportSvg({
      artworkDataUrl: null,
      artworkOffsetX: 0,
      artworkOffsetY: 0,
      artworkRotation: 0,
      artworkScale: 1,
      cupImageDataUrl: null,
      cupSizeMl: 250,
      sceneBackgroundDataUrl: null,
      cupSizeLabel: "250 ml",
      cupTypeLabel: "Reusable PP cup",
      printArea: "deg_180",
      printAreaLabel: "180°",
      productName: "Cup",
      productSku: "P-1",
      quantity: 500,
      totalLabel: "EUR 100"
    });
    const full = buildPreviewExportSvg({
      artworkDataUrl: null,
      artworkOffsetX: 0,
      artworkOffsetY: 0,
      artworkRotation: 0,
      artworkScale: 1,
      cupImageDataUrl: null,
      cupSizeMl: 250,
      sceneBackgroundDataUrl: null,
      cupSizeLabel: "250 ml",
      cupTypeLabel: "Reusable PP cup",
      printArea: "deg_360",
      printAreaLabel: "360°",
      productName: "Cup",
      productSku: "P-1",
      quantity: 500,
      totalLabel: "EUR 100"
    });

    const halfBandWidth = half.match(/<clipPath id="print-band"><rect x="[\d.]+" y="[\d.]+" width="([\d.]+)"/)?.[1];
    const fullBandWidth = full.match(/<clipPath id="print-band"><rect x="[\d.]+" y="[\d.]+" width="([\d.]+)"/)?.[1];
    expect(Number(fullBandWidth)).toBeGreaterThan(Number(halfBandWidth));
  });

  it("supports full rotation range in export output", () => {
    const negative = buildPreviewExportSvg({
      artworkDataUrl: "data:image/png;base64,abc",
      artworkOffsetX: 0,
      artworkOffsetY: 0,
      artworkRotation: -180,
      artworkScale: 1,
      cupImageDataUrl: null,
      cupSizeMl: 330,
      sceneBackgroundDataUrl: null,
      cupSizeLabel: "330 ml",
      cupTypeLabel: "Reusable PP cup",
      printArea: "deg_180",
      printAreaLabel: "180°",
      productName: "Cup",
      productSku: "P-1",
      quantity: 100,
      totalLabel: "EUR 10"
    });
    const positive = buildPreviewExportSvg({
      artworkDataUrl: "data:image/png;base64,abc",
      artworkOffsetX: 0,
      artworkOffsetY: 0,
      artworkRotation: 180,
      artworkScale: 1,
      cupImageDataUrl: null,
      cupSizeMl: 330,
      sceneBackgroundDataUrl: null,
      cupSizeLabel: "330 ml",
      cupTypeLabel: "Reusable PP cup",
      printArea: "deg_180",
      printAreaLabel: "180°",
      productName: "Cup",
      productSku: "P-1",
      quantity: 100,
      totalLabel: "EUR 10"
    });
    expect(negative).toContain("rotate(-180)");
    expect(positive).toContain("rotate(180)");
  });
});
