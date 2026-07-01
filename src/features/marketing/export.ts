import type {
  BrandKit,
  CampaignExportPackage,
  MarketingAsset,
  MarketingAudience,
  MarketingCampaign,
  CampaignContentVariant
} from "@/domain/marketing-types";
import type { Product } from "@/domain/product-types";

export function buildCampaignExportPackage(input: {
  campaign: MarketingCampaign;
  brandKit: BrandKit | null;
  audiences: MarketingAudience[];
  products: Product[];
  variants: CampaignContentVariant[];
  assets: MarketingAsset[];
}): CampaignExportPackage {
  return {
    approvedAssets: input.assets.filter((asset) => asset.approvalStatus === "approved"),
    approvedVariants: input.variants.filter((variant) => variant.approvalStatus === "approved"),
    audienceSummary: input.audiences,
    brandKit: input.brandKit,
    campaign: input.campaign,
    exportedAt: new Date().toISOString(),
    products: input.products.map((product) => ({ id: product.id, name: product.name, sku: product.sku })),
    providerPayloadPreviews: [
      {
        enabled: false,
        payload: {
          campaignName: input.campaign.name,
          channels: input.campaign.channels,
          landingPageUrl: input.campaign.landingPageUrl
        },
        provider: "google_ads",
        reason: "Google Ads publishing is disabled in this local foundation."
      },
      {
        enabled: false,
        payload: {
          campaignName: input.campaign.name,
          channels: input.campaign.channels,
          assetCount: input.assets.length
        },
        provider: "meta_ads",
        reason: "Meta Ads publishing is disabled in this local foundation."
      }
    ]
  };
}

export function campaignCopySheetCsv(variants: CampaignContentVariant[]): string {
  const rows = [["channel", "language", "headline", "body", "callToAction", "approvalStatus"]];
  for (const variant of variants) {
    rows.push([
      variant.channel,
      variant.language,
      variant.headline,
      variant.body,
      variant.callToAction,
      variant.approvalStatus
    ]);
  }
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}
