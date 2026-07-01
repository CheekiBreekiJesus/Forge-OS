import type { LocalRepositoryBundle } from "@/persistence/interfaces";
import type { LocalNotification } from "@/domain/customizer-types";

const READ_IDS_KEY = "notificationReadIds";
export async function getNotificationReadIds(
  repos: LocalRepositoryBundle
): Promise<Set<string>> {
  const raw = await repos.meta.get(READ_IDS_KEY);
  if (!raw) return new Set();
  try {
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export async function markNotificationRead(
  repos: LocalRepositoryBundle,
  id: string
): Promise<void> {
  const ids = await getNotificationReadIds(repos);
  ids.add(id);
  await repos.meta.set(READ_IDS_KEY, JSON.stringify([...ids]));
}

export async function markAllNotificationsRead(
  repos: LocalRepositoryBundle,
  notificationIds: string[]
): Promise<void> {
  const ids = await getNotificationReadIds(repos);
  for (const id of notificationIds) ids.add(id);
  await repos.meta.set(READ_IDS_KEY, JSON.stringify([...ids]));
}

export async function deriveLocalNotifications(
  repos: LocalRepositoryBundle,
  tenantId: string,
  locale: "pt-PT" | "en"
): Promise<LocalNotification[]> {
  const readIds = await getNotificationReadIds(repos);
  const now = new Date().toISOString();
  const items: LocalNotification[] = [];
  const pt = locale === "pt-PT";

  const [
    leads,
    quotes,
    inventory,
    machines,
    productionOrders,
    outreach,
    marketingCampaigns,
    marketingAssets,
    advertisingAccounts
  ] = await Promise.all([
    repos.leads.list(tenantId),
    repos.quotes.list(tenantId),
    repos.inventory.list(tenantId),
    repos.machines.list(tenantId),
    repos.productionOrders.list(tenantId),
    repos.outreachMessages.listAll(tenantId),
    repos.marketingCampaigns.list(tenantId),
    repos.marketingAssets.list(tenantId),
    repos.advertisingAccounts.list(tenantId)
  ]);

  for (const lead of leads) {
    if (lead.outreachStatus === "ready" && lead.consentStatus === "subscribed") {
      items.push({
        createdAt: lead.updatedAt,
        entityId: lead.id,
        entityType: "lead",
        href: `/${locale}/leadops/${lead.id}`,
        id: `outreach-ready-${lead.id}`,
        kind: "outreach_ready",
        message: pt
          ? `Email pronto para revisão: ${lead.companyName}`
          : `Email ready for review: ${lead.companyName}`,
        read: readIds.has(`outreach-ready-${lead.id}`),
        severity: "action",
        tenantId,
        title: pt ? "Outreach pronto" : "Outreach ready"
      });
    }
  }

  for (const quote of quotes) {
    if (quote.status === "draft" || quote.status === "sent") {
      items.push({
        createdAt: quote.updatedAt,
        entityId: quote.id,
        entityType: "quote",
        href: `/${locale}/quotations`,
        id: `quote-pending-${quote.id}`,
        kind: "quote_pending",
        message: pt
          ? `${quote.quoteNumber} aguarda aprovação`
          : `${quote.quoteNumber} awaiting approval`,
        read: readIds.has(`quote-pending-${quote.id}`),
        severity: "action",
        tenantId,
        title: pt ? "Orçamento pendente" : "Quotation pending"
      });
    }
    if (quote.validityDate && quote.validityDate < now.slice(0, 10) && quote.status !== "approved") {
      items.push({
        createdAt: quote.updatedAt,
        entityId: quote.id,
        entityType: "quote",
        href: `/${locale}/quotations`,
        id: `quote-expired-${quote.id}`,
        kind: "quote_expired",
        message: pt ? `${quote.quoteNumber} expirou` : `${quote.quoteNumber} expired`,
        read: readIds.has(`quote-expired-${quote.id}`),
        severity: "warning",
        tenantId,
        title: pt ? "Orçamento expirado" : "Quotation expired"
      });
    }
  }

  for (const item of inventory) {
    if (item.currentQuantity <= item.reorderLevel) {
      items.push({
        createdAt: item.updatedAt,
        entityId: item.id,
        entityType: "inventory",
        href: `/${locale}/inventory`,
        id: `stock-low-${item.id}`,
        kind: "low_stock",
        message: pt
          ? `${item.name}: ${item.currentQuantity} ${item.unit}`
          : `${item.name}: ${item.currentQuantity} ${item.unit}`,
        read: readIds.has(`stock-low-${item.id}`),
        severity: "warning",
        tenantId,
        title: pt ? "Stock baixo" : "Low stock"
      });
    }
  }

  for (const order of productionOrders) {
    if (order.status === "blocked") {
      items.push({
        createdAt: order.updatedAt,
        entityId: order.id,
        entityType: "production_order",
        href: `/${locale}/jobs/${order.id}`,
        id: `po-delayed-${order.id}`,
        kind: "production_delayed",
        message: pt ? `${order.orderNumber} bloqueada` : `${order.orderNumber} blocked`,
        read: readIds.has(`po-delayed-${order.id}`),
        severity: "warning",
        tenantId,
        title: pt ? "Produção atrasada" : "Production delayed"
      });
    }
  }

  for (const machine of machines) {
    if (machine.status === "maintenance" || machine.status === "offline") {
      items.push({
        createdAt: machine.updatedAt,
        entityId: machine.id,
        entityType: "machine",
        href: `/${locale}/machines`,
        id: `machine-unavailable-${machine.id}`,
        kind: "machine_unavailable",
        message: pt ? `${machine.name} indisponível` : `${machine.name} unavailable`,
        read: readIds.has(`machine-unavailable-${machine.id}`),
        severity: "info",
        tenantId,
        title: pt ? "Máquina indisponível" : "Machine unavailable"
      });
    }
  }

  const backupExported = await repos.meta.get("lastBackupExportedAt");
  if (!backupExported) {
    items.push({
      createdAt: now,
      entityId: "backup",
      entityType: "settings",
      href: `/${locale}/settings`,
      id: "backup-not-exported",
      kind: "backup_reminder",
      message: pt
        ? "Exporte um backup local nas Definições"
        : "Export a local backup in Settings",
      read: readIds.has("backup-not-exported"),
      severity: "info",
      tenantId,
      title: pt ? "Backup recomendado" : "Backup recommended"
    });
  }

  for (const campaign of marketingCampaigns) {
    if (campaign.approvalStatus === "pending_review") {
      items.push({
        createdAt: campaign.updatedAt,
        entityId: campaign.id,
        entityType: "marketing_campaign",
        href: `/${locale}/marketing/campaigns/${campaign.id}`,
        id: `marketing-review-${campaign.id}`,
        kind: "campaign_awaiting_review",
        message: pt ? `${campaign.name} aguarda aprovaÃ§Ã£o` : `${campaign.name} awaiting approval`,
        read: readIds.has(`marketing-review-${campaign.id}`),
        severity: "action",
        tenantId,
        title: pt ? "Campanha para rever" : "Campaign awaiting review"
      });
    }
    if (!campaign.landingPageUrl.trim()) {
      items.push({
        createdAt: campaign.updatedAt,
        entityId: campaign.id,
        entityType: "marketing_campaign",
        href: `/${locale}/marketing/campaigns/${campaign.id}`,
        id: `marketing-missing-landing-${campaign.id}`,
        kind: "campaign_missing_landing_page",
        message: pt ? `${campaign.name} nÃ£o tem landing page` : `${campaign.name} has no landing page`,
        read: readIds.has(`marketing-missing-landing-${campaign.id}`),
        severity: "warning",
        tenantId,
        title: pt ? "Landing page em falta" : "Landing page missing"
      });
    }
    const hasApprovedAsset = marketingAssets.some(
      (asset) => asset.campaignId === campaign.id && asset.approvalStatus === "approved"
    );
    if (!hasApprovedAsset) {
      items.push({
        createdAt: campaign.updatedAt,
        entityId: campaign.id,
        entityType: "marketing_campaign",
        href: `/${locale}/marketing/image-studio`,
        id: `marketing-missing-image-${campaign.id}`,
        kind: "campaign_missing_image",
        message: pt ? `${campaign.name} precisa de imagem aprovada` : `${campaign.name} needs an approved image`,
        read: readIds.has(`marketing-missing-image-${campaign.id}`),
        severity: "warning",
        tenantId,
        title: pt ? "Imagem de campanha em falta" : "Campaign image missing"
      });
    }
    if (campaign.status === "approved") {
      items.push({
        createdAt: campaign.updatedAt,
        entityId: campaign.id,
        entityType: "marketing_campaign",
        href: `/${locale}/marketing/campaigns/${campaign.id}`,
        id: `marketing-ready-export-${campaign.id}`,
        kind: "campaign_ready_for_export",
        message: pt ? `${campaign.name} pode ser exportada` : `${campaign.name} is ready to export`,
        read: readIds.has(`marketing-ready-export-${campaign.id}`),
        severity: "action",
        tenantId,
        title: pt ? "Campanha pronta para exportar" : "Campaign ready to export"
      });
    }
  }

  for (const asset of marketingAssets) {
    if (asset.approvalStatus === "pending_review") {
      items.push({
        createdAt: asset.updatedAt,
        entityId: asset.id,
        entityType: "marketing_asset",
        href: `/${locale}/marketing/assets`,
        id: `marketing-asset-review-${asset.id}`,
        kind: "asset_awaiting_approval",
        message: pt ? `${asset.title} aguarda aprovaÃ§Ã£o` : `${asset.title} awaiting approval`,
        read: readIds.has(`marketing-asset-review-${asset.id}`),
        severity: "action",
        tenantId,
        title: pt ? "Recurso para aprovar" : "Asset awaiting approval"
      });
    }
  }

  if (!advertisingAccounts.some((account) => account.connectionStatus === "connected")) {
    items.push({
      createdAt: now,
      entityId: "advertising-providers",
      entityType: "advertising_account",
      href: `/${locale}/marketing/accounts`,
      id: "advertising-provider-not-configured",
      kind: "advertising_provider_not_configured",
      message: pt
        ? "Google Ads e Meta Ads estÃ£o em modo de prÃ©-visualizaÃ§Ã£o local"
        : "Google Ads and Meta Ads are in local preview mode",
      read: readIds.has("advertising-provider-not-configured"),
      severity: "info",
      tenantId,
      title: pt ? "Publicidade nÃ£o ligada" : "Advertising not connected"
    });
  }

  void outreach;

  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
