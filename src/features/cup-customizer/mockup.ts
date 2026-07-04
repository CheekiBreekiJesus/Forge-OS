import type { CustomizerConfiguration, CustomizerPricingSnapshot } from "@/domain/customizer-types";
import type { Product } from "@/domain/product-types";

function escapeSvgText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function buildMockupAssetBlob(
  product: Product,
  configuration: CustomizerConfiguration,
  quantity: number,
  pricing: CustomizerPricingSnapshot
): Blob {
  const artworkX =
    configuration.artworkPosition === "left" ? 168 : configuration.artworkPosition === "right" ? 312 : 240;
  const artworkY = 225 + configuration.artworkOffsetY * 2;
  const artworkWidth = Math.round(150 * configuration.artworkScale);
  const artworkHeight = Math.round(105 * configuration.artworkScale);
  const safeProductName = escapeSvgText(product.name);
  const safeSku = escapeSvgText(product.sku);
  const safePrintArea = escapeSvgText(configuration.printArea);
  const safeMaterial = escapeSvgText(configuration.material);
  const total = pricing.total.toFixed(2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="540" viewBox="0 0 720 540" role="img" aria-label="ForgeOS cup mockup">
  <rect width="720" height="540" fill="#0f172a"/>
  <rect x="36" y="32" width="648" height="476" rx="24" fill="#111827" stroke="#334155"/>
  <path d="M264 110h192l-32 310H296z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="4"/>
  <path d="M282 138h156l-18 252H300z" fill="#f8fafc" opacity="0.86"/>
  <g transform="translate(${artworkX + configuration.artworkOffsetX * 2} ${artworkY}) rotate(${configuration.artworkRotation})">
    <rect x="${-artworkWidth / 2}" y="${-artworkHeight / 2}" width="${artworkWidth}" height="${artworkHeight}" rx="12" fill="#f97316" opacity="0.88"/>
    <text x="0" y="4" text-anchor="middle" fill="#fff7ed" font-family="Arial, sans-serif" font-size="18" font-weight="700">${safePrintArea}</text>
  </g>
  <text x="72" y="84" fill="#f8fafc" font-family="Arial, sans-serif" font-size="28" font-weight="700">${safeProductName}</text>
  <text x="72" y="120" fill="#cbd5e1" font-family="Arial, sans-serif" font-size="16">SKU ${safeSku} | ${safeMaterial} | ${quantity} units</text>
  <text x="72" y="460" fill="#fbbf24" font-family="Arial, sans-serif" font-size="18" font-weight="700">Estimated total EUR ${total}</text>
  <text x="72" y="486" fill="#94a3b8" font-family="Arial, sans-serif" font-size="13">Local ForgeOS mockup. Artwork asset remains private in the tenant database.</text>
</svg>`;
  return new Blob([svg], { type: "image/svg+xml" });
}

export function buildMockupFileName(sku: string): string {
  const safeSku = sku.toLowerCase().replace(/[^a-z0-9-]+/g, "-") || "cup";
  return `${safeSku}-customizer-mockup.svg`;
}
