import Dexie, { type Table } from "dexie";
import { LOCAL_DB_NAME, SCHEMA_VERSION } from "@/domain/constants";
import type {
  CustomerContact,
  InventoryItem,
  Machine,
  StockMovement
} from "@/domain/operations-types";
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
import type {
  CompanyProfile,
  LocalAsset,
  SenderIdentity,
  UserProfile
} from "@/domain/profile-types";
import type { CustomizerSimulation } from "@/domain/customizer-types";
import type { Product } from "@/domain/product-types";
import { DEFAULT_ARCHIVABLE } from "@/persistence/archive-utils";

export type MetaRecord = {
  key: string;
  value: string;
};

function archivableDefaults() {
  return { ...DEFAULT_ARCHIVABLE };
}

export class ForgeOSDatabase extends Dexie {
  meta!: Table<MetaRecord, string>;
  leads!: Table<Lead, string>;
  customers!: Table<Customer, string>;
  customerContacts!: Table<CustomerContact, string>;
  opportunities!: Table<Opportunity, string>;
  quotes!: Table<Quote, string>;
  productionOrders!: Table<ProductionOrder, string>;
  outreachMessages!: Table<OutreachMessage, string>;
  campaigns!: Table<Campaign, string>;
  activities!: Table<ActivityEvent, string>;
  companyProfiles!: Table<CompanyProfile, string>;
  userProfiles!: Table<UserProfile, string>;
  senderIdentities!: Table<SenderIdentity, string>;
  localAssets!: Table<LocalAsset, string>;
  products!: Table<Product, string>;
  machines!: Table<Machine, string>;
  inventoryItems!: Table<InventoryItem, string>;
  stockMovements!: Table<StockMovement, string>;
  customizerSimulations!: Table<CustomizerSimulation, string>;

