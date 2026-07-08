import { printableWidthFraction } from "../config/print-area";
import type { PrintAreaId } from "../config/cup-catalog";

export type PreviewExportInput = {
  backgroundDataUrl: string | null;
  artworkDataUrl: string | null;
  printArea: PrintAreaId;
  artworkPosition: string;
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

const WIDTH = 720;
const HEIGHT = 540;

function escapeSvgText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function artworkAnchorX(position: string): number {
  if (position === "left") return 0.22;
  if (position === "right") return 0.62;
  return 0.38;
}

export function buildPreviewExportSvg(input: PreviewExportInput): string {
  const bandTop = HEIGHT * 0.24;
  const bandHeight = HEIGHT * 0.34;
  const bandWidth = WIDTH * printableWidthFraction(input.printArea);
  const bandLeft = (WIDTH - bandWidth) / 2;
  const anchorX = bandLeft + bandWidth * artworkAnchorX(input.artworkPosition) + (input.artworkOffsetX / 100) * bandWidth;
  const anchorY = bandTop + bandHeight * 0.45 + (input.artworkOffsetY / 100) * bandHeight;
  const artWidth = bandWidth * 0.55 * input.artworkScale;
  const artHeight = bandHeight * 0.7 * input.artworkScale;

  const backgroundLayer = input.backgroundDataUrl
    ? `<image href="${input.backgroundDataUrl}" x="120" y="40" width="480" height="420" preserveAspectRatio="xMidYMid meet" />`
    : `<path d="M300 70h120l-20 360H320z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="3"/>
       <path d="M312 96h96l-12 300H324z" fill="#f8fafc" opacity="0.9"/>`;

  const artworkLayer = input.artworkDataUrl
    ? `<g transform="translate(${anchorX} ${anchorY}) rotate(${input.artworkRotation})">
         <image href="${input.artworkDataUrl}" x="${-artWidth / 2}" y="${-artHeight / 2}" width="${artWidth}" height="${artHeight}" preserveAspectRatio="xMidYMid meet" />
       </g>`
    : `<g transform="translate(${anchorX} ${anchorY}) rotate(${input.artworkRotation})">
         <rect x="${-artWidth / 2}" y="${-artHeight / 2}" width="${artWidth}" height="${artHeight}" rx="8" fill="#f97316" opacity="0.35" stroke="#fb923c" stroke-dasharray="6 4"/>
       </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="Cup preview export">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#0f172a"/>
  <rect x="24" y="20" width="${WIDTH - 48}" height="${HEIGHT - 40}" rx="20" fill="#111827" stroke="#334155"/>
  ${backgroundLayer}
  <rect x="${bandLeft}" y="${bandTop}" width="${bandWidth}" height="${bandHeight}" fill="none" stroke="#38bdf8" stroke-dasharray="8 6" opacity="0.45"/>
  <clipPath id="print-band"><rect x="${bandLeft}" y="${bandTop}" width="${bandWidth}" height="${bandHeight}" rx="6"/></clipPath>
  <g clip-path="url(#print-band)">${artworkLayer}</g>
  <text x="48" y="56" fill="#f8fafc" font-family="Arial, sans-serif" font-size="22" font-weight="700">${escapeSvgText(input.productName)}</text>
  <text x="48" y="84" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="14">${escapeSvgText(input.productSku)} · ${escapeSvgText(input.cupTypeLabel)} · ${escapeSvgText(input.cupSizeLabel)} · ${escapeSvgText(input.printAreaLabel)}</text>
  <text x="48" y="108" fill="#94a3b8" font-family="Arial, sans-serif" font-size="13">${input.quantity.toLocaleString()} units</text>
  <text x="48" y="${HEIGHT - 44}" fill="#fbbf24" font-family="Arial, sans-serif" font-size="17" font-weight="700">${escapeSvgText(input.totalLabel)}</text>
  <text x="48" y="${HEIGHT - 20}" fill="#64748b" font-family="Arial, sans-serif" font-size="12">ForgeOS cup preview — artwork remains private in tenant storage.</text>
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
