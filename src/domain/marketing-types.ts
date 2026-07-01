import type { LocalAssetType } from "@/domain/profile-types";

export type MarketingApprovalStatus = "draft" | "pending_review" | "approved" | "rejected";

export type MarketingCampaignObjective =
  | "brand_awareness"
  | "lead_generation"
  | "website_traffic"
  | "product_promotion"
  | "event_promotion"
  | "customer_reactivation"
  | "quotation_requests";

export type MarketingChannel =
  | "google_search"
  | "google_display"
  | "meta_facebook"
  | "meta_instagram"
  | "email"
  | "cold_outreach"
  | "linkedin"
  | "website_banner"
  | "landing_page";

export type MarketingCampaignStatus =
  | "draft"
  | "generating"
  | "ready_for_review"
  | "approved"
  | "export_ready"
  | "scheduled_external"
  | "active_external"
  | "paused"
  | "completed"
  | "archived";

export type MarketingAssetType =
  | "original_product_photo"
  | "removed_background"
  | "transparent_png"
  | "catalogue_image"
  | "lifestyle_image"
  | "campaign_image"
  | "mockup"
  | "email_banner"
  | "website_banner"
  | "video";

export type MarketingAssetChannel = MarketingChannel | "asset_library" | "image_studio";

export type ImageTransformationType =
  | "background_removal"
  | "transparent_background"
  | "white_catalogue_background"
  | "background_replacement"
  | "image_cleanup"
  | "lighting_improvement"
  | "product_centering"
  | "crop_resize"
  | "upscale"
  | "lifestyle_scene"
  | "advertising_composition"
  | "email_banner"
  | "website_hero"
  | "social_post"
  | "story_reel_cover";

export type ImageAspectRatio =
  | "1:1"
  | "4:5"
  | "9:16"
  | "16:9"
  | "1.91:1"
  | "website_hero"
  | "email_banner"
  | "transparent_product";

export type AdvertisingProviderId = "google_ads" | "meta_ads";

export type AdvertisingConnectionStatus =
  | "not_configured"
  | "authentication_required"
  | "local_preview"
  | "connection_error"
  | "connected";

export type MarketingBudget = {
  amount: number;
  period: "campaign" | "daily" | "monthly";
};

export type SocialLinks = {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  website?: string;
};