  constructor(name: string = LOCAL_DB_NAME) {
    super(name);

    this.version(1).stores({
      meta: "key",
      leads: "id, tenantId, email, crmStatus, outreachStatus, [tenantId+email]",
      customers: "id, tenantId, leadId, [tenantId+leadId]",
      opportunities: "id, tenantId, leadId, customerId, [tenantId+leadId]",
      quotes: "id, tenantId, quoteNumber, leadId, customerId, status, [tenantId+leadId]",
      productionOrders: "id, tenantId, orderNumber, quoteId, status, [tenantId+quoteId]",
      outreachMessages: "id, tenantId, leadId, [tenantId+leadId]",
      campaigns: "id, tenantId",
      activities: "id, tenantId, occurredAt, action, [tenantId+occurredAt]"
    });

    this.version(2)
      .stores({
        meta: "key",
        leads: "id, tenantId, email, crmStatus, outreachStatus, [tenantId+email]",
        customers: "id, tenantId, leadId, [tenantId+leadId]",
        opportunities: "id, tenantId, leadId, customerId, [tenantId+leadId]",
        quotes: "id, tenantId, quoteNumber, leadId, customerId, status, [tenantId+leadId]",
        productionOrders: "id, tenantId, orderNumber, quoteId, status, [tenantId+quoteId]",
        outreachMessages: "id, tenantId, leadId, [tenantId+leadId]",
        campaigns: "id, tenantId",
        activities: "id, tenantId, occurredAt, action, [tenantId+occurredAt]",
        companyProfiles: "id, tenantId, [tenantId+id]",
        userProfiles: "id, tenantId, email, active, [tenantId+email]",
        senderIdentities:
          "id, tenantId, userProfileId, companyProfileId, isDefault, active, [tenantId+isDefault]",
        localAssets: "id, tenantId, assetType, [tenantId+assetType]",
        products: "id, tenantId, sku, category, active, [tenantId+sku]"
      })
      .upgrade(async (tx) => {
        await tx.table("meta").put({ key: "schemaVersion", value: "2" });
      });

    this.version(3)
      .stores({
        meta: "key",
        leads: "id, tenantId, email, crmStatus, outreachStatus, active, [tenantId+email]",
        customers: "id, tenantId, leadId, active, [tenantId+leadId]",
        customerContacts: "id, tenantId, customerId, active, [tenantId+customerId]",
        opportunities: "id, tenantId, leadId, customerId, [tenantId+leadId]",
        quotes: "id, tenantId, quoteNumber, leadId, customerId, status, active, [tenantId+leadId]",
        productionOrders:
          "id, tenantId, orderNumber, quoteId, status, machineId, active, [tenantId+quoteId]",
        outreachMessages: "id, tenantId, leadId, [tenantId+leadId]",
        campaigns: "id, tenantId",
        activities: "id, tenantId, occurredAt, action, [tenantId+occurredAt]",
        companyProfiles: "id, tenantId, [tenantId+id]",
        userProfiles: "id, tenantId, email, active, [tenantId+email]",
        senderIdentities:
          "id, tenantId, userProfileId, companyProfileId, isDefault, active, [tenantId+isDefault]",
        localAssets: "id, tenantId, assetType, [tenantId+assetType]",
        products: "id, tenantId, sku, category, active, [tenantId+sku]",
        machines: "id, tenantId, code, status, active, [tenantId+code]",
        inventoryItems: "id, tenantId, sku, active, [tenantId+sku]",
        stockMovements: "id, tenantId, inventoryItemId, [tenantId+inventoryItemId]"
      })
      .upgrade(async (tx) => {
        const defaults = archivableDefaults();
        const patchArchivable = async (tableName: string) => {
          const table = tx.table(tableName);
          await table.toCollection().modify((row: Record<string, unknown>) => {
            if (row.active === undefined) row.active = defaults.active;
            if (row.archivedAt === undefined) row.archivedAt = defaults.archivedAt;
            if (row.archivedBy === undefined) row.archivedBy = defaults.archivedBy;
            if (row.archiveReason === undefined) row.archiveReason = defaults.archiveReason;
          });
        };

        await patchArchivable("leads");
        await patchArchivable("customers");
        await patchArchivable("quotes");
        await patchArchivable("productionOrders");
        await patchArchivable("products");

        await tx.table("leads").toCollection().modify((row: Record<string, unknown>) => {
          if (row.facebookUrl === undefined) row.facebookUrl = null;
          if (row.contactSource === undefined) row.contactSource = row.sourceDatabase ?? "";
          if (row.phone === undefined) row.phone = "";
        });

        await tx.table("customers").toCollection().modify((row: Record<string, unknown>) => {
          if (row.legalName === undefined) row.legalName = row.companyName ?? "";
          if (row.tradingName === undefined) row.tradingName = row.companyName ?? "";
          if (row.vatNumber === undefined) row.vatNumber = "";
          if (row.addressLine1 === undefined) row.addressLine1 = "";
          if (row.addressLine2 === undefined) row.addressLine2 = "";
          if (row.postalCode === undefined) row.postalCode = "";
          if (row.city === undefined) row.city = "";
          if (row.country === undefined) row.country = "Portugal";
          if (row.website === undefined) row.website = null;
          if (row.customerStatus === undefined) row.customerStatus = "active";
        });

        await tx.table("quotes").toCollection().modify((row: Record<string, unknown>) => {
          if (row.discount === undefined) row.discount = 0;
          if (row.validityDate === undefined) row.validityDate = null;
          if (row.notes === undefined) row.notes = "";
        });

        await tx.table("productionOrders").toCollection().modify((row: Record<string, unknown>) => {
          if (row.completedQuantity === undefined) row.completedQuantity = 0;
          if (row.rejectedQuantity === undefined) row.rejectedQuantity = 0;
          if (row.plannedStart === undefined) row.plannedStart = null;
          if (row.plannedEnd === undefined) row.plannedEnd = null;
        });

        await tx.table("products").toCollection().modify((row: Record<string, unknown>) => {
          if (row.archivedBy === undefined) row.archivedBy = defaults.archivedBy;
          if (row.archiveReason === undefined) row.archiveReason = defaults.archiveReason;
        });

        await tx.table("meta").put({ key: "schemaVersion", value: "3" });
      });

    this.version(SCHEMA_VERSION)
      .stores({
        meta: "key",
        leads: "id, tenantId, email, crmStatus, outreachStatus, active, [tenantId+email]",
        customers: "id, tenantId, leadId, active, [tenantId+leadId]",
        customerContacts: "id, tenantId, customerId, active, [tenantId+customerId]",
        opportunities: "id, tenantId, leadId, customerId, [tenantId+leadId]",
        quotes:
          "id, tenantId, quoteNumber, leadId, customerId, status, active, simulationId, [tenantId+leadId]",
        productionOrders:
          "id, tenantId, orderNumber, quoteId, status, machineId, active, [tenantId+quoteId]",
        outreachMessages: "id, tenantId, leadId, [tenantId+leadId]",
        campaigns: "id, tenantId",
        activities: "id, tenantId, occurredAt, action, [tenantId+occurredAt]",
        companyProfiles: "id, tenantId, [tenantId+id]",
        userProfiles: "id, tenantId, email, active, [tenantId+email]",
        senderIdentities:
          "id, tenantId, userProfileId, companyProfileId, isDefault, active, [tenantId+isDefault]",
        localAssets: "id, tenantId, assetType, [tenantId+assetType]",
        products: "id, tenantId, sku, category, active, [tenantId+sku]",
        machines: "id, tenantId, code, status, active, [tenantId+code]",
        inventoryItems: "id, tenantId, sku, active, [tenantId+sku]",
        stockMovements: "id, tenantId, inventoryItemId, [tenantId+inventoryItemId]",
        customizerSimulations:
          "id, tenantId, customerId, leadId, productId, quoteId, status, active, [tenantId+status]"
      })
      .upgrade(async (tx) => {
        await tx.table("quotes").toCollection().modify((row: Record<string, unknown>) => {
          if (row.simulationId === undefined) row.simulationId = null;
          if (row.mockupAssetId === undefined) row.mockupAssetId = null;
          if (row.isEstimate === undefined) row.isEstimate = false;
        });
        await tx.table("meta").put({ key: "schemaVersion", value: String(SCHEMA_VERSION) });
      });
  }
}

let dbInstance: ForgeOSDatabase | null = null;

export function getDatabase(name?: string): ForgeOSDatabase {
  if (!dbInstance || (name && name !== dbInstance.name)) {
    dbInstance = new ForgeOSDatabase(name);
  }
  return dbInstance;
}

export function resetDatabaseInstance(): void {
  dbInstance = null;
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export async function deleteDatabase(name: string = LOCAL_DB_NAME): Promise<void> {
  await closeDatabase();
  await Dexie.delete(name);
}
