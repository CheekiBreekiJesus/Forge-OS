import { DEFAULT_TENANT_ID, SEED_VERSION } from "@/domain/constants";
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

export async function seedDatabase(
  db: ForgeOSDatabase,
  tenantId: string = DEFAULT_TENANT_ID,
  force = false
): Promise<boolean> {
  const meta = createMetaRepository(db);
  const existingVersion = await meta.get(META_SEED_KEY);

  if (!force && existingVersion === String(SEED_VERSION)) {
    const leadCount = await db.leads.where("tenantId").equals(tenantId).count();
    if (leadCount > 0) return false;
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
      db.activities
    ],
    async () => {
      if (force) {
        await db.leads.where("tenantId").equals(tenantId).delete();
        await db.customers.where("tenantId").equals(tenantId).delete();
        await db.opportunities.where("tenantId").equals(tenantId).delete();
        await db.quotes.where("tenantId").equals(tenantId).delete();
        await db.productionOrders.where("tenantId").equals(tenantId).delete();
        await db.outreachMessages.where("tenantId").equals(tenantId).delete();
        await db.campaigns.where("tenantId").equals(tenantId).delete();
        await db.activities.where("tenantId").equals(tenantId).delete();
      }

      await db.campaigns.bulkPut(campaigns);
      await db.leads.bulkPut(leads);
      await meta.set(META_SEED_KEY, String(SEED_VERSION));
      await meta.set("tenantId", tenantId);
      await meta.set("tenantName", jhGomesTenant.name);
    }
  );

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
      db.activities
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
    async reset() {
      await resetDatabase(db);
    },
    async seed(tenantId: string) {
      await seedDatabase(db, tenantId, true);
    }
  };
}
