import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import { calculateMarketingAnalytics } from "@/features/marketing/analytics";
import {
  generateMarketingCampaignContent,
  variantsFromGeneration
} from "@/features/marketing/campaign-generation";
import { buildCampaignExportPackage, campaignCopySheetCsv } from "@/features/marketing/export";
import {
  createAdvertisingProviderRegistry,
  createImageProviderRegistry,
  resolvePresetDimensions
} from "@/features/marketing/providers";
import { generateDeterministicStoryboard } from "@/features/marketing/video-storyboard";
import { deriveLocalNotifications } from "@/features/notifications/local-notifications";
import { deriveOnboardingItems } from "@/features/onboarding/checklist";
import { exportBackup, validateBackup } from "@/features/backup/service";
import { getDatabase } from "@/persistence/db";
import { createLocalRepositoryBundle, seedDatabase } from "@/persistence/indexeddb/repositories";
import { destroyDatabaseForTests } from "@/persistence/registry";

const TEST_DB = "forgeos:test:marketing";

function getTestRepos() {
  return createLocalRepositoryBundle(getDatabase(TEST_DB));
}

async function seedMarketingFixture() {
  const repos = getTestRepos();
  const [product] = await repos.products.list(DEFAULT_TENANT_ID);
  expect(product).toBeTruthy();
  if (!product) throw new Error("Missing seeded product");

  const brandKit = await repos.brandKits.create(DEFAULT_TENANT_ID, {
    active: true,
    accentColor: "#f97316",
    approvedClaims: ["Manufacturing-focused product presentation"],
    backgroundColor: "#020617",
    bodyFont: "Inter",
    companyDescription: "Synthetic manufacturing company for tests.",
    companyProfileId: null,
    defaultCallToActions: ["Request quotation"],
    headingFont: "Inter",
    iconAssetId: null,
    legalFooter: "Synthetic fixture. Review before publishing.",
    name: "Synthetic Brand Kit",
    primaryColor: "#f97316",
    primaryLogoAssetId: null,
    prohibitedClaims: ["Guaranteed results"],
    secondaryColor: "#0f172a",
    secondaryLogoAssetId: null,
    shortCompanyDescription: "Synthetic manufacturer.",
    socialLinks: {},
    textColor: "#f8fafc",
    toneOfVoice: "clear and practical",
    websiteUrl: "https://example.invalid"
  });

  const audience = await repos.marketingAudiences.create(DEFAULT_TENANT_ID, {
    active: true,
    description: "Synthetic industrial buyers.",
    estimatedSize: 120,
    industry: "Manufacturing",
    interests: ["custom packaging"],
    languages: ["en"],
    name: "Synthetic Industrial Buyers",
    organizationTypes: ["SME"],
    regions: ["Portugal"],
    source: "synthetic-test"
  });

  const campaign = await repos.marketingCampaigns.create(DEFAULT_TENANT_ID, {
    active: true,
    approvalStatus: "pending_review",
    audienceIds: [audience.id],
    budget: { amount: 250, period: "campaign" },
    callToAction: "Request quotation",
    campaignConcept: "",
    channels: ["email", "website_banner"],
    createdBy: "test-user",
    currency: "EUR",
    endDate: null,
    landingPageUrl: "",
    name: "Synthetic Launch Campaign",
    objective: "lead_generation",
    offer: "",
    selectedProductIds: [product.id],
    startDate: null,
    status: "draft",
    targetRegions: ["Portugal"]
  });

  return { audience, brandKit, campaign, product, repos };
}

