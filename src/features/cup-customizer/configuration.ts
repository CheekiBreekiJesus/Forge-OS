import type { CustomizerConfiguration } from "@/domain/customizer-types";
import type { Product } from "@/domain/product-types";
import {
  ARTWORK_OFFSET_MAX,
  ARTWORK_OFFSET_MIN,
  ARTWORK_ROTATION_MAX,
  ARTWORK_ROTATION_MIN,
  ARTWORK_SCALE_MAX,
  ARTWORK_SCALE_MIN,
  DEFAULT_ARTWORK_OFFSET,
  DEFAULT_ARTWORK_ROTATION,
  DEFAULT_ARTWORK_SCALE
} from "./constants";

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function clampArtworkScale(value: number): number {
  return Math.min(ARTWORK_SCALE_MAX, Math.max(ARTWORK_SCALE_MIN, value));
}

export function clampArtworkOffset(value: number): number {
  return Math.min(ARTWORK_OFFSET_MAX, Math.max(ARTWORK_OFFSET_MIN, value));
}

export function normalizeArtworkRotation(value: number): number {
  const clamped = Math.min(ARTWORK_ROTATION_MAX, Math.max(ARTWORK_ROTATION_MIN, value));
  return Number(clamped.toFixed(2));
}

export function defaultConfiguration(product: Product | null): CustomizerConfiguration {
  return {
    artworkOffsetX: DEFAULT_ARTWORK_OFFSET,
    artworkOffsetY: DEFAULT_ARTWORK_OFFSET,
    artworkPosition: "center",
    artworkRotation: DEFAULT_ARTWORK_ROTATION,
    artworkScale: DEFAULT_ARTWORK_SCALE,
    cupSize: product?.capacity ?? "330 ml",
    cupType: product?.category ?? "personalized-cups",
    desiredDeliveryDate: null,
    material: product?.material ?? "PP",
    printArea: product?.printArea ?? "wrap",
    printColorCount: 1
  };
}

export function normalizeConfiguration(
  configuration: Partial<CustomizerConfiguration>,
  product: Product | null
): CustomizerConfiguration {
  const defaults = defaultConfiguration(product);
  return {
    ...defaults,
    ...configuration,
    artworkOffsetX: clampArtworkOffset(
      finiteNumber(configuration.artworkOffsetX, defaults.artworkOffsetX)
    ),
    artworkOffsetY: clampArtworkOffset(
      finiteNumber(configuration.artworkOffsetY, defaults.artworkOffsetY)
    ),
    artworkRotation: normalizeArtworkRotation(
      finiteNumber(configuration.artworkRotation, defaults.artworkRotation)
    ),
    artworkScale: clampArtworkScale(finiteNumber(configuration.artworkScale, defaults.artworkScale)),
    desiredDeliveryDate: configuration.desiredDeliveryDate ?? defaults.desiredDeliveryDate,
    printColorCount: Math.max(1, finiteNumber(configuration.printColorCount, defaults.printColorCount))
  };
}
