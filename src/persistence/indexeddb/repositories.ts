import { DEFAULT_TENANT_ID, SCHEMA_VERSION, SEED_VERSION } from "@/domain/constants";
import { createRecordId } from "@/domain/ids";
import {
  formatProductionOrderNumber,
  formatQuoteNumber,
  leadFromLeadOpsSeed
} from "@/domain/mappers";
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
import { demoProducts, jhGomesTenant } from "@/demo/seed";
import { findCompatibleMachine } from "@/demo/workflow";
import {
  leadOpsCampaigns,
  leadOpsLeads
} from "@/features/leadops/seed";
import type { ForgeOSDatabase } from "../db";
import {
  createCompanyProfileRepository,
  createLocalAssetRepository,
  createSenderIdentityRepository,
  createUserProfileRepository
} from "./profile-repositories";
import { createProductRepository, demoProductToCreateInput } from "./product-repositories";
import type { ForgeOSBackup } from "@/features/backup/service";
import {
  PersistenceError,
  type ActivityRepository,
  type CampaignRepository,
  type CustomerRepository,
  type LeadRepository,
  type MetaRepository,
  type OpportunityRepository,
  type OutreachMessageRepository,
  type ProductionOrderRepository,
  type QuoteRepository
} from "../interfaces";


function nowIso(): string {
  return new Date().toISOString();
}

export function createMetaRepository(db: ForgeOSDatabase): MetaRepository {
  return {
    async get(key) {
      const row = await db.meta.get(key);
      return row?.value ?? null;
    },
    async set(key, value) {
      await db.meta.put({ key, value });
    },
    async delete(key) {
      await db.meta.delete(key);
    }
  };
}

