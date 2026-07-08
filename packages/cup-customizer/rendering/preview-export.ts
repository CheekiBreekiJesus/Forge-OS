import { normalizeCupSize, type PrintAreaId } from "../config/cup-catalog";
import { CUP_PLACEMENT_BY_SIZE } from "../config/visual-assets";
import {
  computeArtworkExportGeometry,
  normalizeArtworkRotation,
  type ArtworkTransformInput
} from "./artwork-layout";

export type PreviewExportInput = {
  sceneBackgroundDataUrl: string | null;
  cupImageDataUrl: string | null;
  artworkDataUrl: string | null;
  cupSizeMl: number;
  printArea: PrintAreaId;
  artworkScale: number;
  artworkOffsetX: number;
  artworkOffsetY: number;
  artworkRotation: number;
  productName: string;
  productSku: string;
  cupTypeLabel: string;
  cupSizeLabel: string;
  printAreaLabel: string;
  quantity: number;
  totalLabel: string;
};

const SIZE = 720;

function escapeSvgText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildPreviewExportSvg(input: PreviewExportInput): string {
  const sizeMl = normalizeCupSize(input.cupSizeMl, "reusable_pp");
  const placement = CUP_PLACEMENT_BY_SIZE[sizeMl];
  const transformInput: ArtworkTransformInput = {
    artworkOffsetX: input.artworkOffsetX,
    artworkOffsetY: input.artworkOffsetY,
    artworkRotation: input.artworkRotation,
    artworkScale: input.artworkScale,
    cupSizeMl: sizeMl,
    printArea: input.printArea
  };
  const { artwork, region } = computeArtworkExportGeometry(transformInput, SIZE);

  const cupWidth = (SIZE * placement.cupTransform.widthPercent) / 100;
  const cupLeft = SIZE / 2 - cupWidth / 2 + (SIZE * placement.cupTransform.translateXPercent) / 100;
  const cupBottom = (SIZE * placement.cupTransform.bottomPercent) / 100;

  const sceneLayer = input.sceneBackgroundDataUrl
    ? `<image href="${input.sceneBackgroundDataUrl}" x="0" y="0" width="${SIZE}" height="${SIZE}" preserveAspectRatio="xMidYMid slice" />`
    : `<rect width="${SIZE}" height="${SIZE}" fill="#1e293b"/>`;

  const cupLayer = input.cupImageDataUrl
    ? `<image href="${input.cupImageDataUrl}" x="${cupLeft}" y="${SIZE - cupBottom - cupWidth}" width="${cupWidth}" height="${cupWidth}" preserveAspectRatio="xMidYMax meet" />`
    : `<path d="M${SIZE * 0.38} ${SIZE * 0.18}h${SIZE * 0.24}l-${SIZE * 0.04} ${SIZE * 0.58}H${SIZE * 0.42}z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="3"/>`;

  const rotation = normalizeArtworkRotation(input.artworkRotation);
  const artworkLayer = input.artworkDataUrl
    ? `<g transform="translate(${artwork.centerX} ${artwork.centerY}) rotate(${rotation})">
         <image href="${input.artworkDataUrl}" x="${-artwork.width / 2}" y="${-artwork.height / 2}" width="${artwork.width}" height="${artwork.height}" preserveAspectRatio="xMidYMid meet" opacity="0.95" />
       </g>`
    : `<g transform="translate(${artwork.centerX} ${artwork.centerY}) rotate(${rotation})">
         <rect x="${-artwork.width / 2}" y="${-artwork.height / 2}" width="${artwork.width}" height="${artwork.height}" rx="8" fill="#f97316" opacity="0.35" stroke="#fb923c" stroke-dasharray="6 4"/>
       </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" role="img" aria-label="Cup preview export">
  <rect width="${SIZE}" height="${SIZE}" fill="#0f172a"/>
  ${sceneLayer}
  ${cupLayer}
  <clipPath id="print-band"><rect x="${region.left}" y="${region.top}" width="${region.width}" height="${region.height}" rx="6"/></clipPath>
  <g clip-path="url(#print-band)">${artworkLayer}</g>
  <text x="48" y="56" fill="#f8fafc" font-family="Arial, sans-serif" font-size="22" font-weight="700">${escapeSvgText(input.productName)}</text>
  <text x="48" y="84" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="14">${escapeSvgText(input.productSku)} · ${escapeSvgText(input.cupTypeLabel)} · ${escapeSvgText(input.cupSizeLabel)} · ${escapeSvgText(input.printAreaLabel)}</text>
  <text x="48" y="108" fill="#94a3b8" font-family="Arial, sans-serif" font-size="13">${input.quantity.toLocaleString()} units</text>
  <text x="48" y="${SIZE - 44}" fill="#fbbf24" font-family="Arial, sans-serif" font-size="17" font-weight="700">${escapeSvgText(input.totalLabel)}</text>
  <text x="48" y="${SIZE - 20}" fill="#64748b" font-family="Arial, sans-serif" font-size="12">ForgeOS cup preview — artwork remains private in tenant storage.</text>
</svg>`;
}

export async function buildPreviewExportBlob(input: PreviewExportInput): Promise<Blob> {
  const svg = buildPreviewExportSvg(input);
  return new Blob([svg], { type: "image/svg+xml" });
}

export async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) return null;
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => reject(new Error("read_failed"));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
