import { normalizeCupSize, type CupSizeMl, type PrintAreaId } from "../config/cup-catalog";
import { printableWidthFraction } from "../config/print-area";
import { CUP_PLACEMENT_BY_SIZE } from "../config/visual-assets";

export const ARTWORK_ROTATION_MIN = -180;
export const ARTWORK_ROTATION_MAX = 180;
export const ARTWORK_ROTATION_DEFAULT = 0;
export const ARTWORK_SCALE_DEFAULT = 1;

/** Base artwork size as a fraction of the printable region (matches legacy preview proportions). */
export const ARTWORK_BASE_WIDTH_FRACTION = 0.48;
export const ARTWORK_BASE_HEIGHT_FRACTION = 0.72;

/**
 * Approximate reusable PP cup body dimensions for printable-area layout.
 * Used only for preview/export positioning — not production measurements.
 */
const CUP_BODY_DIMENSIONS_MM: Readonly<Record<CupSizeMl, { heightMm: number; rimWidthMm: number }>> = {
  250: { heightMm: 108, rimWidthMm: 70 },
  330: { heightMm: 115, rimWidthMm: 75 },
  430: { heightMm: 132, rimWidthMm: 82 },
  500: { heightMm: 145, rimWidthMm: 88 }
};

const PRINTABLE_INSETS_MM = {
  belowRim: 10,
  aboveBase: 15,
  sideMargin: 8
} as const;

export type PrintableRegionRect = {
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
  heightPercent: number;
  centerXPercent: number;
  centerYPercent: number;
};

export type ArtworkTransformInput = {
  cupSizeMl: CupSizeMl | number;
  printArea: PrintAreaId;
  artworkScale: number;
  artworkOffsetX: number;
  artworkOffsetY: number;
  artworkRotation: number;
};

export type ArtworkRenderBox = {
  region: PrintableRegionRect;
  centerXPercent: number;
  centerYPercent: number;
  widthPercent: number;
  heightPercent: number;
  rotationDeg: number;
};

export type ArtworkOffsetBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export function normalizeArtworkRotation(degrees: number): number {
  if (!Number.isFinite(degrees)) return ARTWORK_ROTATION_DEFAULT;
  return Math.min(ARTWORK_ROTATION_MAX, Math.max(ARTWORK_ROTATION_MIN, Math.round(degrees)));
}

export function computePrintableRegion(cupSizeMl: CupSizeMl | number, printArea: PrintAreaId): PrintableRegionRect {
  const sizeMl = normalizeCupSize(cupSizeMl, "reusable_pp");
  const placement = CUP_PLACEMENT_BY_SIZE[sizeMl];
  const dims = CUP_BODY_DIMENSIONS_MM[sizeMl];
  const region = placement.artworkRegion;

  const printableHeightRatio =
    (dims.heightMm - PRINTABLE_INSETS_MM.belowRim - PRINTABLE_INSETS_MM.aboveBase) / dims.heightMm;
  const topInsetRatio = PRINTABLE_INSETS_MM.belowRim / dims.heightMm;

  const heightPercent = region.heightPercent * printableHeightRatio;
  const topPercent = region.topPercent + region.heightPercent * topInsetRatio;

  const bandFraction = printableWidthFraction(printArea) * region.bandWidthPercent;
  const sideFraction = (PRINTABLE_INSETS_MM.sideMargin * 2) / dims.rimWidthMm;
  const widthPercent = 100 * bandFraction * Math.max(0.35, 1 - sideFraction);
  const leftPercent = region.centerXPercent - widthPercent / 2;

  return {
    centerXPercent: region.centerXPercent,
    centerYPercent: topPercent + heightPercent / 2,
    heightPercent,
    leftPercent,
    topPercent,
    widthPercent
  };
}

