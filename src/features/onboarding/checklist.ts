import type { LocalRepositoryBundle } from "@/persistence/interfaces";

export type OnboardingItemId =
  | "company_profile"
  | "company_logo"
  | "sender_identity"
  | "abacus_configured"
  | "product_urls"
  | "product_image"
  | "leads_imported"
  | "first_email"
  | "first_quotation"
  | "customizer_tested"
  | "backup_exported"
  | "brand_kit_configured"
  | "marketing_logo_added"
  | "first_marketing_asset_uploaded"
  | "first_marketing_audience_created"
  | "first_marketing_campaign_created"
  | "campaign_copy_generated"
  | "campaign_image_approved"
  | "campaign_package_exported"
  | "advertising_account_configured";

export type OnboardingItem = {
  id: OnboardingItemId;
  completed: boolean;
  href: string;
};

const DISMISS_KEY = "onboardingDismissed";

export async function isOnboardingDismissed(repos: LocalRepositoryBundle): Promise<boolean> {
  return (await repos.meta.get(DISMISS_KEY)) === "true";
}

export async function dismissOnboarding(repos: LocalRepositoryBundle): Promise<void> {
  await repos.meta.set(DISMISS_KEY, "true");
}

export async function deriveOnboardingItems(
  repos: LocalRepositoryBundle,
  tenantId: string,
  locale: "pt-PT" | "en"
): Promise<OnboardingItem[]> {
  const prefix = `/${locale}`;
  const [
    company,
    senders,
    products,
    leads,
    quotes,
    simulations,
    outreach,
    backupAt,
    brandKits,
    marketingAssets,
    marketingCampaigns,
    marketingAudiences,
    advertisingAccounts
  ] = await Promise.all([
    repos.companyProfiles.getForTenant(tenantId),
    repos.senderIdentities.list(tenantId),
    repos.products.list(tenantId),
    repos.leads.list(tenantId),
    repos.quotes.list(tenantId),
    repos.customizerSimulations.list(tenantId),
    repos.outreachMessages.listAll(tenantId),
    repos.meta.get("lastBackupExportedAt"),
    repos.brandKits.list(tenantId),
    repos.marketingAssets.list(tenantId),
    repos.marketingCampaigns.list(tenantId),
    repos.marketingAudiences.list(tenantId),
    repos.advertisingAccounts.list(tenantId)
  ]);

  const hasLogo = Boolean(company?.logoLocalAssetId || company?.logoPublicUrl);
  const hasProductUrl = products.some((p) => Boolean(p.productPageUrl?.trim()));
  const hasProductImage = products.some(
    (p) => Boolean(p.imageUrl?.trim()) || Boolean(p.thumbnailUrl?.trim())
  );
  const hasGeneratedEmail = outreach.some((m) => m.message?.approved || m.message?.subject);

  return [
    {
      completed: Boolean(company?.legalName && company.tradingName),
      href: `${prefix}/settings`,
      id: "company_profile"
    },
    {
      completed: hasLogo,
      href: `${prefix}/settings`,
      id: "company_logo"
    },
    {
      completed: senders.some((s) => s.isDefault && s.active),
      href: `${prefix}/settings`,
      id: "sender_identity"
    },
    {
      completed: true,
      href: `${prefix}/settings`,
      id: "abacus_configured"
    },
    {
      completed: hasProductUrl,
      href: `${prefix}/products`,
      id: "product_urls"
    },
    {
      completed: hasProductImage,
      href: `${prefix}/products`,
      id: "product_image"
    },
    {
      completed: leads.length > 0,
      href: `${prefix}/leadops`,
      id: "leads_imported"
    },
    {
      completed: hasGeneratedEmail,
      href: `${prefix}/leadops`,
      id: "first_email"
    },
    {
      completed: quotes.length > 0,
      href: `${prefix}/quotations`,
      id: "first_quotation"
    },
    {
      completed: simulations.length > 0,
      href: `${prefix}/quotations/customizer`,
      id: "customizer_tested"
    },
    {
      completed: Boolean(backupAt),
      href: `${prefix}/settings`,
      id: "backup_exported"
    },
    {
      completed: brandKits.some((kit) => kit.active),
      href: `${prefix}/marketing/brand-kit`,
      id: "brand_kit_configured"
    },
    {
      completed: brandKits.some((kit) => kit.primaryLogoAssetId || kit.secondaryLogoAssetId || kit.iconAssetId),
      href: `${prefix}/marketing/brand-kit`,
      id: "marketing_logo_added"
    },
    {
      completed: marketingAssets.length > 0,
      href: `${prefix}/marketing/assets`,
      id: "first_marketing_asset_uploaded"
    },
    {
      completed: marketingAudiences.length > 0,
      href: `${prefix}/marketing/audiences`,
      id: "first_marketing_audience_created"
    },
    {
      completed: marketingCampaigns.length > 0,
      href: `${prefix}/marketing/campaigns`,
      id: "first_marketing_campaign_created"
    },
    {
      completed: marketingCampaigns.some((campaign) => campaign.campaignConcept.trim()),
      href: `${prefix}/marketing/campaigns`,
      id: "campaign_copy_generated"
    },
    {
      completed: marketingAssets.some((asset) => asset.approvalStatus === "approved"),
      href: `${prefix}/marketing/assets`,
      id: "campaign_image_approved"
    },
    {
      completed: marketingCampaigns.some((campaign) => campaign.status === "export_ready"),
      href: `${prefix}/marketing/campaigns`,
      id: "campaign_package_exported"
    },
    {
      completed: advertisingAccounts.some((account) => account.connectionStatus === "connected"),
      href: `${prefix}/marketing/accounts`,
      id: "advertising_account_configured"
    }
  ];
}

export function onboardingProgress(items: OnboardingItem[]): {
  completed: number;
  total: number;
  percent: number;
} {
  const completed = items.filter((i) => i.completed).length;
  const total = items.length;
  return { completed, percent: total ? Math.round((completed / total) * 100) : 0, total };
}
