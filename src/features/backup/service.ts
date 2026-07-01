import type {
  CompanyProfile,
  LocalAsset,
  SenderIdentity,
  UserProfile
} from "@/domain/profile-types";
import type { Product } from "@/domain/product-types";
import type {
  ActivityEvent,
  Campaign,
  Customer,
  Lead,
  Opportunity,
  OutreachMessage,
  ProductionOrder,
  Quote
} from "@/domain/types";
import type { ImportBatch, ImportRow, LeadContact } from "@/domain/import-types";
import type { LocalRepositoryBundle } from "@/persistence/interfaces";

export const BACKUP_VERSION = 3 as const;

export type ForgeOSBackup = {
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  tenantId: string;
  tables: {
    leads: Lead[];
    customers: Customer[];
    opportunities: Opportunity[];
    quotes: Quote[];
    productionOrders: ProductionOrder[];
    outreachMessages: OutreachMessage[];
    campaigns: Campaign[];
    activities: ActivityEvent[];
    companyProfiles: CompanyProfile[];
    userProfiles: UserProfile[];
    senderIdentities: SenderIdentity[];
    products: Product[];
    importBatches: ImportBatch[];
    importRows: ImportRow[];
    leadContacts: LeadContact[];
  };
  localAssets?: Array<Omit<LocalAsset, "blob"> & { blobBase64: string }>;
};

export async function exportBackup(
  repos: LocalRepositoryBundle,
  tenantId: string,
  includeAssets = true
): Promise<ForgeOSBackup> {
  const [
    leads,
    customers,
    opportunities,
    quotes,
    productionOrders,
    outreachMessages,
    campaigns,
    activities,
    companyProfile,
    userProfiles,
    senderIdentities,
    products,
    importBatches,
    importRows,
    leadContacts,
    assets
  ] = await Promise.all([
    repos.leads.list(tenantId),
    repos.customers.list(tenantId),
    repos.opportunities.list(tenantId),
    repos.quotes.list(tenantId),
    repos.productionOrders.list(tenantId),
    repos.outreachMessages.listAll?.(tenantId) ?? Promise.resolve([]),
    repos.campaigns.list(tenantId),
    repos.activities.list(tenantId),
    repos.companyProfiles.getForTenant(tenantId),
    repos.userProfiles.list(tenantId),
    repos.senderIdentities.listAll(tenantId),
    repos.products.list(tenantId),
    repos.importBatches.list(tenantId),
    Promise.resolve([] as ImportRow[]).then(async () => {
      const batches = await repos.importBatches.list(tenantId);
      const rows = await Promise.all(
        batches.map((batch) => repos.importRows.listForBatch(tenantId, batch.id))
      );
      return rows.flat();
    }),
    repos.leadContacts.list(tenantId),
    includeAssets ? repos.localAssets.list(tenantId) : Promise.resolve([])
  ]);

  const backup: ForgeOSBackup = {
    exportedAt: new Date().toISOString(),
    tables: {
      activities,
      campaigns,
      companyProfiles: companyProfile ? [companyProfile] : [],
      customers,
      leads,
      opportunities,
      outreachMessages,
      productionOrders,
      products,
      quotes,
      senderIdentities,
      userProfiles,
      importBatches,
      importRows,
      leadContacts
    },
    tenantId,
    version: BACKUP_VERSION
  };

  if (includeAssets && assets.length > 0) {
    backup.localAssets = await Promise.all(
      assets.map(async (asset) => {
        const buffer = await asset.blob.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const { blob: _removed, ...rest } = asset;
        void _removed;
        return { ...rest, blobBase64: btoa(binary) };
      })
    );
  }

  return backup;
}

export function validateBackup(data: unknown): data is ForgeOSBackup {
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  if (record.version !== BACKUP_VERSION) return false;
  if (typeof record.tenantId !== "string") return false;
  if (!record.tables || typeof record.tables !== "object") return false;
  const tables = record.tables as Record<string, unknown>;
  const required = [
    "leads",
    "customers",
    "companyProfiles",
    "userProfiles",
    "senderIdentities",
    "products"
  ];
  return required.every((key) => Array.isArray(tables[key]));
}

export async function importBackup(
  repos: LocalRepositoryBundle,
  backup: ForgeOSBackup
): Promise<void> {
  if (!validateBackup(backup)) {
    throw new Error("Invalid backup format.");
  }
  await repos.reset();
  if (repos.importBackupData) {
    await repos.importBackupData(backup);
  }
}
