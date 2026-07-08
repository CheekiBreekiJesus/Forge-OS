import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  ARTWORK_ROTATION_DEFAULT,
  ARTWORK_ROTATION_MAX,
  ARTWORK_ROTATION_MIN,
  clampArtworkOffsets,
  computeArtworkOffsetBounds,
  computePrintableRegion,
  normalizeArtworkRotation,
  pointerDeltaToOffsetDelta
} from "./artwork-layout";
import { buildPreviewExportSvg } from "./preview-export";

const baseTransform = {
  artworkOffsetX: 0,
  artworkOffsetY: 0,
  artworkRotation: 0,
  artworkScale: 1,
  cupSizeMl: 330 as const,
  printArea: "deg_180" as const
};

describe("artwork-layout", () => {
  it("defaults rotation to 0 and clamps to -180..180", () => {
    expect(ARTWORK_ROTATION_DEFAULT).toBe(0);
    expect(ARTWORK_ROTATION_MIN).toBe(-180);
    expect(ARTWORK_ROTATION_MAX).toBe(180);
    expect(normalizeArtworkRotation(Number.NaN)).toBe(0);
    expect(normalizeArtworkRotation(-200)).toBe(-180);
    expect(normalizeArtworkRotation(200)).toBe(180);
    expect(normalizeArtworkRotation(45.6)).toBe(46);
  });

  it("computes different printable regions per cup size", () => {
    const sizes = [250, 330, 430, 500] as const;
    const regions = sizes.map((cupSizeMl) => computePrintableRegion(cupSizeMl, "deg_180"));
    const uniqueHeights = new Set(regions.map((region) => region.heightPercent.toFixed(4)));
    expect(uniqueHeights.size).toBeGreaterThan(1);
    for (const region of regions) {
      expect(region.widthPercent).toBeGreaterThan(0);
      expect(region.heightPercent).toBeGreaterThan(0);
      expect(region.leftPercent).toBeGreaterThanOrEqual(0);
      expect(region.topPercent).toBeGreaterThanOrEqual(0);
    }
  });

  it("keeps artwork inside printable bounds using rotated bounding box", () => {
    const input = { ...baseTransform, artworkRotation: 45, artworkScale: 1.4 };
    const bounds = computeArtworkOffsetBounds(input);
    const clamped = clampArtworkOffsets(input, bounds.maxX + 20, bounds.maxY + 20);
    expect(clamped.artworkOffsetX).toBeLessThanOrEqual(bounds.maxX);
    expect(clamped.artworkOffsetY).toBeLessThanOrEqual(bounds.maxY);
    expect(clamped.artworkOffsetX).toBeGreaterThanOrEqual(bounds.minX);
    expect(clamped.artworkOffsetY).toBeGreaterThanOrEqual(bounds.minY);
  });

  it("maps pointer deltas to offset deltas for drag positioning", () => {
    const region = computePrintableRegion(330, "deg_180");
    const { deltaOffsetX, deltaOffsetY } = pointerDeltaToOffsetDelta(12, -6, 360, region);
    expect(deltaOffsetX).not.toBe(0);
    expect(deltaOffsetY).not.toBe(0);

    const next = clampArtworkOffsets(baseTransform, deltaOffsetX, deltaOffsetY);
    expect(next.artworkOffsetX).toBeGreaterThanOrEqual(computeArtworkOffsetBounds(baseTransform).minX);
    expect(next.artworkOffsetX).toBeLessThanOrEqual(computeArtworkOffsetBounds(baseTransform).maxX);
    expect(next.artworkOffsetY).toBeGreaterThanOrEqual(computeArtworkOffsetBounds(baseTransform).minY);
    expect(next.artworkOffsetY).toBeLessThanOrEqual(computeArtworkOffsetBounds(baseTransform).maxY);
  });

  it("orders export layers as scene, cup, then clipped artwork", () => {
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
    const clipIndex = svg.indexOf('clip-path="url(#print-band)"');
    expect(sceneIndex).toBeGreaterThan(-1);
    expect(cupIndex).toBeGreaterThan(sceneIndex);
    expect(clipIndex).toBeGreaterThan(cupIndex);
    expect(artworkIndex).toBeGreaterThan(clipIndex);
  });

  it("does not include a decorative inner preview frame in export SVG", () => {
    const svg = buildPreviewExportSvg({
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
      productSku: "SKU",
      quantity: 100,
      totalLabel: "EUR 10"
    });
    expect(svg).not.toContain('stroke="#38bdf8"');
    expect(svg).not.toContain("rounded-2xl");
  });

  it("live preview component stacks artwork above the cup without an inner frame", () => {
    const source = readFileSync(path.join(__dirname, "cup-preview.tsx"), "utf8");
    expect(source).toContain('className="absolute z-[2]');
    expect(source).toContain('className="z-[1]"');
    expect(source).toContain('data-testid="cup-preview-frame"');
    expect(source).not.toContain("rounded-2xl border border-slate-700");
    expect(source).toContain("onPointerDown={handleArtworkPointerDown}");
  });

  it("shell UI no longer exposes artwork alignment selector copy", () => {
    const en = readFileSync(path.resolve(process.cwd(), "src/i18n/locales/en.ts"), "utf8");
    const pt = readFileSync(path.resolve(process.cwd(), "src/i18n/locales/pt-PT.ts"), "utf8");
    expect(en).not.toContain("artworkPosition:");
    expect(en).not.toContain("artworkPositions:");
    expect(pt).not.toContain("Posição da arte");
    expect(pt).not.toContain("artworkPositions:");
  });

  it("day/night controls use accessible icon button labels in shell", () => {
    const shell = readFileSync(path.resolve(process.cwd(), "src/components/cup-customizer-shell.tsx"), "utf8");
    expect(shell).toContain("aria-label={sceneLabel}");
    expect(shell).toContain('previewScene: "day"');
    expect(shell).not.toContain("copy.form.artworkPosition");
  });
});