export function createLeadRepository(db: ForgeOSDatabase): LeadRepository {
  return {
    async list(tenantId) {
      return db.leads.where("tenantId").equals(tenantId).toArray();
    },
    async getById(tenantId, leadId) {
      const lead = await db.leads.get(leadId);
      if (!lead || lead.tenantId !== tenantId) return null;
      return lead;
    },
    async getByEmail(tenantId, email) {
      const normalized = email.toLowerCase().trim();
      const leads = await db.leads
        .where("[tenantId+email]")
        .equals([tenantId, normalized])
        .toArray();
      return leads[0] ?? null;
    },
    async create(tenantId, input) {
      const email = input.email.toLowerCase().trim();
      const existing = await this.getByEmail(tenantId, email);
      if (existing) {
        throw new PersistenceError("duplicate", "A lead with this email already exists.");
      }
      const timestamp = nowIso();
      const lead: Lead = {
        id: createRecordId("lead"),
        tenantId,
        companyName: input.companyName.trim(),
        contactName: input.contactName.trim(),
        email,
        phone: input.phone?.trim() ?? "",
        website: input.website ?? null,
        location: input.location?.trim() ?? "",
        industry: input.industry?.trim() ?? "General",
        crmStatus: "new",
        outreachStatus: "ready",
        quality: "medium",
        source: input.source?.trim() ?? "manual",
        sourceDatabase: input.sourceDatabase?.trim() ?? "Demo",
        language: input.language ?? "pt-PT",
        campaignId: null,
        consentStatus: "subscribed",
        providerState: "not_ready",
        requestedProductId: input.requestedProductId ?? null,
        quantity: input.quantity ?? 0,
        notes: input.notes?.trim() ?? "",
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.leads.put(lead);
      return lead;
    },
    async createMany(tenantId, inputs) {
      const created: Lead[] = [];
      for (const input of inputs) {
        try {
          created.push(await this.create(tenantId, input));
        } catch (error) {
          if (error instanceof PersistenceError && error.code === "duplicate") {
            continue;
          }
          throw error;
        }
      }
      return created;
    },
    async update(tenantId, leadId, input) {
      const existing = await this.getById(tenantId, leadId);
      if (!existing) {
        throw new PersistenceError("not_found", "Lead not found.");
      }
      const updated: Lead = {
        ...existing,
        ...input,
        id: existing.id,
        tenantId: existing.tenantId,
        createdAt: existing.createdAt,
        updatedAt: nowIso()
      };
      await db.leads.put(updated);
      return updated;
    }
  };
}

export function createCustomerRepository(
  db: ForgeOSDatabase,
  leads: LeadRepository
): CustomerRepository {
  return {
    async list(tenantId) {
      return db.customers.where("tenantId").equals(tenantId).toArray();
    },
    async getById(tenantId, customerId) {
      const customer = await db.customers.get(customerId);
      if (!customer || customer.tenantId !== tenantId) return null;
      return customer;
    },
    async getByLeadId(tenantId, leadId) {
      const rows = await db.customers
        .where("[tenantId+leadId]")
        .equals([tenantId, leadId])
        .toArray();
      return rows[0] ?? null;
    },
    async createFromLead(tenantId, leadId) {
      const existing = await this.getByLeadId(tenantId, leadId);
      if (existing) {
        throw new PersistenceError("duplicate", "Customer already exists for this lead.");
      }
      const lead = await leads.getById(tenantId, leadId);
      if (!lead) {
        throw new PersistenceError("missing_link", "Lead not found for conversion.");
      }
      if (lead.crmStatus === "converted") {
        throw new PersistenceError("invalid_transition", "Lead is already converted.");
      }
      const timestamp = nowIso();
      const customer: Customer = {
        id: createRecordId("cust"),
        tenantId,
        leadId,
        companyName: lead.companyName,
        contactName: lead.contactName,
        email: lead.email,
        phone: lead.phone,
        notes: lead.notes,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.customers.put(customer);
      await leads.update(tenantId, leadId, {
        crmStatus: "converted",
        outreachStatus: lead.outreachStatus
      });
      return customer;
    }
  };
}

export function createOpportunityRepository(
  db: ForgeOSDatabase,
  leads: LeadRepository
): OpportunityRepository {
  return {
    async list(tenantId) {
      return db.opportunities.where("tenantId").equals(tenantId).toArray();
    },
    async getById(tenantId, opportunityId) {
      const row = await db.opportunities.get(opportunityId);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async getByLeadId(tenantId, leadId) {
      const rows = await db.opportunities
        .where("[tenantId+leadId]")
        .equals([tenantId, leadId])
        .toArray();
      return rows[0] ?? null;
    },
    async createFromLead(tenantId, leadId, customerId) {
      const existing = await this.getByLeadId(tenantId, leadId);
      if (existing) {
        throw new PersistenceError("duplicate", "Opportunity already exists for this lead.");
      }
      const lead = await leads.getById(tenantId, leadId);
      if (!lead) {
        throw new PersistenceError("missing_link", "Lead not found.");
      }
      const timestamp = nowIso();
      const opportunity: Opportunity = {
        id: createRecordId("opp"),
        tenantId,
        leadId,
        customerId: customerId ?? null,
        title: `${lead.companyName} — cup personalization`,
        stage: "qualification",
        estimatedValue: 0,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.opportunities.put(opportunity);
      return opportunity;
    }
  };
}

export function createQuoteRepository(db: ForgeOSDatabase): QuoteRepository {
  return {
    async list(tenantId) {
      return db.quotes.where("tenantId").equals(tenantId).toArray();
    },
    async getById(tenantId, quoteId) {
      const row = await db.quotes.get(quoteId);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async getByLeadId(tenantId, leadId) {
      const rows = await db.quotes.where("[tenantId+leadId]").equals([tenantId, leadId]).toArray();
      return rows[0] ?? null;
    },
    async create(tenantId, input) {
      const count = await db.quotes.where("tenantId").equals(tenantId).count();
      const timestamp = nowIso();
      const quote: Quote = {
        id: createRecordId("quote"),
        tenantId,
        quoteNumber: formatQuoteNumber(count + 1),
        leadId: input.leadId ?? null,
        customerId: input.customerId ?? null,
        opportunityId: input.opportunityId ?? null,
        productId: input.productId,
        productName: input.productName,
        quantity: input.quantity,
        printColorCount: input.printColorCount,
        status: "draft",
        lines: [
          {
            productId: input.productId,
            productName: input.productName,
            quantity: input.quantity,
            unitPrice: input.unitPrice,
            setupCost: input.setupCost,
            lineTotal: input.total
          }
        ],
        subtotal: input.subtotal,
        vat: input.vat,
        total: input.total,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.quotes.put(quote);
      return quote;
    },
    async updateStatus(tenantId, quoteId, status) {
      const existing = await this.getById(tenantId, quoteId);
      if (!existing) {
        throw new PersistenceError("not_found", "Quote not found.");
      }
      const updated = { ...existing, status, updatedAt: nowIso() };
      await db.quotes.put(updated);
      return updated;
    }
  };
}

export function createProductionOrderRepository(
  db: ForgeOSDatabase,
  quotes: QuoteRepository
): ProductionOrderRepository {
  return {
    async list(tenantId) {
      return db.productionOrders.where("tenantId").equals(tenantId).toArray();
    },
    async getById(tenantId, orderId) {
      const row = await db.productionOrders.get(orderId);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    },
    async getByQuoteId(tenantId, quoteId) {
      const rows = await db.productionOrders
        .where("[tenantId+quoteId]")
        .equals([tenantId, quoteId])
        .toArray();
      return rows[0] ?? null;
    },
    async createFromQuote(tenantId, quoteId) {
      const existing = await this.getByQuoteId(tenantId, quoteId);
      if (existing) {
        throw new PersistenceError("duplicate", "Production order already exists for this quote.");
      }
      const quote = await quotes.getById(tenantId, quoteId);
      if (!quote) {
        throw new PersistenceError("missing_link", "Quote not found.");
      }
      if (quote.status !== "approved") {
        throw new PersistenceError("invalid_transition", "Quote must be approved first.");
      }
      const product =
        demoProducts.find((p) => p.id === quote.productId) ?? demoProducts[0];
      const machine = findCompatibleMachine(product);
      const count = await db.productionOrders.where("tenantId").equals(tenantId).count();
      const timestamp = nowIso();
      const order: ProductionOrder = {
        id: createRecordId("po"),
        tenantId,
        orderNumber: formatProductionOrderNumber(count + 1),
        quoteId,
        customerId: quote.customerId,
        customerName: "-",
        productId: quote.productId,
        productName: quote.productName,
        quantity: quote.quantity,
        status: "scheduled",
        scheduledDate: timestamp.slice(0, 10),
        artworkStatus: "pending",
        screenStatus: "pending",
        machineId: machine.id,
        machineName: machine.name,
        progress: 0,
        operatorNotes: "Created from approved quotation.",
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.productionOrders.put(order);
      return order;
    },
    async update(tenantId, orderId, input) {
      const existing = await this.getById(tenantId, orderId);
      if (!existing) {
        throw new PersistenceError("not_found", "Production order not found.");
      }
      const updated = { ...existing, ...input, updatedAt: nowIso() };
      await db.productionOrders.put(updated);
      return updated;
    }
  };
}

export function createOutreachMessageRepository(db: ForgeOSDatabase): OutreachMessageRepository {
  return {
    async listForLead(tenantId, leadId) {
      return db.outreachMessages
        .where("[tenantId+leadId]")
        .equals([tenantId, leadId])
        .toArray();
    },
    async listAll(tenantId) {
      return db.outreachMessages.where("tenantId").equals(tenantId).toArray();
    },
    async getForLead(tenantId, leadId) {
      const rows = await this.listForLead(tenantId, leadId);
      return rows[0] ?? null;
    },
    async saveDraft(tenantId, leadId, message) {
      const record: OutreachMessage = {
        ...message,
        tenantId,
        leadId,
        id: message.id || leadId,
        updatedAt: nowIso()
      };
      await db.outreachMessages.put(record);
      return record;
    },
    async countBySenderIdentity(tenantId, senderIdentityId) {
      const rows = await this.listAll(tenantId);
      return rows.filter((row) => {
        const msg = row.message;
        if (!msg?.approved) return false;
        const composition = msg.composition;
        return composition?.senderIdentityId === senderIdentityId;
      }).length;
    }
  };
}

export function createCampaignRepository(db: ForgeOSDatabase): CampaignRepository {
  return {
    async list(tenantId) {
      return db.campaigns.where("tenantId").equals(tenantId).toArray();
    },
    async getById(tenantId, campaignId) {
      const row = await db.campaigns.get(campaignId);
      if (!row || row.tenantId !== tenantId) return null;
      return row;
    }
  };
}

export function createActivityRepository(db: ForgeOSDatabase): ActivityRepository {
  return {
    async list(tenantId) {
      const events = await db.activities.where("tenantId").equals(tenantId).toArray();
      return events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    },
    async append(tenantId, event) {
      const record: ActivityEvent = {
        id: createRecordId("act"),
        tenantId,
        entityType: event.entityType,
        entityId: event.entityId,
        action: event.action,
        title: event.title,
        metadata: event.metadata ?? {},
        occurredAt: nowIso()
      };
      await db.activities.put(record);
      return record;
    }
  };
}

const META_SEED_KEY = "seedVersion";

async function seedProfileDefaults(db: ForgeOSDatabase, tenantId: string): Promise<void> {
  const companyProfiles = createCompanyProfileRepository(db);
  const userProfiles = createUserProfileRepository(db);
  const senderIdentities = createSenderIdentityRepository(db);
  const products = createProductRepository(db);

  const company = await companyProfiles.ensureDefault(tenantId, {
    addressLine1: "Zona Industrial de Oliveira de Azeméis",
    addressLine2: "",
    city: "Oliveira de Azeméis",
    country: "Portugal",
    defaultCurrency: "EUR",
    defaultLanguage: "pt-PT",
    facebookUrl: "",
    generalEmail: "geral@jhgomes.pt",
    generalPhone: "+351 256 000 000",
    legalFooter:
      "JH Gomes — Fabrico de copos personalizados. Mensagem comercial sujeita a disponibilidade e confirmação comercial.",
    legalName: "JH Gomes, Lda.",
    linkedinUrl: "",
    logoLocalAssetId: null,
    logoPublicUrl: "",
    postalCode: "3720-000",
    region: "Aveiro",
    tradingName: "JH Gomes",
    vatNumber: "PT000000000",
    websiteUrl: "https://www.jhgomes.pt"
  });

  const user = await userProfiles.ensureDefault(tenantId, {
    active: true,
    email: "joao.gomes@demo.local",
    fullName: "João Gomes",
    isLocalPreview: false,
    jobTitle: "Diretor Comercial",
    phone: "+351 910 000 000",
    preferredLanguage: "pt-PT",
    profileImageLocalAssetId: null,
    role: "admin"
  });

  await senderIdentities.ensureDefault(tenantId, {
    active: true,
    companyProfileId: company.id,
    defaultLanguage: "pt-PT",
    displayName: user.fullName,
    fromEmail: user.email,
    isDefault: true,
    jobTitle: user.jobTitle,
    phone: user.phone,
    replyToEmail: user.email,
    signatureHtml: "",
    signatureText: "",
    userProfileId: user.id
  });

  const productInputs = demoProducts
    .filter((p) => p.tenantId === tenantId)
    .map((p) => demoProductToCreateInput(p));
  if (productInputs.length > 0) {
    await products.createMany(tenantId, productInputs);
  }
}

export async function seedDatabase(
  db: ForgeOSDatabase,
  tenantId: string = DEFAULT_TENANT_ID,
  force = false
): Promise<boolean> {
  const meta = createMetaRepository(db);
  const existingVersion = await meta.get(META_SEED_KEY);

  if (!force && existingVersion === String(SEED_VERSION)) {
    const leadCount = await db.leads.where("tenantId").equals(tenantId).count();
    const profileCount = await db.companyProfiles.where("tenantId").equals(tenantId).count();
    if (leadCount > 0 && profileCount > 0) return false;
  }

  const timestamp = nowIso();

  const campaigns: Campaign[] = leadOpsCampaigns
    .filter((c) => c.tenantId === tenantId)
    .map((c) => ({
      id: c.id,
      tenantId: c.tenantId,
      name: c.name,
      status: c.status,
      sentCount: c.sentCount,
      totalCount: c.totalCount
    }));

  const leads: Lead[] = leadOpsLeads
    .filter((l) => l.tenantId === tenantId)
    .map((seed) =>
      leadFromLeadOpsSeed(seed, {
        createdAt: timestamp,
        updatedAt: timestamp
      })
    );

  const allTables = [
    db.meta,
    db.leads,
    db.customers,
    db.opportunities,
    db.quotes,
    db.productionOrders,
    db.outreachMessages,
    db.campaigns,
    db.activities,
    db.companyProfiles,
    db.userProfiles,
    db.senderIdentities,
    db.localAssets,
    db.products
  ];

  await db.transaction("rw", allTables, async () => {
    if (force) {
      await db.leads.where("tenantId").equals(tenantId).delete();
      await db.customers.where("tenantId").equals(tenantId).delete();
      await db.opportunities.where("tenantId").equals(tenantId).delete();
      await db.quotes.where("tenantId").equals(tenantId).delete();
      await db.productionOrders.where("tenantId").equals(tenantId).delete();
      await db.outreachMessages.where("tenantId").equals(tenantId).delete();
      await db.campaigns.where("tenantId").equals(tenantId).delete();
      await db.activities.where("tenantId").equals(tenantId).delete();
      await db.companyProfiles.where("tenantId").equals(tenantId).delete();
      await db.userProfiles.where("tenantId").equals(tenantId).delete();
      await db.senderIdentities.where("tenantId").equals(tenantId).delete();
      await db.localAssets.where("tenantId").equals(tenantId).delete();
      await db.products.where("tenantId").equals(tenantId).delete();
    }

    const existingLeads = await db.leads.where("tenantId").equals(tenantId).count();
    if (existingLeads === 0) {
      await db.campaigns.bulkPut(campaigns);
      await db.leads.bulkPut(leads);
    }

    await meta.set(META_SEED_KEY, String(SEED_VERSION));
    await meta.set("schemaVersion", String(SCHEMA_VERSION));
    await meta.set("tenantId", tenantId);
    await meta.set("tenantName", jhGomesTenant.name);
  });

  const profileCount = await db.companyProfiles.where("tenantId").equals(tenantId).count();
  if (profileCount === 0) {
    await seedProfileDefaults(db, tenantId);
  }

  return true;
}

export async function resetDatabase(db: ForgeOSDatabase): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.meta,
      db.leads,
      db.customers,
      db.opportunities,
      db.quotes,
      db.productionOrders,
      db.outreachMessages,
      db.campaigns,
      db.activities,
      db.companyProfiles,
      db.userProfiles,
      db.senderIdentities,
      db.localAssets,
      db.products
    ],
    async () => {
      await db.meta.clear();
      await db.leads.clear();
      await db.customers.clear();
      await db.opportunities.clear();
      await db.quotes.clear();
      await db.productionOrders.clear();
      await db.outreachMessages.clear();
      await db.campaigns.clear();
      await db.activities.clear();
      await db.companyProfiles.clear();
      await db.userProfiles.clear();
      await db.senderIdentities.clear();
      await db.localAssets.clear();
      await db.products.clear();
    }
  );
}

async function importBackupToDb(db: ForgeOSDatabase, backup: ForgeOSBackup): Promise<void> {
  const { tables, localAssets, tenantId } = backup;
  await db.transaction(
    "rw",
    [
      db.leads,
      db.customers,
      db.opportunities,
      db.quotes,
      db.productionOrders,
      db.outreachMessages,
      db.campaigns,
      db.activities,
      db.companyProfiles,
      db.userProfiles,
      db.senderIdentities,
      db.localAssets,
      db.products
    ],
    async () => {
      await db.leads.bulkPut(tables.leads);
      await db.customers.bulkPut(tables.customers);
      await db.opportunities.bulkPut(tables.opportunities);
      await db.quotes.bulkPut(tables.quotes);
      await db.productionOrders.bulkPut(tables.productionOrders);
      await db.outreachMessages.bulkPut(tables.outreachMessages);
      await db.campaigns.bulkPut(tables.campaigns);
      await db.activities.bulkPut(tables.activities);
      await db.companyProfiles.bulkPut(tables.companyProfiles);
      await db.userProfiles.bulkPut(tables.userProfiles);
      await db.senderIdentities.bulkPut(tables.senderIdentities);
      await db.products.bulkPut(tables.products);
      if (localAssets) {
        for (const asset of localAssets) {
          const binary = atob(asset.blobBase64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes], { type: asset.mimeType });
          const { blobBase64: _removed, ...rest } = asset;
          void _removed;
          await db.localAssets.put({ ...rest, blob });
        }
      }
      await db.meta.put({ key: "tenantId", value: tenantId });
    }
  );
}

export function createLocalRepositoryBundle(db: ForgeOSDatabase) {
  const meta = createMetaRepository(db);
  const leads = createLeadRepository(db);
  const customers = createCustomerRepository(db, leads);
  const opportunities = createOpportunityRepository(db, leads);
  const quotes = createQuoteRepository(db);
  const productionOrders = createProductionOrderRepository(db, quotes);
  const outreachMessages = createOutreachMessageRepository(db);
  const campaigns = createCampaignRepository(db);
  const activities = createActivityRepository(db);
  const companyProfiles = createCompanyProfileRepository(db);
  const userProfiles = createUserProfileRepository(db);
  const senderIdentities = createSenderIdentityRepository(db);
  const localAssets = createLocalAssetRepository(db);
  const products = createProductRepository(db);

  return {
    meta,
    leads,
    customers,
    opportunities,
    quotes,
    productionOrders,
    outreachMessages,
    campaigns,
    activities,
    companyProfiles,
    userProfiles,
    senderIdentities,
    localAssets,
    products,
    async reset() {
      await resetDatabase(db);
    },
    async seed(tenantId: string) {
      await seedDatabase(db, tenantId, true);
    },
    async importBackupData(backup: ForgeOSBackup) {
      await importBackupToDb(db, backup);
    }
  };
}
