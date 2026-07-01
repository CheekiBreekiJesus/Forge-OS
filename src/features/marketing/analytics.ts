import type {
  AdvertisingAccount,
  MarketingAsset,
  MarketingCampaign,
  MarketingChannel,
  VideoProject
} from "@/domain/marketing-types";
import type { Product } from "@/domain/product-types";

export function calculateMarketingAnalytics(input: {
  accounts: AdvertisingAccount[];
  assets: MarketingAsset[];
  campaigns: MarketingCampaign[];
  products: Product[];
  videoProjects: VideoProject[];
}) {
  const approvedCampaigns = input.campaigns.filter((campaign) => campaign.approvalStatus === "approved");
  const approvedAssets = input.assets.filter((asset) => asset.approvalStatus === "approved");
  const draftAssets = input.assets.filter((asset) => asset.approvalStatus !== "approved");
  const channels = input.campaigns.flatMap((campaign) => campaign.channels);
  const statusDistribution = input.campaigns.reduce<Record<string, number>>((acc, campaign) => {
    acc[campaign.status] = (acc[campaign.status] ?? 0) + 1;
    return acc;
  }, {});
  const campaignsByChannel = channels.reduce<Record<MarketingChannel, number>>((acc, channel) => {
    acc[channel] = (acc[channel] ?? 0) + 1;
    return acc;
  }, {} as Record<MarketingChannel, number>);

  return {
    activeCampaigns: input.campaigns.filter((campaign) => campaign.active && campaign.status !== "archived").length,
    approvedAssets: approvedAssets.length,
    approvedCampaigns: approvedCampaigns.length,
    assetsGenerated: input.assets.filter((asset) => asset.generationProvider).length,
    campaignsAwaitingApproval: input.campaigns.filter((campaign) => campaign.approvalStatus === "pending_review").length,
    campaignsByChannel,
    draftAssets: draftAssets.length,
    estimatedBudget: input.campaigns.reduce((sum, campaign) => sum + campaign.budget.amount, 0),
    productsWithMarketingAssets: new Set(input.assets.filter((asset) => asset.productId).map((asset) => asset.productId)).size,
    providerConnected: input.accounts.some((account) => account.connectionStatus === "connected"),
    statusDistribution,
    videoStoryboards: input.videoProjects.length
  };
}
