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
  | "backup_exported";

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
    backupAt
  ] = await Promise.all([
    repos.companyProfiles.getForTenant(tenantId),
    repos.senderIdentities.list(tenantId),
    repos.products.list(tenantId),
    repos.leads.list(tenantId),
    repos.quotes.list(tenantId),
    repos.customizerSimulations.list(tenantId),
    repos.outreachMessages.listAll(tenantId),
    repos.meta.get("lastBackupExportedAt")
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
