import { describe, expect, it } from "vitest";
import { buildPreviewExportSvg } from "../rendering/preview-export";

describe("preview-export", () => {
  it("embeds artwork transforms in exported SVG", () => {
    const svg = buildPreviewExportSvg({
      artworkDataUrl: "data:image/png;base64,abc",
      artworkOffsetX: 8,
      artworkOffsetY: -4,
      artworkPosition: "center",
      artworkRotation: 12,
      artworkScale: 1.25,
      backgroundDataUrl: null,
      cupSizeLabel: "330 ml",
      cupTypeLabel: "Reusable PP cup",
      printArea: "deg_180",
      printAreaLabel: "180°",
      productName: "Test Cup",
      productSku: "SKU-1",
      quantity: 1000,
      totalLabel: "EUR 615.00"
    });

    expect(svg).toContain('rotate(12)');
    expect(svg).toContain("data:image/png;base64,abc");
    expect(svg).toContain("180°");
  });

  it("uses a wider print band for 360 degree wrap", () => {
    const half = buildPreviewExportSvg({
      artworkDataUrl: null,
      artworkOffsetX: 0,
      artworkOffsetY: 0,
      artworkPosition: "center",
      artworkRotation: 0,
      artworkScale: 1,
      backgroundDataUrl: null,
      cupSizeLabel: "250 ml",
      cupTypeLabel: "Paper cup",
      printArea: "deg_180",
      printAreaLabel: "180°",
      productName: "Paper",
      productSku: "P-1",
      quantity: 500,
      totalLabel: "EUR 100"
    });
    const full = buildPreviewExportSvg({
      artworkDataUrl: null,
      artworkOffsetX: 0,
      artworkOffsetY: 0,
      artworkPosition: "center",
      artworkRotation: 0,
      artworkScale: 1,
      backgroundDataUrl: null,
      cupSizeLabel: "250 ml",
      cupTypeLabel: "Paper cup",
      printArea: "deg_360",
      printAreaLabel: "360°",
      productName: "Paper",
      productSku: "P-1",
      quantity: 500,
      totalLabel: "EUR 100"
    });

    const halfBandWidth = half.match(/width="([\d.]+)" height="[\d.]+" fill="none" stroke="#38bdf8"/)?.[1];
    const fullBandWidth = full.match(/width="([\d.]+)" height="[\d.]+" fill="none" stroke="#38bdf8"/)?.[1];
    expect(Number(fullBandWidth)).toBeGreaterThan(Number(halfBandWidth));
  });
});
