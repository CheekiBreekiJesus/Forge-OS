import type { CustomizerConfiguration } from "@/domain/customizer-types";
import type { Product } from "@/domain/product-types";
import type { CustomizerPricingSnapshot } from "@/domain/customizer-types";
import { buildConfigurationFingerprint } from "./workflow";

export type MockupGenerationStatus = "none" | "generating" | "complete" | "stale" | "failed";

export type MockupGenerationMeta = {
  status: MockupGenerationStatus;
  provider: "deterministic" | "abacus" | null;
  configurationFingerprint: string;
  generatedAt: string | null;
  realisticMockupAssetId: string | null;
  promptVersion: string | null;
};

const PROMPT_VERSION = "cup-mockup-v1-deterministic";

function escapeSvgText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function createEmptyMockupGeneration(): MockupGenerationMeta {
  return {
    configurationFingerprint: "",
    generatedAt: null,
    promptVersion: null,
    provider: null,
    realisticMockupAssetId: null,
    status: "none"
  };
}

export function resolveMockupGenerationStatus(
  meta: MockupGenerationMeta | null | undefined,
  currentFingerprint: string
): MockupGenerationStatus {
  if (!meta || meta.status === "none") return "none";
  if (meta.status === "generating" || meta.status === "failed") return meta.status;
  if (meta.configurationFingerprint !== currentFingerprint) return "stale";
  return meta.status;
}

export function buildPhotorealisticMockupBlob(
  product: Product,
  configuration: CustomizerConfiguration,
  quantity: number,
  pricing: CustomizerPricingSnapshot,
  artworkDataUrl?: string | null
): Blob {
  const artworkX =
    configuration.artworkPosition === "left" ? 168 : configuration.artworkPosition === "right" ? 312 : 240;
  const artworkY = 225 + configuration.artworkOffsetY * 2;
  const artworkWidth = Math.round(150 * configuration.artworkScale);
  const artworkHeight = Math.round(105 * configuration.artworkScale);
  const safeProductName = escapeSvgText(product.name);
  const safeSku = escapeSvgText(product.sku);
  const total = pricing.total.toFixed(2);
  const cupFill =
    product.color?.toLowerCase().includes("black") || product.color?.toLowerCase().includes("pret")
      ? "#1e293b"
      : "#f1f5f9";
  const artworkInner = artworkDataUrl
    ? `<image href="${artworkDataUrl}" x="${-artworkWidth / 2}" y="${-artworkHeight / 2}" width="${artworkWidth}" height="${artworkHeight}" preserveAspectRatio="xMidYMid meet"/>`
    : `<rect x="${-artworkWidth / 2}" y="${-artworkHeight / 2}" width="${artworkWidth}" height="${artworkHeight}" rx="10" fill="#ea580c" opacity="0.92"/>
      <text x="0" y="5" text-anchor="middle" fill="#fff7ed" font-family="Arial, sans-serif" font-size="20" font-weight="700">${escapeSvgText(configuration.printArea)}</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="960" height="720" viewBox="0 0 960 720" role="img" aria-label="Photorealistic cup visualization">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <radialGradient id="cupShine" cx="40%" cy="25%" r="65%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#e2e8f0" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <rect width="960" height="720" fill="url(#bg)"/>
  <ellipse cx="480" cy="620" rx="220" ry="28" fill="#000" opacity="0.35"/>
  <g filter="url(#shadow)">
    <path d="M330 120h300l-48 420H378z" fill="${cupFill}" stroke="#94a3b8" stroke-width="3"/>
    <path d="M350 150h260l-28 340H378z" fill="url(#cupShine)"/>
    <g transform="translate(${artworkX + configuration.artworkOffsetX * 2} ${artworkY}) rotate(${configuration.artworkRotation})">
      ${artworkInner}
    </g>
  </g>
  <text x="48" y="56" fill="#f8fafc" font-family="Arial, sans-serif" font-size="22" font-weight="700">${safeProductName}</text>
  <text x="48" y="86" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="14">SKU ${safeSku} · ${quantity} units · EUR ${total}</text>
  <text x="48" y="680" fill="#fbbf24" font-family="Arial, sans-serif" font-size="13" font-weight="600">AI-generated visualization — final production appearance may vary.</text>
  <text x="48" y="702" fill="#64748b" font-family="Arial, sans-serif" font-size="11">Deterministic development provider · no live API call</text>
</svg>`;
  return new Blob([svg], { type: "image/svg+xml" });
}

export function buildPhotorealisticMockupFileName(sku: string): string {
  const safeSku = sku.toLowerCase().replace(/[^a-z0-9-]+/g, "-") || "cup";
  return `${safeSku}-photorealistic-mockup.svg`;
}

export async function generateDeterministicPhotorealisticMockup(input: {
  product: Product;
  configuration: CustomizerConfiguration;
  quantity: number;
  pricing: CustomizerPricingSnapshot;
  artworkAssetId: string | null;
  artworkDataUrl?: string | null;
  existingMeta?: MockupGenerationMeta | null;
}): Promise<{ blob: Blob; meta: MockupGenerationMeta }> {
  const fingerprint = buildConfigurationFingerprint(
    input.product.id,
    input.configuration,
    input.quantity,
    input.artworkAssetId
  );
  const embeddableArtwork = await resolveEmbeddableArtworkHref(input.artworkDataUrl);
  const blob = buildPhotorealisticMockupBlob(
    input.product,
    input.configuration,
    input.quantity,
    input.pricing,
    embeddableArtwork
  );
  return {
    blob,
    meta: {
      configurationFingerprint: fingerprint,
      generatedAt: new Date().toISOString(),
      promptVersion: PROMPT_VERSION,
      provider: "deterministic",
      realisticMockupAssetId: input.existingMeta?.realisticMockupAssetId ?? null,
      status: "complete"
    }
  };
}

export function isPaidProviderAvailable(): boolean {
  return Boolean(process.env.ABACUS_API_KEY || process.env.FORGEOS_AI_IMAGE_PROVIDER);
}

/** Blob URLs cannot be embedded in SVG displayed as an image — convert to data URLs. */
export async function resolveEmbeddableArtworkHref(
  artworkDataUrl?: string | null
): Promise<string | null> {
  if (!artworkDataUrl) return null;
  if (artworkDataUrl.startsWith("data:")) return artworkDataUrl;
  if (!artworkDataUrl.startsWith("blob:")) return artworkDataUrl;
  try {
    const response = await fetch(artworkDataUrl);
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Failed to read artwork blob"));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
