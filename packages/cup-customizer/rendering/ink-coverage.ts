import { printableWidthFraction } from "../config/print-area";
import type { PrintAreaId } from "../config/cup-catalog";

export type InkCoverageInput = {
  artworkDataUrl: string | null;
  printArea: PrintAreaId;
  artworkScale: number;
};

export type InkCoverageResult = {
  percentage: number;
  sampledPixels: number;
  visiblePixels: number;
};

const ALPHA_THRESHOLD = 16;
const SAMPLE_WIDTH = 160;
const SAMPLE_HEIGHT = 120;

/**
 * Approximate visible ink coverage inside the selected printable band.
 * Returns null when artwork cannot be sampled (e.g. unloadable image).
 */
export async function estimateInkCoverage(input: InkCoverageInput): Promise<InkCoverageResult | null> {
  if (!input.artworkDataUrl || typeof document === "undefined") return null;

  try {
    const image = await loadImage(input.artworkDataUrl);
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_WIDTH;
    canvas.height = SAMPLE_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) return null;

    const drawWidth = SAMPLE_WIDTH * Math.max(0.5, Math.min(1.6, input.artworkScale));
    const drawHeight = (image.height / image.width) * drawWidth;
    const offsetX = (SAMPLE_WIDTH - drawWidth) / 2;
    const offsetY = (SAMPLE_HEIGHT - drawHeight) / 2;
    context.clearRect(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

    const pixels = context.getImageData(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT).data;
    const bandLeft = Math.round(SAMPLE_WIDTH * ((1 - printableWidthFraction(input.printArea)) / 2));
    const bandRight = Math.round(SAMPLE_WIDTH * (1 - (1 - printableWidthFraction(input.printArea)) / 2));

    let sampledPixels = 0;
    let visiblePixels = 0;
    for (let y = 0; y < SAMPLE_HEIGHT; y += 1) {
      for (let x = bandLeft; x < bandRight; x += 1) {
        const index = (y * SAMPLE_WIDTH + x) * 4;
        const alpha = pixels[index + 3] ?? 0;
        sampledPixels += 1;
        if (alpha >= ALPHA_THRESHOLD) visiblePixels += 1;
      }
    }

    if (sampledPixels === 0) return null;
    return {
      percentage: Math.round((visiblePixels / sampledPixels) * 100),
      sampledPixels,
      visiblePixels
    };
  } catch {
    return null;
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("artwork_load_failed"));
    image.src = src;
  });
}
