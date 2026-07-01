"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { AppFrame, panelClass } from "@/components/app-frame";
import {
  FormField,
  FormFieldError,
  LoadingState,
  PageHeader,
  PrimaryActionButton,
  inputClassName,
  selectClassName,
  textareaClassName
} from "@/components/crud";
import type {
  AdvertisingProviderId,
  ImageAspectRatio,
  ImageTransformationType,
  MarketingCampaignObjective,
  MarketingChannel
} from "@/domain/marketing-types";
import { calculateMarketingAnalytics } from "@/features/marketing/analytics";
import { generateMarketingCampaignContent, variantsFromGeneration } from "@/features/marketing/campaign-generation";
import { buildCampaignExportPackage, campaignCopySheetCsv } from "@/features/marketing/export";
import { createAdvertisingProviderRegistry, createImageProviderRegistry } from "@/features/marketing/providers";
import { generateDeterministicStoryboard } from "@/features/marketing/video-storyboard";
import { validateLocalAsset } from "@/features/email-composition/local-asset";
import { useCompanyProfile } from "@/persistence/profile-hooks";
import { useMarketingCampaignById, useMarketingStudioData, useProducts } from "@/persistence/hooks";
import { usePersistence, usePersistenceLoading } from "@/persistence/provider";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export type MarketingSection =
  | "overview"
  | "campaigns"
  | "image-studio"
  | "assets"
  | "brand-kit"
  | "audiences"
  | "accounts"
  | "analytics"
  | "video-studio";

type MarketingStudioShellProps = {
  campaignId?: string;
  dictionary: Dictionary;
  locale: Locale;
  section: MarketingSection;
};

const marketingSections: MarketingSection[] = [
  "overview",
  "campaigns",
  "image-studio",
  "assets",
  "brand-kit",
  "audiences",
  "accounts",
  "analytics",
  "video-studio"
];

const objectives: MarketingCampaignObjective[] = [
  "brand_awareness",
  "lead_generation",
  "website_traffic",
  "product_promotion",
  "event_promotion",
  "customer_reactivation",
  "quotation_requests"
];

const channels: MarketingChannel[] = [
  "google_search",
  "google_display",
  "meta_facebook",
  "meta_instagram",
  "email",
  "cold_outreach",
  "linkedin",
  "website_banner",
  "landing_page"
];

const transformations: ImageTransformationType[] = [
  "background_removal",
  "transparent_background",
  "white_catalogue_background",
  "background_replacement",
  "image_cleanup",
  "lighting_improvement",
  "product_centering",
  "crop_resize",
  "upscale",
  "lifestyle_scene",
  "advertising_composition",
  "email_banner",
  "website_hero",
  "social_post",
  "story_reel_cover"
];

const aspectRatios: ImageAspectRatio[] = [
  "1:1",
  "4:5",
  "9:16",
  "16:9",
  "1.91:1",
  "website_hero",
  "email_banner",
  "transparent_product"
];

function money(locale: Locale, value: number) {
  return new Intl.NumberFormat(locale, { currency: "EUR", style: "currency" }).format(value);
}