describe("marketing studio foundation", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
  });

  it("persists brand kits, audiences, campaigns, variants, assets, accounts and video projects", async () => {
    const { brandKit, campaign, product, repos } = await seedMarketingFixture();
    expect((await repos.brandKits.getDefault(DEFAULT_TENANT_ID))?.id).toBe(brandKit.id);

    const generation = generateMarketingCampaignContent({
      audiences: await repos.marketingAudiences.list(DEFAULT_TENANT_ID),
      brandKit,
      campaign,
      language: "en",
      products: [product]
    });
    expect(generation.fallbackUsed).toBe(true);
    expect(generation.warnings.join(" ")).toContain("No paid AI provider");

    for (const variant of variantsFromGeneration({ campaign, language: "en", result: generation })) {
      await repos.campaignContentVariants.create(DEFAULT_TENANT_ID, variant);
    }
    const variants = await repos.campaignContentVariants.listForCampaign(DEFAULT_TENANT_ID, campaign.id);
    expect(variants).toHaveLength(2);

    const dimensions = resolvePresetDimensions("1:1");
    const asset = await repos.marketingAssets.create(DEFAULT_TENANT_ID, {
      active: true,
      approvalStatus: "pending_review",
      aspectRatio: "1:1",
      assetType: "campaign_image",
      campaignId: campaign.id,
      channel: "image_studio",
      derivedAssetId: null,
      description: "Synthetic generated image metadata.",
      generationModel: "deterministic-svg-v1",
      generationPrompt: generation.imageBrief,
      generationProvider: "mock-image",
      height: dimensions.height,
      mimeType: "image/svg+xml",
      productId: product.id,
      sourceAssetId: null,
      title: "Synthetic campaign image",
      transformationType: "advertising_composition",
      width: dimensions.width
    });
    const approvedAsset = await repos.marketingAssets.approve(DEFAULT_TENANT_ID, asset.id, "test-user");
    expect(approvedAsset.approvalStatus).toBe("approved");

    await repos.advertisingAccounts.upsert(DEFAULT_TENANT_ID, {
      active: true,
      capabilities: ["payload_preview"],
      configurationMetadata: { publishingEnabled: false },
      connectionStatus: "local_preview",
      displayName: "Google Ads local preview",
      externalAccountId: null,
      lastSyncAt: null,
      provider: "google_ads"
    });

    const storyboard = generateDeterministicStoryboard({
      aspectRatio: "9:16",
      campaign,
      durationSeconds: 15
    });
    const video = await repos.videoProjects.create(DEFAULT_TENANT_ID, {
      active: true,
      aspectRatio: "9:16",
      assetIds: [],
      campaignId: campaign.id,
      durationSeconds: 15,
      provider: "deterministic-storyboard",
      status: "storyboard",
      storyboard,
      subtitleMode: "burned_in",
      title: "Synthetic storyboard",
      voiceOverMode: "none"
    });
    expect(video.storyboard).toHaveLength(4);

    const approvedCampaign = await repos.marketingCampaigns.approve(
      DEFAULT_TENANT_ID,
      campaign.id,
      "test-user"
    );
    const exportedCampaign = await repos.marketingCampaigns.markExported(
      DEFAULT_TENANT_ID,
      approvedCampaign.id
    );
    expect(exportedCampaign.status).toBe("export_ready");

    const analytics = calculateMarketingAnalytics({
      accounts: await repos.advertisingAccounts.list(DEFAULT_TENANT_ID),
      assets: await repos.marketingAssets.list(DEFAULT_TENANT_ID),
      campaigns: await repos.marketingCampaigns.list(DEFAULT_TENANT_ID),
      products: await repos.products.list(DEFAULT_TENANT_ID),
      videoProjects: await repos.videoProjects.list(DEFAULT_TENANT_ID)
    });
    expect(analytics.approvedAssets).toBe(1);
    expect(analytics.estimatedBudget).toBe(250);
    expect(analytics.providerConnected).toBe(false);
  });

  it("exports only reviewed content and keeps provider publishing disabled", async () => {
    const { brandKit, campaign, product, repos } = await seedMarketingFixture();
    const generation = generateMarketingCampaignContent({
      audiences: [],
      brandKit,
      campaign,
      language: "en",
      products: [product]
    });
    const [variantInput] = variantsFromGeneration({ campaign, language: "en", result: generation });
    expect(variantInput).toBeTruthy();
    if (!variantInput) return;
    const variant = await repos.campaignContentVariants.create(DEFAULT_TENANT_ID, variantInput);
    await repos.campaignContentVariants.approve(DEFAULT_TENANT_ID, variant.id);

    const asset = await repos.marketingAssets.create(DEFAULT_TENANT_ID, {
      active: true,
      approvalStatus: "approved",
      aspectRatio: "1:1",
      assetType: "campaign_image",
      campaignId: campaign.id,
      channel: "image_studio",
      derivedAssetId: null,
      description: "Synthetic approved image.",
      generationModel: "deterministic-svg-v1",
      generationPrompt: "Synthetic prompt",
      generationProvider: "mock-image",
      height: 1080,
      mimeType: "image/svg+xml",
      productId: product.id,
      sourceAssetId: null,
      title: "Synthetic approved image",
      transformationType: "advertising_composition",
      width: 1080
    });

    const exportPackage = buildCampaignExportPackage({
      assets: [asset],
      audiences: [],
      brandKit,
      campaign,
      products: [product],
      variants: await repos.campaignContentVariants.listForCampaign(DEFAULT_TENANT_ID, campaign.id)
    });
    expect(exportPackage.approvedAssets).toHaveLength(1);
    expect(exportPackage.approvedVariants).toHaveLength(1);
    expect(exportPackage.providerPayloadPreviews.every((preview) => preview.enabled === false)).toBe(true);

    const csv = campaignCopySheetCsv(exportPackage.approvedVariants);
    expect(csv).toContain('"headline"');
    expect(csv).toContain('"approvalStatus"');

    const advertisingProvider = createAdvertisingProviderRegistry().get("google_ads");
    await expect(advertisingProvider.validateConfiguration()).resolves.toMatchObject({
      configured: false,
      status: "not_configured"
    });
    await expect(advertisingProvider.createCampaignDraft({ campaignId: campaign.id })).resolves.toMatchObject({
      enabled: false,
      provider: "google_ads"
    });

    const imageProvider = createImageProviderRegistry().get();
    const image = await imageProvider.generateImage({
      aspectRatio: "1:1",
      locale: "en",
      outputMimeType: "image/svg+xml",
      productId: product.id,
      prompt: "Synthetic product image",
      sourceAssetIds: [],
      transformationType: "advertising_composition"
    });
    expect(image.mimeType).toBe("image/svg+xml");
    expect(image.warnings.join(" ")).toContain("No paid provider");
  });

  it("includes marketing data in onboarding, notifications and backups", async () => {
    const { campaign, product, repos } = await seedMarketingFixture();
    const asset = await repos.marketingAssets.create(DEFAULT_TENANT_ID, {
      active: true,
      approvalStatus: "pending_review",
      aspectRatio: "1:1",
      assetType: "campaign_image",
      campaignId: campaign.id,
      channel: "image_studio",
      derivedAssetId: null,
      description: "Synthetic review asset.",
      generationModel: "deterministic-svg-v1",
      generationPrompt: "Synthetic prompt",
      generationProvider: "mock-image",
      height: 1080,
      mimeType: "image/svg+xml",
      productId: product.id,
      sourceAssetId: null,
      title: "Synthetic review asset",
      transformationType: "advertising_composition",
      width: 1080
    });

    const onboarding = await deriveOnboardingItems(repos, DEFAULT_TENANT_ID, "en");
    expect(onboarding.find((item) => item.id === "brand_kit_configured")?.completed).toBe(true);
    expect(onboarding.find((item) => item.id === "first_marketing_campaign_created")?.completed).toBe(true);
    expect(onboarding.find((item) => item.id === "first_marketing_asset_uploaded")?.completed).toBe(true);

    const notifications = await deriveLocalNotifications(repos, DEFAULT_TENANT_ID, "en");
    expect(notifications.some((item) => item.id === `marketing-review-${campaign.id}`)).toBe(true);
    expect(notifications.some((item) => item.id === `marketing-asset-review-${asset.id}`)).toBe(true);
    expect(notifications.some((item) => item.kind === "campaign_missing_landing_page")).toBe(true);

    const backup = await exportBackup(repos, DEFAULT_TENANT_ID, false);
    expect(validateBackup(backup)).toBe(true);
    expect(backup.tables.brandKits).toHaveLength(1);
    expect(backup.tables.marketingCampaigns).toHaveLength(1);
    expect(backup.tables.marketingAssets).toHaveLength(1);
  });
});