export function rotatedBoundingBox(width: number, height: number, rotationDeg: number): { width: number; height: number } {
  const radians = (rotationDeg * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  return {
    height: width * sin + height * cos,
    width: width * cos + height * sin
  };
}

export function computeArtworkRenderBox(input: ArtworkTransformInput): ArtworkRenderBox {
  const sizeMl = normalizeCupSize(input.cupSizeMl, "reusable_pp");
  const region = computePrintableRegion(sizeMl, input.printArea);
  const scale = Number.isFinite(input.artworkScale) ? input.artworkScale : ARTWORK_SCALE_DEFAULT;
  const widthPercent = region.widthPercent * ARTWORK_BASE_WIDTH_FRACTION * scale;
  const heightPercent = region.heightPercent * ARTWORK_BASE_HEIGHT_FRACTION * scale;
  const rotationDeg = normalizeArtworkRotation(input.artworkRotation);
  const centerXPercent =
    region.leftPercent + region.widthPercent / 2 + (input.artworkOffsetX / 100) * region.widthPercent;
  const centerYPercent =
    region.topPercent + region.heightPercent / 2 + (input.artworkOffsetY / 100) * region.heightPercent;

  return {
    centerXPercent,
    centerYPercent,
    heightPercent,
    region,
    rotationDeg,
    widthPercent
  };
}

export function computeArtworkOffsetBounds(input: ArtworkTransformInput): ArtworkOffsetBounds {
  const sizeMl = normalizeCupSize(input.cupSizeMl, "reusable_pp");
  const region = computePrintableRegion(sizeMl, input.printArea);
  const scale = Number.isFinite(input.artworkScale) ? input.artworkScale : ARTWORK_SCALE_DEFAULT;
  const rotationDeg = normalizeArtworkRotation(input.artworkRotation);
  const artWidth = region.widthPercent * ARTWORK_BASE_WIDTH_FRACTION * scale;
  const artHeight = region.heightPercent * ARTWORK_BASE_HEIGHT_FRACTION * scale;
  const bbox = rotatedBoundingBox(artWidth, artHeight, rotationDeg);
  const halfW = bbox.width / 2;
  const halfH = bbox.height / 2;
  const anchorX = region.leftPercent + region.widthPercent / 2;
  const anchorY = region.topPercent + region.heightPercent / 2;

  const minX = ((region.leftPercent + halfW - anchorX) / region.widthPercent) * 100;
  const maxX = ((region.leftPercent + region.widthPercent - halfW - anchorX) / region.widthPercent) * 100;
  const minY = ((region.topPercent + halfH - anchorY) / region.heightPercent) * 100;
  const maxY = ((region.topPercent + region.heightPercent - halfH - anchorY) / region.heightPercent) * 100;

  return {
    maxX: Math.max(minX, maxX),
    maxY: Math.max(minY, maxY),
    minX: Math.min(minX, maxX),
    minY: Math.min(minY, maxY)
  };
}

export function clampArtworkOffsets(
  input: ArtworkTransformInput,
  offsetX: number,
  offsetY: number
): { artworkOffsetX: number; artworkOffsetY: number } {
  const bounds = computeArtworkOffsetBounds(input);
  return {
    artworkOffsetX: Math.min(bounds.maxX, Math.max(bounds.minX, offsetX)),
    artworkOffsetY: Math.min(bounds.maxY, Math.max(bounds.minY, offsetY))
  };
}

/** Convert pointer movement in preview pixels to offset deltas (percent of printable region). */
export function pointerDeltaToOffsetDelta(
  deltaXPx: number,
  deltaYPx: number,
  previewPx: number,
  region: PrintableRegionRect
): { deltaOffsetX: number; deltaOffsetY: number } {
  if (previewPx <= 0) {
    return { deltaOffsetX: 0, deltaOffsetY: 0 };
  }
  const previewPercentX = (deltaXPx / previewPx) * 100;
  const previewPercentY = (deltaYPx / previewPx) * 100;
  return {
    deltaOffsetX: (previewPercentX / region.widthPercent) * 100,
    deltaOffsetY: (previewPercentY / region.heightPercent) * 100
  };
}

/** Map preview square size (e.g. 720 export) to absolute artwork box in that coordinate space. */
export function computeArtworkExportGeometry(
  input: ArtworkTransformInput,
  canvasSize: number
): {
  region: { left: number; top: number; width: number; height: number };
  artwork: { centerX: number; centerY: number; width: number; height: number; rotationDeg: number };
} {
  const box = computeArtworkRenderBox(input);
  const region = {
    height: (canvasSize * box.region.heightPercent) / 100,
    left: (canvasSize * box.region.leftPercent) / 100,
    top: (canvasSize * box.region.topPercent) / 100,
    width: (canvasSize * box.region.widthPercent) / 100
  };
  const artwork = {
    centerX: (canvasSize * box.centerXPercent) / 100,
    centerY: (canvasSize * box.centerYPercent) / 100,
    height: (canvasSize * box.heightPercent) / 100,
    rotationDeg: box.rotationDeg,
    width: (canvasSize * box.widthPercent) / 100
  };
  return { artwork, region };
}