function splitList(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function downloadText(fileName: string, mimeType: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function MarketingStudioShell({
  campaignId,
  dictionary,
  locale,
  section
}: MarketingStudioShellProps) {
  const copy = dictionary.marketingStudio;
  const loading = usePersistenceLoading();
  const { state, tenantId, notifyDataChanged } = usePersistence();
  const studio = useMarketingStudioData(true);
  const { products } = useProducts();
  const { profile } = useCompanyProfile();
  const campaignDetail = useMarketingCampaignById(campaignId ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const analytics = useMemo(
    () =>
      calculateMarketingAnalytics({
        accounts: studio.advertisingAccounts,
        assets: studio.assets,
        campaigns: studio.campaigns,
        products,
        videoProjects: studio.videoProjects
      }),
    [products, studio.advertisingAccounts, studio.assets, studio.campaigns, studio.videoProjects]
  );

  const activeBrandKit = studio.brandKits.find((kit) => kit.active) ?? studio.brandKits[0] ?? null;

  async function refresh(message: string) {
    notifyDataChanged();
    await studio.reload();
    setFeedback(message);
  }

  async function createBrandKit() {
    if (state.status !== "ready") return;
    setError(null);
    await state.repos.brandKits.create(tenantId, {
      accentColor: "#f97316",
      active: true,
      approvedClaims: [copy.defaults.approvedClaim],
      backgroundColor: "#07101d",
      bodyFont: "Inter",
      companyDescription: profile?.legalFooter || copy.defaults.companyDescription,
      companyProfileId: profile?.id ?? null,
      defaultCallToActions: [copy.defaults.cta],
      headingFont: "Inter",
      iconAssetId: null,
      legalFooter: profile?.legalFooter ?? "",
      name: profile?.tradingName ? `${profile.tradingName} Brand Kit` : "ForgeOS Brand Kit",
      primaryColor: "#f97316",
      primaryLogoAssetId: profile?.logoLocalAssetId ?? null,
      prohibitedClaims: [copy.defaults.prohibitedClaim],
      secondaryColor: "#2563eb",
      secondaryLogoAssetId: null,
      shortCompanyDescription: profile?.tradingName ?? "Industrial supplier",
      socialLinks: {
        facebook: profile?.facebookUrl || undefined,
        linkedin: profile?.linkedinUrl || undefined,
        website: profile?.websiteUrl || undefined
      },
      textColor: "#e5e7eb",
      toneOfVoice: copy.defaults.tone,
      websiteUrl: profile?.websiteUrl ?? ""
    });
    await refresh(copy.feedback.brandKitSaved);
  }

  async function createAudience(form: FormData) {
    if (state.status !== "ready") return;
    const name = String(form.get("name") ?? "").trim();
    if (!name) {
      setError(copy.errors.nameRequired);
      return;
    }
    await state.repos.marketingAudiences.create(tenantId, {
      active: true,
      description: String(form.get("description") ?? "").trim(),
      estimatedSize: Number(form.get("estimatedSize") || 0),
      industry: String(form.get("industry") || "Manufacturing"),
      interests: splitList(String(form.get("interests") ?? "")),
      languages: splitList(String(form.get("languages") || "pt-PT")),
      name,
      organizationTypes: splitList(String(form.get("organizationTypes") ?? "")),
      regions: splitList(String(form.get("regions") || "Portugal")),
      source: "local_planning"
    });
    await refresh(copy.feedback.audienceSaved);
  }

  async function createCampaign(form: FormData) {
    if (state.status !== "ready") return;
    const name = String(form.get("name") ?? "").trim();
    const productId = String(form.get("productId") ?? "");
    const audienceId = String(form.get("audienceId") ?? "");
    if (!name || !productId) {
      setError(copy.errors.campaignRequired);
      return;
    }
    await state.repos.marketingCampaigns.create(tenantId, {
      active: true,
      approvalStatus: "draft",
      audienceIds: audienceId ? [audienceId] : [],
      budget: { amount: Number(form.get("budget") || 0), period: "campaign" },
      callToAction: String(form.get("callToAction") || copy.defaults.cta),
      campaignConcept: "",
      channels: [String(form.get("channel") || "email") as MarketingChannel],
      createdBy: "local-preview",
      currency: "EUR",
      endDate: String(form.get("endDate") || "") || null,
      landingPageUrl: String(form.get("landingPageUrl") || ""),
      name,
      objective: String(form.get("objective") || "product_promotion") as MarketingCampaignObjective,
      offer: String(form.get("offer") || ""),
      selectedProductIds: [productId],
      startDate: String(form.get("startDate") || "") || null,
      status: "draft",
      targetRegions: splitList(String(form.get("targetRegions") || "Portugal"))
    });
    await refresh(copy.feedback.campaignSaved);
  }

  async function generateCopy(campaignIdToGenerate: string) {
    if (state.status !== "ready") return;
    const campaign = await state.repos.marketingCampaigns.getById(tenantId, campaignIdToGenerate);
    if (!campaign) return;
    const selectedProducts = products.filter((product) => campaign.selectedProductIds.includes(product.id));
    const selectedAudiences = studio.audiences.filter((audience) => campaign.audienceIds.includes(audience.id));
    const result = generateMarketingCampaignContent({
      audiences: selectedAudiences,
      brandKit: activeBrandKit,
      campaign,
      language: locale,
      products: selectedProducts
    });
    await state.repos.marketingCampaigns.update(tenantId, campaign.id, {
      approvalStatus: "pending_review",
      campaignConcept: result.campaignConcept,
      status: "ready_for_review"
    });
    for (const variant of variantsFromGeneration({ campaign, language: locale, result })) {
      await state.repos.campaignContentVariants.create(tenantId, variant);
    }
    await state.repos.activities.append(tenantId, {
      action: "marketing_campaign.generated",
      entityId: campaign.id,
      entityType: "marketing_campaign",
      title: `Marketing campaign generated: ${campaign.name}`,
      metadata: { provider: result.provider, fallbackUsed: result.fallbackUsed }
    });
    await refresh(copy.feedback.copyGenerated);
  }

  async function uploadMarketingAsset(file: File, productId: string, campaignIdValue: string | null) {
    if (state.status !== "ready") return;
    const validation = validateLocalAsset(file);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    const asset = await state.repos.localAssets.create(tenantId, {
      assetType: "product-image",
      blob: file,
      fileName: file.name,
      mimeType: validation.mimeType,
      size: validation.size
    });
    await state.repos.marketingAssets.create(tenantId, {
      active: true,
      approvalStatus: "pending_review",
      aspectRatio: "1:1",
      assetType: "original_product_photo",
      campaignId: campaignIdValue,
      channel: "asset_library",
      derivedAssetId: null,
      description: copy.defaults.uploadedAssetDescription,
      generationModel: null,
      generationPrompt: "",
      generationProvider: null,
      height: 0,
      mimeType: validation.mimeType,
      productId: productId || null,
      sourceAssetId: asset.id,
      title: file.name,
      transformationType: null,
      width: 0
    });
    await refresh(copy.feedback.assetSaved);
  }

  async function generateMockImage(form: FormData) {
    if (state.status !== "ready") return;
    const productId = String(form.get("productId") ?? "");
    const campaignIdValue = String(form.get("campaignId") ?? "") || null;
    const transformationType = String(form.get("transformationType") || "background_removal") as ImageTransformationType;
    const aspectRatio = String(form.get("aspectRatio") || "1:1") as ImageAspectRatio;
    const prompt = String(form.get("prompt") || copy.defaults.imageBrief);
    const provider = createImageProviderRegistry().get();
    const result = await provider.transformImage({
      aspectRatio,
      locale,
      outputMimeType: "image/svg+xml",
      productId: productId || null,
      prompt,
      sourceAssetIds: studio.assets.filter((asset) => asset.productId === productId).map((asset) => asset.id),
      transformationType
    });
    const localAsset = await state.repos.localAssets.create(tenantId, {
      assetType: result.outputAssetType,
      blob: result.blob,
      fileName: `marketing-${transformationType}.svg`,
      mimeType: result.mimeType,
      size: result.blob.size
    });
    await state.repos.marketingAssets.create(tenantId, {
      active: true,
      approvalStatus: "pending_review",
      aspectRatio,
      assetType: transformationType === "background_removal" ? "removed_background" : "campaign_image",
      campaignId: campaignIdValue,
      channel: "image_studio",
      derivedAssetId: localAsset.id,
      description: result.warnings.join(" "),
      generationModel: result.model,
      generationPrompt: result.prompt,
      generationProvider: result.providerId,
      height: result.height,
      mimeType: result.mimeType,
      productId: productId || null,
      sourceAssetId: null,
      title: `${copy.labels.mockImage}: ${transformationType}`,
      transformationType,
      width: result.width
    });
    await refresh(copy.feedback.imageGenerated);
  }

  async function approveAsset(assetId: string) {
    if (state.status !== "ready") return;
    await state.repos.marketingAssets.approve(tenantId, assetId, "local-preview");
    await refresh(copy.feedback.assetApproved);
  }

  async function setPreferredProductAsset(assetId: string) {
    if (state.status !== "ready") return;
    const asset = await state.repos.marketingAssets.getById(tenantId, assetId);
    if (!asset?.productId || asset.approvalStatus !== "approved") {
      setError(copy.errors.approvedAssetRequired);
      return;
    }
    const product = await state.repos.products.getById(tenantId, asset.productId);
    if (!product) return;
    await state.repos.products.update(tenantId, product.id, {
      approvedCatalogueMarketingAssetId:
        asset.assetType === "catalogue_image" || asset.assetType === "campaign_image"
          ? asset.id
          : product.approvedCatalogueMarketingAssetId,
      approvedTransparentMarketingAssetId:
        asset.assetType === "transparent_png" || asset.assetType === "removed_background"
          ? asset.id
          : product.approvedTransparentMarketingAssetId,
      marketingAssetHistoryIds: [...new Set([...product.marketingAssetHistoryIds, asset.id])],
      preferredMarketingAssetId: asset.id
    });
    await refresh(copy.feedback.productAssetSet);
  }

  async function approveCampaign(campaignIdToApprove: string) {
    if (state.status !== "ready") return;
    await state.repos.marketingCampaigns.approve(tenantId, campaignIdToApprove, "local-preview");
    await refresh(copy.feedback.campaignApproved);
  }

  async function exportCampaign(campaignIdToExport: string, format: "json" | "csv") {
    if (state.status !== "ready") return;
    const campaign = await state.repos.marketingCampaigns.getById(tenantId, campaignIdToExport);
    if (!campaign) return;
    const packageData = buildCampaignExportPackage({
      assets: studio.assets.filter((asset) => asset.campaignId === campaign.id),
      audiences: studio.audiences.filter((audience) => campaign.audienceIds.includes(audience.id)),
      brandKit: activeBrandKit,
      campaign,
      products: products.filter((product) => campaign.selectedProductIds.includes(product.id)),
      variants: studio.variants.filter((variant) => variant.campaignId === campaign.id)
    });
    if (format === "json") {
      downloadText(`${campaign.name.replaceAll(" ", "-").toLowerCase()}-campaign-package.json`, "application/json", JSON.stringify(packageData, null, 2));
    } else {
      downloadText(`${campaign.name.replaceAll(" ", "-").toLowerCase()}-copy-sheet.csv`, "text/csv", campaignCopySheetCsv(packageData.approvedVariants));
    }
    await state.repos.marketingCampaigns.markExported(tenantId, campaign.id);
    await refresh(copy.feedback.campaignExported);
  }

  async function saveProviderPreview(provider: AdvertisingProviderId) {
    if (state.status !== "ready") return;
    const diagnostic = await createAdvertisingProviderRegistry().get(provider).validateConfiguration();
    await state.repos.advertisingAccounts.upsert(tenantId, {
      active: true,
      capabilities: diagnostic.capabilities,
      configurationMetadata: { publishingDisabled: true },
      connectionStatus: "local_preview",
      displayName: provider === "google_ads" ? "Google Ads" : "Meta Ads",
      externalAccountId: null,
      lastSyncAt: null,
      provider
    });
    await refresh(copy.feedback.providerPreviewSaved);
  }

  async function createVideoProject(form: FormData) {
    if (state.status !== "ready") return;
    const campaignIdValue = String(form.get("campaignId") ?? "") || null;
    const campaign = campaignIdValue
      ? await state.repos.marketingCampaigns.getById(tenantId, campaignIdValue)
      : null;
    const durationSeconds = Number(form.get("durationSeconds") || 15) as 6 | 15 | 30;
    const aspectRatio = String(form.get("aspectRatio") || "9:16") as "9:16" | "1:1" | "16:9";
    await state.repos.videoProjects.create(tenantId, {
      active: true,
      aspectRatio,
      assetIds: [],
      campaignId: campaignIdValue,
      durationSeconds,
      provider: "deterministic-storyboard",
      status: "storyboard",
      storyboard: generateDeterministicStoryboard({ aspectRatio, campaign, durationSeconds }),
      subtitleMode: "burned_in",
      title: String(form.get("title") || campaign?.name || copy.labels.videoProject),
      voiceOverMode: "script"
    });
    await refresh(copy.feedback.videoSaved);
  }

  const pageTitle = campaignId && campaignDetail.campaign ? campaignDetail.campaign.name : copy.sections[section];

  return (
    <AppFrame activeModule="marketing" dictionary={dictionary} locale={locale} supplementalRoute={`marketing${section === "overview" ? "" : `/${section}`}`}>
      <PageHeader
        actions={<PrimaryActionButton onClick={() => window.location.assign(`/${locale}/marketing/campaigns#create`)}>{copy.actions.newCampaign}</PrimaryActionButton>}
        backHref={`/${locale}`}
        backLabel={dictionary.modulePage.backToDashboard}
        description={copy.description}
        title={pageTitle}
      />

      <nav aria-label={copy.labels.subnav} className="mb-5 flex gap-2 overflow-x-auto">
        {marketingSections.map((item) => (
          <Link
            className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold ${
              item === section
                ? "border-orange-500/50 bg-orange-500/15 text-orange-100"
                : "border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-800"
            }`}
            href={`/${locale}/marketing${item === "overview" ? "" : `/${item}`}`}
            key={item}
          >
            {copy.sections[item]}
          </Link>
        ))}
      </nav>

      {feedback ? <p className="mb-4 text-sm text-emerald-300">{feedback}</p> : null}
      <FormFieldError message={error} />

      {loading || studio.loading ? (
        <LoadingState message={copy.labels.loading} />
      ) : campaignId ? (
        <CampaignDetail
          approveCampaign={approveCampaign}
          campaign={campaignDetail.campaign}
          copy={copy}
          exportCampaign={exportCampaign}
          generateCopy={generateCopy}
          locale={locale}
          products={products}
          variants={campaignDetail.variants}
        />
      ) : section === "overview" ? (
        <Overview analytics={analytics} copy={copy} locale={locale} studio={studio} />
      ) : section === "brand-kit" ? (
        <BrandKitSection activeBrandKit={activeBrandKit} createBrandKit={createBrandKit} copy={copy} />
      ) : section === "audiences" ? (
        <AudiencesSection copy={copy} createAudience={createAudience} studio={studio} />
      ) : section === "campaigns" ? (
        <CampaignsSection
          approveCampaign={approveCampaign}
          copy={copy}
          createCampaign={createCampaign}
          exportCampaign={exportCampaign}
          generateCopy={generateCopy}
          locale={locale}
          products={products}
          studio={studio}
        />
      ) : section === "assets" ? (
        <AssetsSection
          approveAsset={approveAsset}
          copy={copy}
          locale={locale}
          products={products}
          setPreferredProductAsset={setPreferredProductAsset}
          studio={studio}
          uploadMarketingAsset={uploadMarketingAsset}
          uploadRef={uploadRef}
        />
      ) : section === "image-studio" ? (
        <ImageStudioSection copy={copy} generateMockImage={generateMockImage} products={products} studio={studio} />
      ) : section === "accounts" ? (
        <AccountsSection copy={copy} saveProviderPreview={saveProviderPreview} studio={studio} />
      ) : section === "analytics" ? (
        <AnalyticsSection analytics={analytics} copy={copy} locale={locale} />
      ) : (
        <VideoStudioSection copy={copy} createVideoProject={createVideoProject} studio={studio} />
      )}
    </AppFrame>
  );
}

type Copy = Dictionary["marketingStudio"];
type StudioData = ReturnType<typeof useMarketingStudioData>;

function Overview({
  analytics,
  copy,
  locale,
  studio
}: {
  analytics: ReturnType<typeof calculateMarketingAnalytics>;
  copy: Copy;
  locale: Locale;
  studio: StudioData;
}) {
  const kpis = [
    [copy.kpis.activeCampaigns, String(analytics.activeCampaigns)],
    [copy.kpis.awaitingApproval, String(analytics.campaignsAwaitingApproval)],
    [copy.kpis.approvedAssets, String(analytics.approvedAssets)],
    [copy.kpis.draftAssets, String(analytics.draftAssets)],
    [copy.kpis.productsWithAssets, String(analytics.productsWithMarketingAssets)],
    [copy.kpis.estimatedBudget, money(locale, analytics.estimatedBudget)]
  ];
  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kpis.map(([label, value]) => (
          <article className={`${panelClass} p-5`} key={label}>
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
            <p className="mt-2 text-xs text-slate-500">{copy.labels.localEstimated}</p>
          </article>
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className={`${panelClass} p-5`}>
          <h2 className="text-lg font-bold">{copy.labels.recentCampaigns}</h2>
          <ul className="mt-4 space-y-2">
            {studio.campaigns.slice(0, 5).map((campaign) => (
              <li className="rounded-lg border border-slate-800 bg-slate-950/40 p-3" key={campaign.id}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{campaign.name}</span>
                  <span className="text-xs text-slate-400">{copy.statuses[campaign.status]}</span>
                </div>
                <p className="mt-1 text-sm text-slate-400">{campaign.campaignConcept || copy.labels.noConcept}</p>
              </li>
            ))}
            {studio.campaigns.length === 0 ? <li className="text-sm text-slate-500">{copy.empty.campaigns}</li> : null}
          </ul>
        </article>
        <article className={`${panelClass} p-5`}>
          <h2 className="text-lg font-bold">{copy.labels.aiRecommendations}</h2>
          <ul className="mt-4 list-disc space-y-2 pl-4 text-sm text-slate-300">
            <li>{copy.recommendations.brandKit}</li>
            <li>{copy.recommendations.assets}</li>
            <li>{copy.recommendations.providers}</li>
          </ul>
        </article>
      </section>
    </div>
  );
}

function BrandKitSection({
  activeBrandKit,
  copy,
  createBrandKit
}: {
  activeBrandKit: StudioData["brandKits"][number] | null;
  copy: Copy;
  createBrandKit: () => Promise<void>;
}) {
  return (
    <section className={`${panelClass} p-5`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-bold">{copy.sections["brand-kit"]}</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">{copy.help.brandKit}</p>
        </div>
        <PrimaryActionButton onClick={() => void createBrandKit()}>
          {activeBrandKit ? copy.actions.refreshBrandKit : copy.actions.createBrandKit}
        </PrimaryActionButton>
      </div>
      {activeBrandKit ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-sm text-slate-400">{copy.labels.name}</p>
            <p className="text-xl font-bold">{activeBrandKit.name}</p>
            <p className="mt-2 text-sm text-slate-300">{activeBrandKit.shortCompanyDescription}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-sm text-slate-400">{copy.labels.colors}</p>
            <div className="mt-3 flex gap-2">
              {[activeBrandKit.primaryColor, activeBrandKit.secondaryColor, activeBrandKit.accentColor].map((color) => (
                <span className="size-10 rounded border border-slate-700" key={color} style={{ background: color }} />
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 md:col-span-2">
            <p className="text-sm text-slate-400">{copy.labels.claims}</p>
            <p className="mt-2 text-sm text-slate-300">{activeBrandKit.approvedClaims.join(", ")}</p>
            <p className="mt-3 text-sm text-red-200">{activeBrandKit.prohibitedClaims.join(", ")}</p>
          </div>
        </div>
      ) : (
        <p className="mt-5 rounded-lg border border-dashed border-slate-700 p-5 text-sm text-slate-400">{copy.empty.brandKit}</p>
      )}
    </section>
  );
}

function AudiencesSection({ copy, createAudience, studio }: { copy: Copy; createAudience: (form: FormData) => Promise<void>; studio: StudioData }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <form action={(form) => void createAudience(form)} className={`${panelClass} p-5`}>
        <h2 className="text-lg font-bold">{copy.actions.createAudience}</h2>
        <div className="mt-4 space-y-3">
          <FormField label={copy.labels.name} required><input className={inputClassName} name="name" /></FormField>
          <FormField label={copy.labels.description}><textarea className={textareaClassName} name="description" /></FormField>
          <FormField label={copy.labels.industry}><input className={inputClassName} name="industry" defaultValue="Hospitality" /></FormField>
          <FormField label={copy.labels.organizationTypes}><input className={inputClassName} name="organizationTypes" defaultValue="restaurants, hotels" /></FormField>
          <FormField label={copy.labels.regions}><input className={inputClassName} name="regions" defaultValue="Portugal" /></FormField>
          <FormField label={copy.labels.languages}><input className={inputClassName} name="languages" defaultValue="pt-PT, en" /></FormField>
          <FormField label={copy.labels.interests}><input className={inputClassName} name="interests" defaultValue="custom cups, events" /></FormField>
          <FormField label={copy.labels.estimatedSize}><input className={inputClassName} name="estimatedSize" type="number" defaultValue={0} /></FormField>
          <PrimaryActionButton type="submit">{copy.actions.saveAudience}</PrimaryActionButton>
        </div>
      </form>
      <RecordList title={copy.sections.audiences} empty={copy.empty.audiences} rows={studio.audiences.map((audience) => ({
        id: audience.id,
        title: audience.name,
        meta: `${audience.industry} · ${audience.regions.join(", ")}`,
        status: audience.active ? copy.labels.active : copy.labels.archived
      }))} />
    </div>
  );
}

function CampaignsSection({
  approveCampaign,
  copy,
  createCampaign,
  exportCampaign,
  generateCopy,
  locale,
  products,
  studio
}: {
  approveCampaign: (campaignId: string) => Promise<void>;
  copy: Copy;
  createCampaign: (form: FormData) => Promise<void>;
  exportCampaign: (campaignId: string, format: "json" | "csv") => Promise<void>;
  generateCopy: (campaignId: string) => Promise<void>;
  locale: Locale;
  products: ReturnType<typeof useProducts>["products"];
  studio: StudioData;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <form action={(form) => void createCampaign(form)} className={`${panelClass} p-5`} id="create">
        <h2 className="text-lg font-bold">{copy.actions.createCampaign}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <FormField label={copy.labels.name} required><input className={inputClassName} name="name" defaultValue={copy.defaults.campaignName} /></FormField>
          <FormField label={copy.labels.objective}><select className={selectClassName} name="objective">{objectives.map((item) => <option key={item} value={item}>{copy.objectives[item]}</option>)}</select></FormField>
          <FormField label={copy.labels.product} required><select className={selectClassName} name="productId">{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></FormField>
          <FormField label={copy.labels.audience}><select className={selectClassName} name="audienceId"><option value="">{copy.labels.none}</option>{studio.audiences.map((audience) => <option key={audience.id} value={audience.id}>{audience.name}</option>)}</select></FormField>
          <FormField label={copy.labels.channel}><select className={selectClassName} name="channel">{channels.map((item) => <option key={item} value={item}>{copy.channels[item]}</option>)}</select></FormField>
          <FormField label={copy.labels.budget}><input className={inputClassName} name="budget" type="number" defaultValue={250} /></FormField>
          <FormField label={copy.labels.landingPage}><input className={inputClassName} name="landingPageUrl" type="url" placeholder="https://example.com/campaign" /></FormField>
          <FormField label={copy.labels.callToAction}><input className={inputClassName} name="callToAction" defaultValue={copy.defaults.cta} /></FormField>
          <FormField label={copy.labels.offer}><input className={inputClassName} name="offer" /></FormField>
          <FormField label={copy.labels.targetRegions}><input className={inputClassName} name="targetRegions" defaultValue="Portugal" /></FormField>
          <FormField label={copy.labels.startDate}><input className={inputClassName} name="startDate" type="date" /></FormField>
          <FormField label={copy.labels.endDate}><input className={inputClassName} name="endDate" type="date" /></FormField>
        </div>
        <PrimaryActionButton className="mt-4" type="submit">{copy.actions.saveCampaign}</PrimaryActionButton>
      </form>
      <div className="space-y-3">
        {studio.campaigns.length === 0 ? <div className={`${panelClass} p-5 text-sm text-slate-400`}>{copy.empty.campaigns}</div> : null}
        {studio.campaigns.map((campaign) => (
          <article className={`${panelClass} p-4`} key={campaign.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link className="text-lg font-bold hover:text-orange-200" href={`/${locale}/marketing/campaigns/${campaign.id}`}>{campaign.name}</Link>
                <p className="mt-1 text-sm text-slate-400">{campaign.campaignConcept || copy.labels.noConcept}</p>
              </div>
              <StatusBadge>{copy.statuses[campaign.status]}</StatusBadge>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="rounded border border-slate-700 px-3 py-1.5 text-sm" onClick={() => void generateCopy(campaign.id)} type="button">{copy.actions.generateCopy}</button>
              <button className="rounded border border-slate-700 px-3 py-1.5 text-sm" onClick={() => void approveCampaign(campaign.id)} type="button">{copy.actions.approve}</button>
              <button className="rounded border border-slate-700 px-3 py-1.5 text-sm" onClick={() => void exportCampaign(campaign.id, "json")} type="button">{copy.actions.exportJson}</button>
              <button className="rounded border border-slate-700 px-3 py-1.5 text-sm" onClick={() => void exportCampaign(campaign.id, "csv")} type="button">{copy.actions.exportCsv}</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function AssetsSection({
  approveAsset,
  copy,
  products,
  setPreferredProductAsset,
  studio,
  uploadMarketingAsset,
  uploadRef
}: {
  approveAsset: (assetId: string) => Promise<void>;
  copy: Copy;
  locale: Locale;
  products: ReturnType<typeof useProducts>["products"];
  setPreferredProductAsset: (assetId: string) => Promise<void>;
  studio: StudioData;
  uploadMarketingAsset: (file: File, productId: string, campaignId: string | null) => Promise<void>;
  uploadRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [campaignId, setCampaignId] = useState("");
  return (
    <div className="space-y-5">
      <section className={`${panelClass} p-5`}>
        <h2 className="text-lg font-bold">{copy.actions.uploadAsset}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <FormField label={copy.labels.product}><select className={selectClassName} onChange={(e) => setProductId(e.target.value)} value={productId}>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></FormField>
          <FormField label={copy.labels.campaign}><select className={selectClassName} onChange={(e) => setCampaignId(e.target.value)} value={campaignId}><option value="">{copy.labels.none}</option>{studio.campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></FormField>
          <div className="flex items-end">
            <input ref={uploadRef} className="hidden" accept="image/*" type="file" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadMarketingAsset(file, productId, campaignId || null); }} />
            <PrimaryActionButton onClick={() => uploadRef.current?.click()}>{copy.actions.chooseFile}</PrimaryActionButton>
          </div>
        </div>
      </section>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {studio.assets.map((asset) => (
          <article className={`${panelClass} p-4`} key={asset.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold">{asset.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{asset.assetType} · {asset.aspectRatio}</p>
              </div>
              <StatusBadge>{copy.approvals[asset.approvalStatus]}</StatusBadge>
            </div>
            <p className="mt-3 text-sm text-slate-400">{asset.description || asset.generationPrompt}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded border border-slate-700 px-3 py-1.5 text-sm" onClick={() => void approveAsset(asset.id)} type="button">{copy.actions.approve}</button>
              <button className="rounded border border-slate-700 px-3 py-1.5 text-sm" onClick={() => void setPreferredProductAsset(asset.id)} type="button">{copy.actions.setProductAsset}</button>
            </div>
          </article>
        ))}
        {studio.assets.length === 0 ? <p className="text-sm text-slate-500">{copy.empty.assets}</p> : null}
      </div>
    </div>
  );
}

function ImageStudioSection({ copy, generateMockImage, products, studio }: { copy: Copy; generateMockImage: (form: FormData) => Promise<void>; products: ReturnType<typeof useProducts>["products"]; studio: StudioData }) {
  return (
    <form action={(form) => void generateMockImage(form)} className={`${panelClass} p-5`}>
      <h2 className="text-lg font-bold">{copy.sections["image-studio"]}</h2>
      <p className="mt-2 text-sm text-slate-400">{copy.help.imageStudio}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <FormField label={copy.labels.product}><select className={selectClassName} name="productId">{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></FormField>
        <FormField label={copy.labels.campaign}><select className={selectClassName} name="campaignId"><option value="">{copy.labels.none}</option>{studio.campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></FormField>
        <FormField label={copy.labels.transformation}><select className={selectClassName} name="transformationType">{transformations.map((item) => <option key={item} value={item}>{copy.transformations[item]}</option>)}</select></FormField>
        <FormField label={copy.labels.aspectRatio}><select className={selectClassName} name="aspectRatio">{aspectRatios.map((item) => <option key={item} value={item}>{copy.aspectRatios[item]}</option>)}</select></FormField>
        <FormField label={copy.labels.imageBrief}><textarea className={textareaClassName} name="prompt" defaultValue={copy.defaults.imageBrief} /></FormField>
      </div>
      <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">{copy.help.noLiveImageProvider}</div>
      <PrimaryActionButton className="mt-4" type="submit">{copy.actions.generateImage}</PrimaryActionButton>
    </form>
  );
}

function AccountsSection({ copy, saveProviderPreview, studio }: { copy: Copy; saveProviderPreview: (provider: AdvertisingProviderId) => Promise<void>; studio: StudioData }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {(["google_ads", "meta_ads"] satisfies AdvertisingProviderId[]).map((provider) => {
        const account = studio.advertisingAccounts.find((row) => row.provider === provider);
        return (
          <article className={`${panelClass} p-5`} key={provider}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{copy.providers[provider]}</h2>
                <p className="mt-2 text-sm text-slate-400">{copy.help.providerDisabled}</p>
              </div>
              <StatusBadge>{account ? copy.connectionStatuses[account.connectionStatus] : copy.connectionStatuses.not_configured}</StatusBadge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded border border-slate-700 px-3 py-1.5 text-sm" onClick={() => void saveProviderPreview(provider)} type="button">{copy.actions.runDiagnostic}</button>
              <button className="rounded border border-slate-800 px-3 py-1.5 text-sm text-slate-500" disabled type="button">{copy.actions.livePublishDisabled}</button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function AnalyticsSection({ analytics, copy, locale }: { analytics: ReturnType<typeof calculateMarketingAnalytics>; copy: Copy; locale: Locale }) {
  return (
    <section className={`${panelClass} p-5`}>
      <h2 className="text-lg font-bold">{copy.sections.analytics}</h2>
      <p className="mt-2 text-sm text-slate-400">{copy.help.analytics}</p>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Metric label={copy.kpis.approvedCampaigns} value={String(analytics.approvedCampaigns)} />
        <Metric label={copy.kpis.assetsGenerated} value={String(analytics.assetsGenerated)} />
        <Metric label={copy.kpis.estimatedBudget} value={money(locale, analytics.estimatedBudget)} />
      </div>
    </section>
  );
}

function VideoStudioSection({ copy, createVideoProject, studio }: { copy: Copy; createVideoProject: (form: FormData) => Promise<void>; studio: StudioData }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <form action={(form) => void createVideoProject(form)} className={`${panelClass} p-5`}>
        <h2 className="text-lg font-bold">{copy.sections["video-studio"]}</h2>
        <p className="mt-2 text-sm text-slate-400">{copy.help.videoStudio}</p>
        <div className="mt-4 space-y-3">
          <FormField label={copy.labels.name}><input className={inputClassName} name="title" defaultValue={copy.defaults.videoProjectName} /></FormField>
          <FormField label={copy.labels.campaign}><select className={selectClassName} name="campaignId"><option value="">{copy.labels.none}</option>{studio.campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></FormField>
          <FormField label={copy.labels.duration}><select className={selectClassName} name="durationSeconds"><option value="6">6s</option><option value="15">15s</option><option value="30">30s</option></select></FormField>
          <FormField label={copy.labels.aspectRatio}><select className={selectClassName} name="aspectRatio"><option value="9:16">9:16</option><option value="1:1">1:1</option><option value="16:9">16:9</option></select></FormField>
          <PrimaryActionButton type="submit">{copy.actions.generateStoryboard}</PrimaryActionButton>
        </div>
      </form>
      <div className="space-y-3">
        {studio.videoProjects.map((project) => (
          <article className={`${panelClass} p-4`} key={project.id}>
            <h3 className="font-bold">{project.title}</h3>
            <p className="mt-1 text-sm text-slate-400">{project.durationSeconds}s · {project.aspectRatio} · {copy.statuses[project.status]}</p>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-300">
              {project.storyboard.map((step) => <li key={step}>{step}</li>)}
            </ol>
          </article>
        ))}
        {studio.videoProjects.length === 0 ? <p className="text-sm text-slate-500">{copy.empty.videoProjects}</p> : null}
      </div>
    </div>
  );
}

function CampaignDetail({
  approveCampaign,
  campaign,
  copy,
  exportCampaign,
  generateCopy,
  products,
  variants
}: {
  approveCampaign: (campaignId: string) => Promise<void>;
  campaign: ReturnType<typeof useMarketingCampaignById>["campaign"];
  copy: Copy;
  exportCampaign: (campaignId: string, format: "json" | "csv") => Promise<void>;
  generateCopy: (campaignId: string) => Promise<void>;
  locale: Locale;
  products: ReturnType<typeof useProducts>["products"];
  variants: ReturnType<typeof useMarketingCampaignById>["variants"];
}) {
  if (!campaign) return <div className={`${panelClass} p-5 text-sm text-slate-400`}>{copy.empty.campaigns}</div>;
  const selectedProducts = products.filter((product) => campaign.selectedProductIds.includes(product.id));
  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <article className={`${panelClass} p-5`}>
        <h2 className="text-lg font-bold">{campaign.name}</h2>
        <p className="mt-2 text-sm text-slate-400">{campaign.campaignConcept || copy.labels.noConcept}</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-slate-400">{copy.labels.objective}</dt><dd>{copy.objectives[campaign.objective]}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-400">{copy.labels.products}</dt><dd>{selectedProducts.map((p) => p.name).join(", ") || copy.labels.none}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-400">{copy.labels.approval}</dt><dd>{copy.approvals[campaign.approvalStatus]}</dd></div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="rounded border border-slate-700 px-3 py-1.5 text-sm" onClick={() => void generateCopy(campaign.id)} type="button">{copy.actions.generateCopy}</button>
          <button className="rounded border border-slate-700 px-3 py-1.5 text-sm" onClick={() => void approveCampaign(campaign.id)} type="button">{copy.actions.approve}</button>
          <button className="rounded border border-slate-700 px-3 py-1.5 text-sm" onClick={() => void exportCampaign(campaign.id, "json")} type="button">{copy.actions.exportJson}</button>
        </div>
      </article>
      <RecordList title={copy.labels.copyVariants} empty={copy.empty.variants} rows={variants.map((variant) => ({
        id: variant.id,
        title: variant.headline,
        meta: `${copy.channels[variant.channel]} · ${variant.body}`,
        status: copy.approvals[variant.approvalStatus]
      }))} />
    </div>
  );
}

function RecordList({ empty, rows, title }: { empty: string; rows: Array<{ id: string; meta: string; status: string; title: string }>; title: string }) {
  return (
    <section className={`${panelClass} p-5`}>
      <h2 className="text-lg font-bold">{title}</h2>
      <ul className="mt-4 space-y-2">
        {rows.map((row) => (
          <li className="rounded-lg border border-slate-800 bg-slate-950/40 p-3" key={row.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{row.title}</p>
                <p className="mt-1 text-sm text-slate-400">{row.meta}</p>
              </div>
              <StatusBadge>{row.status}</StatusBadge>
            </div>
          </li>
        ))}
        {rows.length === 0 ? <li className="text-sm text-slate-500">{empty}</li> : null}
      </ul>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-200">
      {children}
    </span>
  );
}
