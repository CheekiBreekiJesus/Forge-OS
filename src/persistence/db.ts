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
import type { CampaignRecipient, OutreachCampaign } from "@/domain/campaign-types";
import type { OutreachProviderEvent, OutreachSendAttempt } from "@/domain/email-delivery-types";
import type { OutreachTestProfile } from "@/domain/outreach-test-profile-types";
import type {
  OutreachSendJob,
  OutreachSendJobAttempt,
  OutreachSendJobDailyUsage,
  OutreachSendJobRecipient
} from "@/domain/send-job-types";
import type { EmailSuppression } from "@/domain/suppression-types";
import type { ImportBatch, ImportRow, LeadContact, ImportMappingProfile } from "@/domain/import-types";
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
  campaigns!: Table<OutreachCampaign, string>;
  campaignRecipients!: Table<CampaignRecipient, string>;
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
  importBatches!: Table<ImportBatch, string>;
  importRows!: Table<ImportRow, string>;
  importMappingProfiles!: Table<ImportMappingProfile, string>;
  leadContacts!: Table<LeadContact, string>;
  emailSuppressions!: Table<EmailSuppression, string>;
  outreachSendAttempts!: Table<OutreachSendAttempt, string>;
  outreachProviderEvents!: Table<OutreachProviderEvent, string>;
  outreachSendJobs!: Table<OutreachSendJob, string>;
  outreachSendJobRecipients!: Table<OutreachSendJobRecipient, string>;
  outreachSendJobAttempts!: Table<OutreachSendJobAttempt, string>;
  outreachSendJobDailyUsage!: Table<OutreachSendJobDailyUsage, string>;
  outreachTestProfiles!: Table<OutreachTestProfile, string>;

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

    this.version(4)
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
        await tx.table("meta").put({ key: "schemaVersion", value: "4" });
      });

    this.version(5)
      .stores({
        meta: "key",
        leads:
          "id, tenantId, email, crmStatus, outreachStatus, active, normalizedCompanyName, websiteDomain, sourceImportId, [tenantId+email], [tenantId+normalizedCompanyName]",
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
          "id, tenantId, customerId, leadId, productId, quoteId, status, active, [tenantId+status]",
        importBatches: "id, tenantId, fileFingerprint, status, createdAt, [tenantId+fileFingerprint]",
        importRows: "id, tenantId, importBatchId, rowIndex, status, [tenantId+importBatchId]",
        leadContacts:
          "id, tenantId, leadId, normalizedEmail, active, isPrimary, [tenantId+leadId], [tenantId+normalizedEmail]"
      })
      .upgrade(async (tx) => {
        await tx.table("leads").toCollection().modify((row: Record<string, unknown>) => {
          const companyName = String(row.companyName ?? "");
          if (row.normalizedCompanyName === undefined) {
            row.normalizedCompanyName = companyName
              .normalize("NFD")
              .replace(/\p{M}/gu, "")
              .replace(/[^\p{L}\p{N}\s]/gu, " ")
              .replace(/\s+/g, " ")
              .trim()
              .toLowerCase();
          }
          if (row.normalizedPhone === undefined) {
            row.normalizedPhone = String(row.phone ?? "").replace(/[^\d+]/g, "");
          }
          if (row.websiteDomain === undefined) {
            row.websiteDomain = null;
          }
          if (row.country === undefined) row.country = "Portugal";
          if (row.sourceImportId === undefined) row.sourceImportId = null;
        });
        await tx.table("meta").put({ key: "schemaVersion", value: "5" });
      });

    this.version(6)
      .stores({
        meta: "key",
        leads:
          "id, tenantId, email, crmStatus, outreachStatus, active, normalizedCompanyName, websiteDomain, sourceImportId, [tenantId+email], [tenantId+normalizedCompanyName]",
        customers: "id, tenantId, leadId, active, [tenantId+leadId]",
        customerContacts: "id, tenantId, customerId, active, [tenantId+customerId]",
        opportunities: "id, tenantId, leadId, customerId, [tenantId+leadId]",
        quotes:
          "id, tenantId, quoteNumber, leadId, customerId, status, active, simulationId, [tenantId+leadId]",
        productionOrders:
          "id, tenantId, orderNumber, quoteId, status, machineId, active, [tenantId+quoteId]",
        outreachMessages: "id, tenantId, leadId, [tenantId+leadId]",
        campaigns: "id, tenantId, status, createdAt, [tenantId+status]",
        campaignRecipients:
          "id, tenantId, campaignId, leadId, status, [tenantId+campaignId], [tenantId+leadId]",
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
          "id, tenantId, customerId, leadId, productId, quoteId, status, active, [tenantId+status]",
        importBatches: "id, tenantId, fileFingerprint, status, createdAt, [tenantId+fileFingerprint]",
        importRows: "id, tenantId, importBatchId, rowIndex, status, [tenantId+importBatchId]",
        leadContacts:
          "id, tenantId, leadId, normalizedEmail, active, isPrimary, [tenantId+leadId], [tenantId+normalizedEmail]"
      })
      .upgrade(async (tx) => {
        const timestamp = new Date().toISOString();
        await tx.table("campaigns").toCollection().modify((row: Record<string, unknown>) => {
          if (row.description === undefined) row.description = "";
          if (row.language === undefined) row.language = "pt-PT";
          if (row.segmentDefinition === undefined) row.segmentDefinition = null;
          if (row.recipientSnapshotCreatedAt === undefined) row.recipientSnapshotCreatedAt = null;
          if (row.recipientSnapshotCount === undefined) {
            row.recipientSnapshotCount = Number(row.totalCount ?? 0);
          }
          if (row.fromName === undefined) row.fromName = "";
          if (row.senderProfileId === undefined) row.senderProfileId = null;
          if (row.replyTo === undefined) row.replyTo = "";
          if (row.deliveryMode === undefined) row.deliveryMode = "simulation";
          if (row.createdBy === undefined) row.createdBy = "seed";
          if (row.createdAt === undefined) row.createdAt = timestamp;
          if (row.updatedAt === undefined) row.updatedAt = timestamp;
        });
        await tx.table("meta").put({ key: "schemaVersion", value: "6" });
      });

    this.version(7)
      .stores({
        meta: "key",
        leads:
          "id, tenantId, email, crmStatus, outreachStatus, active, normalizedCompanyName, websiteDomain, sourceImportId, [tenantId+email], [tenantId+normalizedCompanyName]",
        customers: "id, tenantId, leadId, active, [tenantId+leadId]",
        customerContacts: "id, tenantId, customerId, active, [tenantId+customerId]",
        opportunities: "id, tenantId, leadId, customerId, [tenantId+leadId]",
        quotes:
          "id, tenantId, quoteNumber, leadId, customerId, status, active, simulationId, [tenantId+leadId]",
        productionOrders:
          "id, tenantId, orderNumber, quoteId, status, machineId, active, [tenantId+quoteId]",
        outreachMessages: "id, tenantId, leadId, [tenantId+leadId]",
        campaigns: "id, tenantId, status, createdAt, [tenantId+status]",
        campaignRecipients:
          "id, tenantId, campaignId, leadId, status, draftStatus, [tenantId+campaignId], [tenantId+leadId], [tenantId+draftStatus]",
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
          "id, tenantId, customerId, leadId, productId, quoteId, status, active, [tenantId+status]",
        importBatches: "id, tenantId, fileFingerprint, status, createdAt, [tenantId+fileFingerprint]",
        importRows: "id, tenantId, importBatchId, rowIndex, status, [tenantId+importBatchId]",
        leadContacts:
          "id, tenantId, leadId, normalizedEmail, active, isPrimary, [tenantId+leadId], [tenantId+normalizedEmail]"
      })
      .upgrade(async (tx) => {
        const timestamp = new Date().toISOString();
        await tx.table("campaigns").toCollection().modify((row: Record<string, unknown>) => {
          if (row.subjectTemplate === undefined) row.subjectTemplate = "";
          if (row.plainTextTemplate === undefined) row.plainTextTemplate = "";
          if (row.htmlTemplate === undefined) row.htmlTemplate = "";
          if (row.templateVersion === undefined) row.templateVersion = 0;
          if (row.templateUpdatedAt === undefined) row.templateUpdatedAt = null;
        });
        await tx.table("campaignRecipients").toCollection().modify((row: Record<string, unknown>) => {
          if (row.snapshotWebsite === undefined) row.snapshotWebsite = "";
          if (row.personalizedSubject === undefined) row.personalizedSubject = "";
          if (row.personalizedPlainText === undefined) row.personalizedPlainText = "";
          if (row.personalizedHtml === undefined) row.personalizedHtml = "";
          if (row.draftStatus === undefined) row.draftStatus = "PENDING";
          if (row.generatedAt === undefined) row.generatedAt = null;
          if (row.generationMethod === undefined) row.generationMethod = null;
          if (row.templateVersion === undefined) row.templateVersion = null;
          if (row.userEdited === undefined) row.userEdited = false;
          if (row.draftUpdatedAt === undefined) row.draftUpdatedAt = null;
        });
        await tx.table("meta").put({ key: "schemaVersion", value: "7" });
      });

    this.version(8)
      .stores({
        meta: "key",
        leads:
          "id, tenantId, email, crmStatus, outreachStatus, active, normalizedCompanyName, websiteDomain, sourceImportId, [tenantId+email], [tenantId+normalizedCompanyName]",
        customers: "id, tenantId, leadId, active, [tenantId+leadId]",
        customerContacts: "id, tenantId, customerId, active, [tenantId+customerId]",
        opportunities: "id, tenantId, leadId, customerId, [tenantId+leadId]",
        quotes:
          "id, tenantId, quoteNumber, leadId, customerId, status, active, simulationId, [tenantId+leadId]",
        productionOrders:
          "id, tenantId, orderNumber, quoteId, status, machineId, active, [tenantId+quoteId]",
        outreachMessages: "id, tenantId, leadId, [tenantId+leadId]",
        campaigns: "id, tenantId, status, createdAt, [tenantId+status]",
        campaignRecipients:
          "id, tenantId, campaignId, leadId, status, draftStatus, [tenantId+campaignId], [tenantId+leadId], [tenantId+draftStatus]",
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
          "id, tenantId, customerId, leadId, productId, quoteId, status, active, [tenantId+status]",
        importBatches: "id, tenantId, fileFingerprint, status, createdAt, [tenantId+fileFingerprint]",
        importRows: "id, tenantId, importBatchId, rowIndex, status, [tenantId+importBatchId]",
        leadContacts:
          "id, tenantId, leadId, normalizedEmail, active, isPrimary, [tenantId+leadId], [tenantId+normalizedEmail]"
      })
      .upgrade(async (tx) => {
        await tx.table("campaigns").toCollection().modify((row: Record<string, unknown>) => {
          if (row.status === "active") row.status = "in_progress";
        });
        await tx.table("campaignRecipients").toCollection().modify((row: Record<string, unknown>) => {
          if (row.approvedAt === undefined) row.approvedAt = null;
          if (row.approvedBy === undefined) row.approvedBy = null;
          if (row.approvalContentHash === undefined) row.approvalContentHash = null;
          if (row.approvalInvalidatedAt === undefined) row.approvalInvalidatedAt = null;
          if (row.approvalInvalidationReason === undefined) row.approvalInvalidationReason = null;
          if (row.openedExternallyAt === undefined) row.openedExternallyAt = null;
          if (row.externalClient === undefined) row.externalClient = null;
          if (row.sentAt === undefined) row.sentAt = null;
          if (row.sentBy === undefined) row.sentBy = null;
          if (row.recipientDeliveryMode === undefined) row.recipientDeliveryMode = null;
          if (row.operatorNote === undefined) row.operatorNote = "";
          if (row.simulatedAt === undefined) row.simulatedAt = null;
          if (row.sendIdempotencyKey === undefined) row.sendIdempotencyKey = null;
        });
        await tx.table("meta").put({ key: "schemaVersion", value: "8" });
      });

    this.version(11)
      .stores({
        meta: "key",
        leads:
          "id, tenantId, email, crmStatus, outreachStatus, active, normalizedCompanyName, websiteDomain, sourceImportId, [tenantId+email], [tenantId+normalizedCompanyName]",
        customers: "id, tenantId, leadId, active, [tenantId+leadId]",
        customerContacts: "id, tenantId, customerId, active, [tenantId+customerId]",
        opportunities: "id, tenantId, leadId, customerId, [tenantId+leadId]",
        quotes:
          "id, tenantId, quoteNumber, leadId, customerId, status, active, simulationId, [tenantId+leadId]",
        productionOrders:
          "id, tenantId, orderNumber, quoteId, status, machineId, active, [tenantId+quoteId]",
        outreachMessages: "id, tenantId, leadId, [tenantId+leadId]",
        campaigns: "id, tenantId, status, createdAt, [tenantId+status]",
        campaignRecipients:
          "id, tenantId, campaignId, leadId, status, draftStatus, [tenantId+campaignId], [tenantId+leadId], [tenantId+draftStatus]",
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
          "id, tenantId, customerId, leadId, productId, quoteId, status, active, [tenantId+status]",
        importBatches: "id, tenantId, fileFingerprint, status, createdAt, [tenantId+fileFingerprint]",
        importRows: "id, tenantId, importBatchId, rowIndex, status, [tenantId+importBatchId]",
        leadContacts:
          "id, tenantId, leadId, normalizedEmail, active, isPrimary, [tenantId+leadId], [tenantId+normalizedEmail]",
        emailSuppressions:
          "id, tenantId, normalizedEmail, reason, source, active, campaignId, leadId, [tenantId+normalizedEmail], [tenantId+reason], [tenantId+source]",
        outreachSendAttempts:
          "id, tenantId, provider, deliveryMode, campaignId, campaignRecipientId, leadId, idempotencyKey, status, startedAt, providerMessageId, [tenantId+campaignId], [tenantId+campaignRecipientId], [tenantId+idempotencyKey], [tenantId+status]",
        outreachProviderEvents:
          "id, tenantId, provider, eventFingerprint, providerMessageId, eventType, receivedAt, campaignRecipientId, sendAttemptId, processingStatus, [tenantId+eventFingerprint], [tenantId+eventType], [tenantId+processingStatus], [tenantId+campaignRecipientId]",
        outreachSendJobs:
          "id, tenantId, campaignId, provider, deliveryMode, status, lockExpiresAt, [tenantId+campaignId], [tenantId+status]",
        outreachSendJobRecipients:
          "id, tenantId, sendJobId, campaignId, campaignRecipientId, leadId, normalizedEmail, status, idempotencyKey, nextAttemptAt, [tenantId+sendJobId], [tenantId+campaignRecipientId], [tenantId+idempotencyKey], [tenantId+status]",
        outreachSendJobAttempts:
          "id, tenantId, sendJobId, sendJobRecipientId, campaignId, campaignRecipientId, idempotencyKey, status, providerMessageId, [tenantId+sendJobId], [tenantId+idempotencyKey], [tenantId+campaignRecipientId]",
        outreachSendJobDailyUsage:
          "id, tenantId, provider, usageDate, [tenantId+provider+usageDate]"
      })
      .upgrade(async (tx) => {
        await tx.table("meta").put({ key: "schemaVersion", value: "11" });
      });

    this.version(12)
      .stores({
        meta: "key",
        leads:
          "id, tenantId, email, crmStatus, outreachStatus, active, normalizedCompanyName, websiteDomain, sourceImportId, [tenantId+email], [tenantId+normalizedCompanyName]",
        customers: "id, tenantId, leadId, active, [tenantId+leadId]",
        customerContacts: "id, tenantId, customerId, active, [tenantId+customerId]",
        opportunities: "id, tenantId, leadId, customerId, [tenantId+leadId]",
        quotes:
          "id, tenantId, quoteNumber, leadId, customerId, status, active, simulationId, [tenantId+leadId]",
        productionOrders:
          "id, tenantId, orderNumber, quoteId, status, machineId, active, [tenantId+quoteId]",
        outreachMessages: "id, tenantId, leadId, [tenantId+leadId]",
        campaigns: "id, tenantId, status, createdAt, [tenantId+status]",
        campaignRecipients:
          "id, tenantId, campaignId, leadId, status, draftStatus, [tenantId+campaignId], [tenantId+leadId], [tenantId+draftStatus]",
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
          "id, tenantId, customerId, leadId, productId, quoteId, status, active, [tenantId+status]",
        importBatches: "id, tenantId, fileFingerprint, status, createdAt, [tenantId+fileFingerprint]",
        importRows: "id, tenantId, importBatchId, rowIndex, status, [tenantId+importBatchId]",
        importMappingProfiles: "id, tenantId, label, sourceLabel, [tenantId+label]",
        leadContacts:
          "id, tenantId, leadId, normalizedEmail, active, isPrimary, [tenantId+leadId], [tenantId+normalizedEmail]",
        emailSuppressions:
          "id, tenantId, normalizedEmail, reason, source, active, campaignId, leadId, [tenantId+normalizedEmail], [tenantId+reason], [tenantId+source]",
        outreachSendAttempts:
          "id, tenantId, provider, deliveryMode, campaignId, campaignRecipientId, leadId, idempotencyKey, status, startedAt, providerMessageId, [tenantId+campaignId], [tenantId+campaignRecipientId], [tenantId+idempotencyKey], [tenantId+status]",
        outreachProviderEvents:
          "id, tenantId, provider, eventFingerprint, providerMessageId, eventType, receivedAt, campaignRecipientId, sendAttemptId, processingStatus, [tenantId+eventFingerprint], [tenantId+eventType], [tenantId+processingStatus], [tenantId+campaignRecipientId]",
        outreachSendJobs:
          "id, tenantId, campaignId, provider, deliveryMode, status, lockExpiresAt, [tenantId+campaignId], [tenantId+status]",
        outreachSendJobRecipients:
          "id, tenantId, sendJobId, campaignId, campaignRecipientId, leadId, normalizedEmail, status, idempotencyKey, nextAttemptAt, [tenantId+sendJobId], [tenantId+campaignRecipientId], [tenantId+idempotencyKey], [tenantId+status]",
        outreachSendJobAttempts:
          "id, tenantId, sendJobId, sendJobRecipientId, campaignId, campaignRecipientId, idempotencyKey, status, providerMessageId, [tenantId+sendJobId], [tenantId+idempotencyKey], [tenantId+campaignRecipientId]",
        outreachSendJobDailyUsage:
          "id, tenantId, provider, usageDate, [tenantId+provider+usageDate]"
      })
      .upgrade(async (tx) => {
        await tx.table("importBatches").toCollection().modify((row: Record<string, unknown>) => {
          if (row.mappingProfileId === undefined) row.mappingProfileId = null;
          if (row.mappingProfileLabel === undefined) row.mappingProfileLabel = null;
          if (row.sheetName === undefined) row.sheetName = null;
          if (row.csvDelimiter === undefined) row.csvDelimiter = null;
          if (row.importedBy === undefined) row.importedBy = null;
        });
        await tx.table("meta").put({ key: "schemaVersion", value: "12" });
      });

    this.version(13)
      .stores({
        meta: "key",
        leads:
          "id, tenantId, email, crmStatus, outreachStatus, active, normalizedCompanyName, websiteDomain, sourceImportId, [tenantId+email], [tenantId+normalizedCompanyName]",
        customers: "id, tenantId, leadId, active, [tenantId+leadId]",
        customerContacts: "id, tenantId, customerId, active, [tenantId+customerId]",
        opportunities: "id, tenantId, leadId, customerId, [tenantId+leadId]",
        quotes:
          "id, tenantId, quoteNumber, leadId, customerId, status, active, simulationId, [tenantId+leadId]",
        productionOrders:
          "id, tenantId, orderNumber, quoteId, status, machineId, active, [tenantId+quoteId]",
        outreachMessages: "id, tenantId, leadId, [tenantId+leadId]",
        campaigns: "id, tenantId, status, createdAt, [tenantId+status]",
        campaignRecipients:
          "id, tenantId, campaignId, leadId, status, draftStatus, [tenantId+campaignId], [tenantId+leadId], [tenantId+draftStatus]",
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
          "id, tenantId, customerId, leadId, productId, quoteId, status, active, [tenantId+status]",
        importBatches: "id, tenantId, fileFingerprint, status, createdAt, [tenantId+fileFingerprint]",
        importRows: "id, tenantId, importBatchId, rowIndex, status, [tenantId+importBatchId]",
        importMappingProfiles: "id, tenantId, label, sourceLabel, [tenantId+label]",
        leadContacts:
          "id, tenantId, leadId, normalizedEmail, active, isPrimary, [tenantId+leadId], [tenantId+normalizedEmail]",
        emailSuppressions:
          "id, tenantId, normalizedEmail, reason, source, active, campaignId, leadId, [tenantId+normalizedEmail], [tenantId+reason], [tenantId+source]",
        outreachSendAttempts:
          "id, tenantId, provider, deliveryMode, campaignId, campaignRecipientId, leadId, idempotencyKey, status, startedAt, providerMessageId, [tenantId+campaignId], [tenantId+campaignRecipientId], [tenantId+idempotencyKey], [tenantId+status]",
        outreachProviderEvents:
          "id, tenantId, provider, eventFingerprint, providerMessageId, eventType, receivedAt, campaignRecipientId, sendAttemptId, processingStatus, [tenantId+eventFingerprint], [tenantId+eventType], [tenantId+processingStatus], [tenantId+campaignRecipientId]",
        outreachSendJobs:
          "id, tenantId, campaignId, provider, deliveryMode, status, lockExpiresAt, [tenantId+campaignId], [tenantId+status]",
        outreachSendJobRecipients:
          "id, tenantId, sendJobId, campaignId, campaignRecipientId, leadId, normalizedEmail, status, idempotencyKey, nextAttemptAt, [tenantId+sendJobId], [tenantId+campaignRecipientId], [tenantId+idempotencyKey], [tenantId+status]",
        outreachSendJobAttempts:
          "id, tenantId, sendJobId, sendJobRecipientId, campaignId, campaignRecipientId, idempotencyKey, status, providerMessageId, [tenantId+sendJobId], [tenantId+idempotencyKey], [tenantId+campaignRecipientId]",
        outreachSendJobDailyUsage:
          "id, tenantId, provider, usageDate, [tenantId+provider+usageDate]"
      })
      .upgrade(async (tx) => {
        await tx.table("campaignRecipients").toCollection().modify((row: Record<string, unknown>) => {
          if (row.greetingOverride === undefined) row.greetingOverride = "";
          if (row.organizationDisplayNameOverride === undefined) {
            row.organizationDisplayNameOverride = "";
          }
          if (row.contactSalutation === undefined) row.contactSalutation = null;
        });
        await tx.table("meta").put({ key: "schemaVersion", value: "13" });
      });

    this.version(14)
      .stores({
        meta: "key",
        leads:
          "id, tenantId, email, crmStatus, outreachStatus, active, normalizedCompanyName, websiteDomain, sourceImportId, [tenantId+email], [tenantId+normalizedCompanyName]",
        customers: "id, tenantId, leadId, active, [tenantId+leadId]",
        customerContacts: "id, tenantId, customerId, active, [tenantId+customerId]",
        opportunities: "id, tenantId, leadId, customerId, [tenantId+leadId]",
        quotes:
          "id, tenantId, quoteNumber, leadId, customerId, status, active, simulationId, [tenantId+leadId]",
        productionOrders:
          "id, tenantId, orderNumber, quoteId, status, machineId, active, [tenantId+quoteId]",
        outreachMessages: "id, tenantId, leadId, [tenantId+leadId]",
        campaigns: "id, tenantId, status, createdAt, [tenantId+status]",
        campaignRecipients:
          "id, tenantId, campaignId, leadId, status, draftStatus, [tenantId+campaignId], [tenantId+leadId], [tenantId+draftStatus]",
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
          "id, tenantId, customerId, leadId, productId, quoteId, status, active, [tenantId+status]",
        importBatches: "id, tenantId, fileFingerprint, status, createdAt, [tenantId+fileFingerprint]",
        importRows: "id, tenantId, importBatchId, rowIndex, status, [tenantId+importBatchId]",
        importMappingProfiles: "id, tenantId, label, sourceLabel, [tenantId+label]",
        leadContacts:
          "id, tenantId, leadId, normalizedEmail, active, isPrimary, [tenantId+leadId], [tenantId+normalizedEmail]",
        emailSuppressions:
          "id, tenantId, normalizedEmail, reason, source, active, campaignId, leadId, [tenantId+normalizedEmail], [tenantId+reason], [tenantId+source]",
        outreachSendAttempts:
          "id, tenantId, provider, deliveryMode, campaignId, campaignRecipientId, leadId, idempotencyKey, status, startedAt, providerMessageId, [tenantId+campaignId], [tenantId+campaignRecipientId], [tenantId+idempotencyKey], [tenantId+status]",
        outreachProviderEvents:
          "id, tenantId, provider, eventFingerprint, providerMessageId, eventType, receivedAt, campaignRecipientId, sendAttemptId, processingStatus, [tenantId+eventFingerprint], [tenantId+eventType], [tenantId+processingStatus], [tenantId+campaignRecipientId]",
        outreachSendJobs:
          "id, tenantId, campaignId, provider, deliveryMode, status, lockExpiresAt, [tenantId+campaignId], [tenantId+status]",
        outreachSendJobRecipients:
          "id, tenantId, sendJobId, campaignId, campaignRecipientId, leadId, normalizedEmail, status, idempotencyKey, nextAttemptAt, [tenantId+sendJobId], [tenantId+campaignRecipientId], [tenantId+idempotencyKey], [tenantId+status]",
        outreachSendJobAttempts:
          "id, tenantId, sendJobId, sendJobRecipientId, campaignId, campaignRecipientId, idempotencyKey, status, providerMessageId, [tenantId+sendJobId], [tenantId+idempotencyKey], [tenantId+campaignRecipientId]",
        outreachSendJobDailyUsage:
          "id, tenantId, provider, usageDate, [tenantId+provider+usageDate]",
        outreachTestProfiles: "id, tenantId, [tenantId+id]"
      })
      .upgrade(async (tx) => {
        await tx.table("meta").put({ key: "schemaVersion", value: "14" });
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