export type BrandKit = {
  id: string;
  tenantId: string;
  name: string;
  companyProfileId: string | null;
  primaryLogoAssetId: string | null;
  secondaryLogoAssetId: string | null;
  iconAssetId: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  companyDescription: string;
  shortCompanyDescription: string;
  toneOfVoice: string;
  approvedClaims: string[];
  prohibitedClaims: string[];
  defaultCallToActions: string[];
  legalFooter: string;
  websiteUrl: string;
  socialLinks: SocialLinks;
  active: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
  archiveReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateBrandKitInput = Omit<
  BrandKit,
  "id" | "tenantId" | "createdAt" | "updatedAt" | "archivedAt" | "archivedBy" | "archiveReason"
>;

export type UpdateBrandKitInput = Partial<CreateBrandKitInput>;

export type MarketingAsset = {
  id: string;
  tenantId: string;
  productId: string | null;
  campaignId: string | null;
  sourceAssetId: string | null;
  derivedAssetId: string | null;
  assetType: MarketingAssetType;
  title: string;
  description: string;
  channel: MarketingAssetChannel;
  aspectRatio: ImageAspectRatio;
  width: number;
  height: number;
  mimeType: string;
  generationProvider: string | null;
  generationModel: string | null;
  generationPrompt: string;
  transformationType: ImageTransformationType | null;
  approvalStatus: MarketingApprovalStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  active: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
  archiveReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateMarketingAssetInput = Omit<
  MarketingAsset,
  "id" | "tenantId" | "createdAt" | "updatedAt" | "archivedAt" | "archivedBy" | "archiveReason" | "approvedAt" | "approvedBy"
> & {
  approvedAt?: string | null;
  approvedBy?: string | null;
};

export type UpdateMarketingAssetInput = Partial<CreateMarketingAssetInput>;

export type MarketingCampaign = {
  id: string;
  tenantId: string;
  name: string;
  objective: MarketingCampaignObjective;
  status: MarketingCampaignStatus;
  selectedProductIds: string[];
  audienceIds: string[];
  channels: MarketingChannel[];
  targetRegions: string[];
  budget: MarketingBudget;
  currency: string;
  startDate: string | null;
  endDate: string | null;
  offer: string;
  landingPageUrl: string;
  callToAction: string;
  campaignConcept: string;
  approvalStatus: MarketingApprovalStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  createdBy: string;
  active: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
  archiveReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateMarketingCampaignInput = Omit<
  MarketingCampaign,
  "id" | "tenantId" | "createdAt" | "updatedAt" | "archivedAt" | "archivedBy" | "archiveReason" | "approvedAt" | "approvedBy"
> & {
  approvedAt?: string | null;
  approvedBy?: string | null;
};

export type UpdateMarketingCampaignInput = Partial<CreateMarketingCampaignInput>;

export type CampaignContentVariant = {
  id: string;
  tenantId: string;
  campaignId: string;
  channel: MarketingChannel;
  language: "pt-PT" | "en";
  headline: string;
  secondaryHeadline: string;
  body: string;
  description: string;
  callToAction: string;
  assetIds: string[];
  provider: string;
  model: string;
  generatedAt: string;
  userEdited: boolean;
  approvalStatus: MarketingApprovalStatus;
  selected: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateCampaignContentVariantInput = Omit<
  CampaignContentVariant,
  "id" | "tenantId" | "createdAt" | "updatedAt" | "generatedAt"
> & {
  generatedAt?: string;
};

export type UpdateCampaignContentVariantInput = Partial<
  Omit<CampaignContentVariant, "id" | "tenantId" | "campaignId" | "createdAt" | "updatedAt">
>;

export type MarketingAudience = {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  industry: string;
  organizationTypes: string[];
  regions: string[];
  languages: string[];
  interests: string[];
  source: string;
  estimatedSize: number;
  active: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
  archiveReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateMarketingAudienceInput = Omit<
  MarketingAudience,
  "id" | "tenantId" | "createdAt" | "updatedAt" | "archivedAt" | "archivedBy" | "archiveReason"
>;

export type UpdateMarketingAudienceInput = Partial<CreateMarketingAudienceInput>;

export type AdvertisingAccount = {
  id: string;
  tenantId: string;
  provider: AdvertisingProviderId;
  displayName: string;
  externalAccountId: string | null;
  connectionStatus: AdvertisingConnectionStatus;
  lastSyncAt: string | null;
  capabilities: string[];
  configurationMetadata: Record<string, string | number | boolean>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAdvertisingAccountInput = Omit<
  AdvertisingAccount,
  "id" | "tenantId" | "createdAt" | "updatedAt"
>;

export type UpdateAdvertisingAccountInput = Partial<CreateAdvertisingAccountInput>;

export type AdvertisingCampaignMapping = {
  id: string;
  tenantId: string;
  marketingCampaignId: string;
  advertisingAccountId: string;
  provider: AdvertisingProviderId;
  externalCampaignId: string | null;
  externalAdGroupIds: string[];
  syncStatus: "not_synced" | "draft_preview" | "sync_blocked" | "synced";
  lastSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VideoProject = {
  id: string;
  tenantId: string;
  campaignId: string | null;
  title: string;
  durationSeconds: 6 | 15 | 30;
  aspectRatio: "9:16" | "1:1" | "16:9";
  storyboard: string[];
  assetIds: string[];
  voiceOverMode: "none" | "script" | "future_provider";
  subtitleMode: "none" | "burned_in" | "sidecar";
  provider: string;
  status: "storyboard" | "ready_for_review" | "rendering_disabled" | "archived";
  active: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
  archiveReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateVideoProjectInput = Omit<
  VideoProject,
  "id" | "tenantId" | "createdAt" | "updatedAt" | "archivedAt" | "archivedBy" | "archiveReason"
>;

export type UpdateVideoProjectInput = Partial<CreateVideoProjectInput>;

export type ProviderDiagnostic = {
  providerId: string;
  configured: boolean;
  status: "ok" | "not_configured" | "authentication_required" | "disabled" | "error";
  message: string;
  capabilities: string[];
};

export type ImageGenerationRequest = {
  productId: string | null;
  sourceAssetIds: string[];
  transformationType: ImageTransformationType;
  aspectRatio: ImageAspectRatio;
  outputMimeType: "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml";
  prompt: string;
  locale: "pt-PT" | "en";
};

export type ImageGenerationResult = {
  providerId: string;
  model: string;
  prompt: string;
  outputAssetType: LocalAssetType;
  mimeType: string;
  width: number;
  height: number;
  blob: Blob;
  warnings: string[];
};

export type MarketingCampaignGenerationResult = {
  campaignConcept: string;
  campaignAngle: string;
  targetAudienceSummary: string;
  headlineVariants: string[];
  descriptionVariants: string[];
  callToActionVariants: string[];
  imageBrief: string;
  channelRecommendations: MarketingChannel[];
  warnings: string[];
  assumptions: string[];
  provider: string;
  model: string;
  fallbackUsed: boolean;
};

export type CampaignExportPackage = {
  exportedAt: string;
  campaign: MarketingCampaign;
  brandKit: BrandKit | null;
  audienceSummary: MarketingAudience[];
  products: Array<{ id: string; name: string; sku: string }>;
  approvedVariants: CampaignContentVariant[];
  approvedAssets: MarketingAsset[];
  providerPayloadPreviews: Array<{
    provider: AdvertisingProviderId;
    enabled: false;
    reason: string;
    payload: Record<string, unknown>;
  }>;
};
