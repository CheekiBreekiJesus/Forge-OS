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
  CreateCustomerInput,
  Customer,
  Lead,
  Opportunity,
  OutreachMessage,
  ProductionOrder,
  Quote
} from "@/domain/types";
import { demoProducts, jhGomesTenant } from "@/demo/seed";
import {
  leadOpsCampaigns,
  leadOpsLeads
} from "@/features/leadops/seed";
import { recordActivity } from "@/features/crud/activity-recorder";
import { resolveCustomerName } from "@/features/crud/relationships";
import {
  normalizeEmail,
  normalizeOrganizationComparisonKey,
  normalizePhone,
  normalizeWebsite
} from "@/features/leadops/import-normalization";
import {
  createArchivePatch,
  createRestorePatch,
  filterByArchive,
  DEFAULT_ARCHIVABLE,
  isActiveRecord,
  type ArchiveInput,
  type ListOptions
} from "@/persistence/archive-utils";
import type { ForgeOSDatabase } from "../db";
import {
  createCompanyProfileRepository,
  createLocalAssetRepository,
  createSenderIdentityRepository,
  createUserProfileRepository
} from "./profile-repositories";
import { createProductRepository, demoProductToCreateInput } from "./product-repositories";
import { createCustomizerSimulationRepository } from "./customizer-repositories";
import {
  campaignFromSeed,
  createCampaignRecipientRepository,
  createOutreachCampaignRepository
} from "./campaign-repositories";
import {
  createImportBatchRepository,
  createImportRowRepository,
  createLeadContactRepository
} from "./import-repositories";
import { createEmailSuppressionRepository } from "./suppression-repositories";
import { createOutreachProviderEventRepository } from "./provider-event-repositories";
import { createOutreachSendAttemptRepository } from "./send-attempt-repositories";
import {
  createOutreachSendJobAttemptRepository,
  createOutreachSendJobDailyUsageRepository,
  createOutreachSendJobRecipientRepository,
  createOutreachSendJobRepository
} from "./send-job-repositories";
import {
  createCustomerContactRepository,
  createInventoryRepository,
  createMachineRepository,
  seedOperationsDefaults
} from "./operations-repositories";
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

export function createLeadRepository(
  db: ForgeOSDatabase,
  activities?: ActivityRepository
): LeadRepository {
  return {
    async list(tenantId, options?: ListOptions) {
      const rows = await db.leads.where("tenantId").equals(tenantId).toArray();
      return filterByArchive(rows, options);
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
      const email = normalizeEmail(input.email);
      if (email) {
        const existing = await this.getByEmail(tenantId, email);
        if (existing && isActiveRecord(existing)) {
          throw new PersistenceError("duplicate", "A lead with this email already exists.");
        }
      }
      const phoneResult = normalizePhone(input.phone ?? "");
      const websiteResult = normalizeWebsite(input.website ?? "");
      const timestamp = nowIso();
      const lead: Lead = {
        id: createRecordId("lead"),
        tenantId,
        companyName: input.companyName.trim(),
        normalizedCompanyName: normalizeOrganizationComparisonKey(input.companyName),
        contactName: input.contactName.trim(),
        email,
        phone: phoneResult.display,
        normalizedPhone: phoneResult.normalized,
        website: websiteResult.display,
        websiteDomain: websiteResult.domain,
        facebookUrl: input.facebookUrl ?? null,
        location: input.location?.trim() ?? "",
        country: input.country?.trim() ?? "Portugal",
        industry: input.industry?.trim() ?? "General",
        crmStatus: "new",
        outreachStatus: input.outreachStatus ?? "ready",
        quality: input.quality ?? "medium",
        source: input.source?.trim() ?? "manual",
        sourceDatabase: input.sourceDatabase?.trim() ?? "Manual",
        sourceImportId: input.sourceImportId ?? null,
        contactSource: input.contactSource?.trim() ?? input.sourceDatabase?.trim() ?? "Manual",
        language: input.language ?? "pt-PT",
        campaignId: null,
        consentStatus: input.consentStatus ?? "subscribed",
        providerState: "not_ready",
        requestedProductId: input.requestedProductId ?? null,
        quantity: input.quantity ?? 0,
        notes: input.notes?.trim() ?? "",
        ...DEFAULT_ARCHIVABLE,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.leads.put(lead);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "entity_created",
          entityId: lead.id,
          entityType: "lead",
          title: `Lead created: ${lead.companyName}`
        });
      }
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
    },
    async duplicate(tenantId, leadId) {
      const existing = await this.getById(tenantId, leadId);
      if (!existing) throw new PersistenceError("not_found", "Lead not found.");
      const suffix = Date.now().toString().slice(-4);
      return this.create(tenantId, {
        companyName: `${existing.companyName} (${suffix})`,
        contactName: existing.contactName,
        email: existing.email.replace("@", `+${suffix}@`),
        phone: existing.phone,
        website: existing.website,
        facebookUrl: existing.facebookUrl,
        location: existing.location,
        industry: existing.industry,
        source: existing.source,
        sourceDatabase: existing.sourceDatabase,
        contactSource: existing.contactSource,
        language: existing.language,
        notes: existing.notes,
        quality: existing.quality
      });
    },
    async archive(tenantId, leadId, input?: ArchiveInput) {
      const existing = await this.getById(tenantId, leadId);
      if (!existing) throw new PersistenceError("not_found", "Lead not found.");
      const updated: Lead = {
        ...existing,
        ...createArchivePatch(input),
        updatedAt: nowIso()
      };
      await db.leads.put(updated);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "entity_archived",
          entityId: leadId,
          entityType: "lead",
          title: `Lead archived: ${existing.companyName}`
        });
      }
      return updated;
    },
    async restore(tenantId, leadId) {
      const existing = await this.getById(tenantId, leadId);
      if (!existing) throw new PersistenceError("not_found", "Lead not found.");
      const updated: Lead = {
        ...existing,
        ...createRestorePatch(),
        updatedAt: nowIso()
      };
      await db.leads.put(updated);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "entity_restored",
          entityId: leadId,
          entityType: "lead",
          title: `Lead restored: ${existing.companyName}`
        });
      }
      return updated;
    }
  };
}

export function createCustomerRepository(
  db: ForgeOSDatabase,
  leads: LeadRepository,
  activities?: ActivityRepository
): CustomerRepository {
  const buildCustomer = (tenantId: string, input: CreateCustomerInput, leadId: string | null): Customer => {
    const timestamp = nowIso();
    const tradingName = input.tradingName?.trim() || input.companyName?.trim() || input.legalName.trim();
    return {
      id: createRecordId("cust"),
      tenantId,
      leadId,
      legalName: input.legalName.trim(),
      tradingName,
      companyName: input.companyName?.trim() || tradingName,
      contactName: input.contactName.trim(),
      email: normalizeEmail(input.email),
      phone: input.phone?.trim() ?? "",
      vatNumber: input.vatNumber?.trim() ?? "",
      addressLine1: input.addressLine1?.trim() ?? "",
      addressLine2: input.addressLine2?.trim() ?? "",
      postalCode: input.postalCode?.trim() ?? "",
      city: input.city?.trim() ?? "",
      country: input.country?.trim() ?? "Portugal",
      website: input.website ?? null,
      customerStatus: input.customerStatus ?? "active",
      notes: input.notes?.trim() ?? "",
      ...DEFAULT_ARCHIVABLE,
      createdAt: timestamp,
      updatedAt: timestamp
    };
  };

  return {
    async list(tenantId, options?: ListOptions) {
      const rows = await db.customers.where("tenantId").equals(tenantId).toArray();
      return filterByArchive(rows, options);
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
      if (existing && isActiveRecord(existing)) {
        throw new PersistenceError("duplicate", "Customer already exists for this lead.");
      }
      const lead = await leads.getById(tenantId, leadId);
      if (!lead) {
        throw new PersistenceError("missing_link", "Lead not found for conversion.");
      }
      const customer = buildCustomer(tenantId, {
        contactName: lead.contactName,
        email: lead.email,
        leadId,
        legalName: lead.companyName,
        notes: lead.notes,
        phone: lead.phone,
        tradingName: lead.companyName,
        website: lead.website
      }, leadId);
      await db.customers.put(customer);
      await leads.update(tenantId, leadId, { crmStatus: "converted" });
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "customer_created",
          entityId: customer.id,
          entityType: "customer",
          title: `Customer created from lead: ${customer.companyName}`,
          metadata: { leadId }
        });
      }
      return customer;
    },
    async create(tenantId, input) {
      const customer = buildCustomer(tenantId, input, input.leadId ?? null);
      await db.customers.put(customer);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "entity_created",
          entityId: customer.id,
          entityType: "customer",
          title: `Customer created: ${customer.companyName}`
        });
      }
      return customer;
    },
    async update(tenantId, customerId, input) {
      const existing = await this.getById(tenantId, customerId);
      if (!existing) throw new PersistenceError("not_found", "Customer not found.");
      const updated: Customer = {
        ...existing,
        ...input,
        email: input.email ? normalizeEmail(input.email) : existing.email,
        id: existing.id,
        tenantId: existing.tenantId,
        createdAt: existing.createdAt,
        updatedAt: nowIso()
      };
      await db.customers.put(updated);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "entity_updated",
          entityId: customerId,
          entityType: "customer",
          title: `Customer updated: ${updated.companyName}`
        });
      }
      return updated;
    },
    async archive(tenantId, customerId, input?: ArchiveInput) {
      const existing = await this.getById(tenantId, customerId);
      if (!existing) throw new PersistenceError("not_found", "Customer not found.");
      const updated: Customer = {
        ...existing,
        ...createArchivePatch(input),
        updatedAt: nowIso()
      };
      await db.customers.put(updated);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "entity_archived",
          entityId: customerId,
          entityType: "customer",
          title: `Customer archived: ${existing.companyName}`
        });
      }
      return updated;
    },
    async restore(tenantId, customerId) {
      const existing = await this.getById(tenantId, customerId);
      if (!existing) throw new PersistenceError("not_found", "Customer not found.");
      const updated: Customer = {
        ...existing,
        ...createRestorePatch(),
        updatedAt: nowIso()
      };
      await db.customers.put(updated);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "entity_restored",
          entityId: customerId,
          entityType: "customer",
          title: `Customer restored: ${existing.companyName}`
        });
      }
      return updated;
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
    async getByCustomerId(tenantId, customerId) {
      const rows = await db.opportunities.where("tenantId").equals(tenantId).toArray();
      return rows.filter((o) => o.customerId === customerId);
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

export function createQuoteRepository(
  db: ForgeOSDatabase,
  activities?: ActivityRepository
): QuoteRepository {
  return {
    async list(tenantId, options?: ListOptions) {
      const rows = await db.quotes.where("tenantId").equals(tenantId).toArray();
      return filterByArchive(rows, options);
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
    async getByCustomerId(tenantId, customerId) {
      const rows = await db.quotes.where("tenantId").equals(tenantId).toArray();
      return rows.filter((q) => q.customerId === customerId);
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
        discount: input.discount ?? 0,
        validityDate: input.validityDate ?? null,
        notes: input.notes?.trim() ?? "",
        simulationId: input.simulationId ?? null,
        mockupAssetId: input.mockupAssetId ?? null,
        isEstimate: input.isEstimate ?? false,
        ...DEFAULT_ARCHIVABLE,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.quotes.put(quote);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "quotation_created",
          entityId: quote.id,
          entityType: "quote",
          title: `Quotation created: ${quote.quoteNumber}`
        });
      }
      return quote;
    },
    async update(tenantId, quoteId, input) {
      const existing = await this.getById(tenantId, quoteId);
      if (!existing) throw new PersistenceError("not_found", "Quote not found.");
      if (existing.status !== "draft") {
        throw new PersistenceError("invalid_transition", "Only draft quotations can be edited.");
      }
      const updated: Quote = {
        ...existing,
        ...input,
        id: existing.id,
        tenantId: existing.tenantId,
        quoteNumber: existing.quoteNumber,
        createdAt: existing.createdAt,
        updatedAt: nowIso()
      };
      await db.quotes.put(updated);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "entity_updated",
          entityId: quoteId,
          entityType: "quote",
          title: `Quotation updated: ${updated.quoteNumber}`
        });
      }
      return updated;
    },
    async duplicate(tenantId, quoteId) {
      const existing = await this.getById(tenantId, quoteId);
      if (!existing) throw new PersistenceError("not_found", "Quote not found.");
      const count = await db.quotes.where("tenantId").equals(tenantId).count();
      const timestamp = nowIso();
      const quote: Quote = {
        ...existing,
        id: createRecordId("quote"),
        quoteNumber: formatQuoteNumber(count + 1),
        status: "draft",
        ...DEFAULT_ARCHIVABLE,
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
    },
    async approve(tenantId, quoteId) {
      const existing = await this.getById(tenantId, quoteId);
      if (!existing) throw new PersistenceError("not_found", "Quote not found.");
      if (existing.status === "approved") return existing;
      if (existing.status === "rejected") {
        throw new PersistenceError("invalid_transition", "Rejected quotations cannot be approved.");
      }
      const updated = { ...existing, status: "approved" as const, updatedAt: nowIso() };
      await db.quotes.put(updated);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "quotation_approved",
          entityId: quoteId,
          entityType: "quote",
          title: `Quotation approved: ${existing.quoteNumber}`
        });
      }
      return updated;
    },
    async reject(tenantId, quoteId, reason) {
      const existing = await this.getById(tenantId, quoteId);
      if (!existing) throw new PersistenceError("not_found", "Quote not found.");
      if (existing.status === "approved") {
        throw new PersistenceError("invalid_transition", "Approved quotations cannot be rejected.");
      }
      const updated = {
        ...existing,
        notes: reason ? `${existing.notes}\nRejected: ${reason}`.trim() : existing.notes,
        status: "rejected" as const,
        updatedAt: nowIso()
      };
      await db.quotes.put(updated);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "quotation_rejected",
          entityId: quoteId,
          entityType: "quote",
          title: `Quotation rejected: ${existing.quoteNumber}`
        });
      }
      return updated;
    },
    async archive(tenantId, quoteId, input?: ArchiveInput) {
      const existing = await this.getById(tenantId, quoteId);
      if (!existing) throw new PersistenceError("not_found", "Quote not found.");
      const updated: Quote = {
        ...existing,
        ...createArchivePatch(input),
        updatedAt: nowIso()
      };
      await db.quotes.put(updated);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "entity_archived",
          entityId: quoteId,
          entityType: "quote",
          title: `Quotation archived: ${existing.quoteNumber}`
        });
      }
      return updated;
    },
    async restore(tenantId, quoteId) {
      const existing = await this.getById(tenantId, quoteId);
      if (!existing) throw new PersistenceError("not_found", "Quote not found.");
      const updated: Quote = {
        ...existing,
        ...createRestorePatch(),
        updatedAt: nowIso()
      };
      await db.quotes.put(updated);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "entity_restored",
          entityId: quoteId,
          entityType: "quote",
          title: `Quotation restored: ${existing.quoteNumber}`
        });
      }
      return updated;
    }
  };
}

export function createProductionOrderRepository(
  db: ForgeOSDatabase,
  quotes: QuoteRepository,
  customers: CustomerRepository,
  machines: import("../interfaces").MachineRepository,
  activities?: ActivityRepository
): ProductionOrderRepository {
  return {
    async list(tenantId, options?: ListOptions) {
      const rows = await db.productionOrders.where("tenantId").equals(tenantId).toArray();
      return filterByArchive(rows, options);
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
    async getByMachineId(tenantId, machineId) {
      const rows = await db.productionOrders.where("tenantId").equals(tenantId).toArray();
      return rows.filter((o) => o.machineId === machineId);
    },
    async createFromQuote(tenantId, quoteId) {
      const quote = await quotes.getById(tenantId, quoteId);
      if (!quote) throw new PersistenceError("missing_link", "Quote not found.");
      if (quote.status !== "approved") {
        throw new PersistenceError("invalid_transition", "Quote must be approved first.");
      }
      return this.create(tenantId, {
        customerId: quote.customerId,
        productId: quote.productId,
        productName: quote.productName,
        quantity: quote.quantity,
        quoteId
      });
    },
    async create(tenantId, input) {
      const existing = await this.getByQuoteId(tenantId, input.quoteId);
      if (existing && isActiveRecord(existing)) {
        throw new PersistenceError("duplicate", "Production order already exists for this quote.");
      }
      const quote = await quotes.getById(tenantId, input.quoteId);
      if (!quote) throw new PersistenceError("missing_link", "Quote not found.");
      if (quote.status !== "approved") {
        throw new PersistenceError("invalid_transition", "Quote must be approved first.");
      }
      const customer = input.customerId
        ? await customers.getById(tenantId, input.customerId)
        : quote.customerId
          ? await customers.getById(tenantId, quote.customerId)
          : null;
      let resolvedProductId = input.productId || quote.productId;
      let product = await db.products.get(resolvedProductId);
      if (!product || product.tenantId !== tenantId) {
        const demoProduct = demoProducts.find((row) => row.id === resolvedProductId);
        if (demoProduct) {
          const productRepo = createProductRepository(db);
          product = (await productRepo.getBySku(tenantId, demoProduct.sku)) ?? undefined;
          if (product) resolvedProductId = product.id;
        }
      } else {
        resolvedProductId = product.id;
      }
      const compatible = await machines.listForProduct(tenantId, resolvedProductId);
      const machine = compatible[0] ?? (await machines.list(tenantId))[0];
      if (!machine) {
        throw new PersistenceError("missing_link", "No compatible machine available.");
      }
      const count = await db.productionOrders.where("tenantId").equals(tenantId).count();
      const timestamp = nowIso();
      const order: ProductionOrder = {
        id: createRecordId("po"),
        tenantId,
        orderNumber: formatProductionOrderNumber(count + 1),
        quoteId: input.quoteId,
        customerId: customer?.id ?? quote.customerId,
        customerName: input.customerName ?? resolveCustomerName(customer),
        productId: resolvedProductId,
        productName: input.productName,
        quantity: input.quantity,
        completedQuantity: 0,
        rejectedQuantity: 0,
        status: "scheduled",
        scheduledDate: timestamp.slice(0, 10),
        plannedStart: null,
        plannedEnd: null,
        artworkStatus: "pending",
        screenStatus: "pending",
        machineId: machine.id,
        machineName: machine.name,
        progress: 0,
        operatorNotes: "Created from approved quotation.",
        ...DEFAULT_ARCHIVABLE,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      await db.productionOrders.put(order);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "production_order_created",
          entityId: order.id,
          entityType: "production_order",
          title: `Production order created: ${order.orderNumber}`,
          metadata: { quoteId: input.quoteId }
        });
      }
      return order;
    },
    async update(tenantId, orderId, input) {
      const existing = await this.getById(tenantId, orderId);
      if (!existing) {
        throw new PersistenceError("not_found", "Production order not found.");
      }
      const updated = { ...existing, ...input, updatedAt: nowIso() };
      await db.productionOrders.put(updated);
      if (activities && input.status && input.status !== existing.status) {
        await recordActivity(activities, tenantId, {
          action: "production_status_changed",
          entityId: orderId,
          entityType: "production_order",
          title: `Production status: ${existing.status} → ${input.status}`,
          metadata: { from: existing.status, to: input.status }
        });
      }
      return updated;
    },
    async assignMachine(tenantId, orderId, machineId, machineName) {
      const machine = await machines.getById(tenantId, machineId);
      if (!machine || !isActiveRecord(machine)) {
        throw new PersistenceError("invalid_transition", "Machine is archived or unavailable.");
      }
      const order = await this.update(tenantId, orderId, { machineId, machineName });
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "machine_assigned",
          entityId: orderId,
          entityType: "production_order",
          title: `Machine assigned: ${machineName}`,
          metadata: { machineId }
        });
      }
      return order;
    },
    async archive(tenantId, orderId, input?: ArchiveInput) {
      const existing = await this.getById(tenantId, orderId);
      if (!existing) throw new PersistenceError("not_found", "Production order not found.");
      const updated: ProductionOrder = {
        ...existing,
        ...createArchivePatch(input),
        updatedAt: nowIso()
      };
      await db.productionOrders.put(updated);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "entity_archived",
          entityId: orderId,
          entityType: "production_order",
          title: `Production order archived: ${existing.orderNumber}`
        });
      }
      return updated;
    },
    async restore(tenantId, orderId) {
      const existing = await this.getById(tenantId, orderId);
      if (!existing) throw new PersistenceError("not_found", "Production order not found.");
      const updated: ProductionOrder = {
        ...existing,
        ...createRestorePatch(),
        updatedAt: nowIso()
      };
      await db.productionOrders.put(updated);
      if (activities) {
        await recordActivity(activities, tenantId, {
          action: "entity_restored",
          entityId: orderId,
          entityType: "production_order",
          title: `Production order restored: ${existing.orderNumber}`
        });
      }
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
  return createOutreachCampaignRepository(db);
}

export function createActivityRepository(db: ForgeOSDatabase): ActivityRepository {
  return {
    async list(tenantId) {
      const events = await db.activities.where("tenantId").equals(tenantId).toArray();
      return events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    },
    async listForEntity(tenantId, entityType, entityId) {
      const events = await this.list(tenantId);
      return events.filter((e) => e.entityType === entityType && e.entityId === entityId);
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
  const productRows = await db.products.where("tenantId").equals(tenantId).toArray();
  await seedOperationsDefaults(db, tenantId, productRows);
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
    if (leadCount > 0 && profileCount > 0) {
      const expectedSeedLeadIds = leadOpsLeads
        .filter((lead) => lead.tenantId === tenantId)
        .map((lead) => lead.id);
      const expectedCampaignIds = leadOpsCampaigns
        .filter((campaign) => campaign.tenantId === tenantId)
        .map((campaign) => campaign.id);
      const [seedLeads, seedCampaigns] = await Promise.all([
        db.leads.bulkGet(expectedSeedLeadIds),
        db.campaigns.bulkGet(expectedCampaignIds)
      ]);
      const hasAllSeedLeads = seedLeads.every((lead) => lead?.tenantId === tenantId);
      const hasAllSeedCampaigns = seedCampaigns.every(
        (campaign) => campaign?.tenantId === tenantId
      );
      if (hasAllSeedLeads && hasAllSeedCampaigns) {
        const productRows = await db.products.where("tenantId").equals(tenantId).toArray();
        const machineCount = await db.machines.where("tenantId").equals(tenantId).count();
        if (machineCount === 0 && productRows.length > 0) {
          await seedOperationsDefaults(db, tenantId, productRows);
        }
        return false;
      }
    }
  }

  const timestamp = nowIso();

  const campaigns: Campaign[] = leadOpsCampaigns
    .filter((c) => c.tenantId === tenantId)
    .map((c) => campaignFromSeed(c, timestamp));

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
    db.products,
    db.machines,
    db.inventoryItems,
    db.stockMovements,
    db.customerContacts
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
      await db.machines.where("tenantId").equals(tenantId).delete();
      await db.inventoryItems.where("tenantId").equals(tenantId).delete();
      await db.stockMovements.where("tenantId").equals(tenantId).delete();
      await db.customerContacts.where("tenantId").equals(tenantId).delete();
    }

    await db.campaigns.bulkPut(campaigns);

    const existingSeedLeads = await db.leads.bulkGet(leads.map((lead) => lead.id));
    const existingSeedLeadIds = new Set(
      existingSeedLeads
        .filter((lead): lead is Lead => Boolean(lead && lead.tenantId === tenantId))
        .map((lead) => lead.id)
    );
    const missingSeedLeads = leads.filter((lead) => !existingSeedLeadIds.has(lead.id));
    if (missingSeedLeads.length > 0) {
      await db.leads.bulkPut(missingSeedLeads);
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

  const productRows = await db.products.where("tenantId").equals(tenantId).toArray();
  const machineCount = await db.machines.where("tenantId").equals(tenantId).count();
  if (machineCount === 0 && productRows.length > 0) {
    await seedOperationsDefaults(db, tenantId, productRows);
  }

  return true;
}

export async function resetDemoRecords(db: ForgeOSDatabase, tenantId: string): Promise<void> {
  const seedLeadIds = leadOpsLeads
    .filter((lead) => lead.tenantId === tenantId)
    .map((lead) => lead.id);
  const seedCampaignIds = leadOpsCampaigns
    .filter((campaign) => campaign.tenantId === tenantId)
    .map((campaign) => campaign.id);

  await db.transaction(
    "rw",
    [
      db.leads,
      db.leadContacts,
      db.customers,
      db.opportunities,
      db.quotes,
      db.productionOrders,
      db.outreachMessages,
      db.campaigns,
      db.campaignRecipients,
      db.activities,
      db.customizerSimulations
    ],
    async () => {
      const seedCustomers = await db.customers
        .where("tenantId")
        .equals(tenantId)
        .filter((customer) => Boolean(customer.leadId && seedLeadIds.includes(customer.leadId)))
        .toArray();
      const seedCustomerIds = seedCustomers.map((customer) => customer.id);

      const seedQuotes = await db.quotes
        .where("tenantId")
        .equals(tenantId)
        .filter(
          (quote) =>
            Boolean(quote.leadId && seedLeadIds.includes(quote.leadId)) ||
            Boolean(quote.customerId && seedCustomerIds.includes(quote.customerId))
        )
        .toArray();
      const seedQuoteIds = seedQuotes.map((quote) => quote.id);

      const seedProductionOrders = await db.productionOrders
        .where("tenantId")
        .equals(tenantId)
        .filter((order) => seedQuoteIds.includes(order.quoteId))
        .toArray();
      const seedProductionOrderIds = seedProductionOrders.map((order) => order.id);

      await Promise.all([
        db.outreachMessages.bulkDelete(seedLeadIds),
        db.leads.bulkDelete(seedLeadIds),
        db.leadContacts.where("tenantId").equals(tenantId).filter((contact) => seedLeadIds.includes(contact.leadId)).delete(),
        db.campaigns.bulkDelete(seedCampaignIds),
        db.campaignRecipients
          .where("tenantId")
          .equals(tenantId)
          .filter((recipient) => seedCampaignIds.includes(recipient.campaignId))
          .delete(),
        db.customers.bulkDelete(seedCustomerIds),
        db.opportunities
          .where("tenantId")
          .equals(tenantId)
          .filter((opportunity) => seedLeadIds.includes(opportunity.leadId))
          .delete(),
        db.quotes.bulkDelete(seedQuoteIds),
        db.productionOrders.bulkDelete(seedProductionOrderIds),
        db.customizerSimulations
          .where("tenantId")
          .equals(tenantId)
          .filter(
            (simulation) =>
              Boolean(simulation.leadId && seedLeadIds.includes(simulation.leadId)) ||
              Boolean(simulation.quoteId && seedQuoteIds.includes(simulation.quoteId))
          )
          .delete(),
        db.activities
          .where("tenantId")
          .equals(tenantId)
          .filter(
            (activity) =>
              seedLeadIds.includes(activity.entityId) ||
              seedCampaignIds.includes(activity.entityId) ||
              seedCustomerIds.includes(activity.entityId) ||
              seedQuoteIds.includes(activity.entityId) ||
              seedProductionOrderIds.includes(activity.entityId)
          )
          .delete()
      ]);
    }
  );

  await seedDatabase(db, tenantId, false);
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
      db.products,
      db.machines,
      db.inventoryItems,
      db.stockMovements,
      db.customerContacts,
      db.customizerSimulations,
      db.importBatches,
      db.importRows,
      db.leadContacts,
      db.campaignRecipients,
      db.emailSuppressions,
      db.outreachSendAttempts,
      db.outreachProviderEvents,
      db.outreachSendJobs,
      db.outreachSendJobRecipients,
      db.outreachSendJobAttempts,
      db.outreachSendJobDailyUsage
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
      await db.machines.clear();
      await db.inventoryItems.clear();
      await db.stockMovements.clear();
      await db.customerContacts.clear();
      await db.customizerSimulations.clear();
      await db.importBatches.clear();
      await db.importRows.clear();
      await db.leadContacts.clear();
      await db.campaignRecipients.clear();
      await db.emailSuppressions.clear();
      await db.outreachSendAttempts.clear();
      await db.outreachProviderEvents.clear();
      await db.outreachSendJobs.clear();
      await db.outreachSendJobRecipients.clear();
      await db.outreachSendJobAttempts.clear();
      await db.outreachSendJobDailyUsage.clear();
    }
  );
}

async function importBackupToDb(db: ForgeOSDatabase, backup: ForgeOSBackup): Promise<void> {
  const { tables, localAssets, tenantId } = backup;
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
      db.products,
      db.machines,
      db.inventoryItems,
      db.stockMovements,
      db.customizerSimulations,
      db.importBatches,
      db.importRows,
      db.leadContacts,
      db.campaignRecipients,
      db.emailSuppressions,
      db.outreachSendAttempts,
      db.outreachProviderEvents,
      db.outreachSendJobs,
      db.outreachSendJobRecipients,
      db.outreachSendJobAttempts,
      db.outreachSendJobDailyUsage
    ],
    async () => {
      await db.leads.bulkPut(tables.leads);
      await db.customers.bulkPut(tables.customers);
      await db.opportunities.bulkPut(tables.opportunities);
      await db.quotes.bulkPut(tables.quotes);
      await db.productionOrders.bulkPut(tables.productionOrders ?? []);
      await db.outreachMessages.bulkPut(tables.outreachMessages);
      await db.campaigns.bulkPut(tables.campaigns);
      await db.activities.bulkPut(tables.activities);
      await db.companyProfiles.bulkPut(tables.companyProfiles);
      await db.userProfiles.bulkPut(tables.userProfiles);
      await db.senderIdentities.bulkPut(tables.senderIdentities);
      await db.products.bulkPut(tables.products);
      await db.importBatches.bulkPut(tables.importBatches ?? []);
      await db.importRows.bulkPut(tables.importRows ?? []);
      await db.leadContacts.bulkPut(tables.leadContacts ?? []);
      await db.campaignRecipients.bulkPut(tables.campaignRecipients ?? []);
      await db.emailSuppressions.bulkPut(tables.emailSuppressions ?? []);
      await db.outreachSendAttempts.bulkPut(tables.outreachSendAttempts ?? []);
      await db.outreachProviderEvents.bulkPut(tables.outreachProviderEvents ?? []);
      await db.outreachSendJobs.bulkPut(tables.outreachSendJobs ?? []);
      await db.outreachSendJobRecipients.bulkPut(tables.outreachSendJobRecipients ?? []);
      await db.outreachSendJobAttempts.bulkPut(tables.outreachSendJobAttempts ?? []);
      await db.outreachSendJobDailyUsage.bulkPut(tables.outreachSendJobDailyUsage ?? []);
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
      await db.meta.put({ key: "seedVersion", value: String(SEED_VERSION) });
    }
  );
  const productRows = await db.products.where("tenantId").equals(tenantId).toArray();
  const machineCount = await db.machines.where("tenantId").equals(tenantId).count();
  if (machineCount === 0 && productRows.length > 0) {
    await seedOperationsDefaults(db, tenantId, productRows);
  }
}

export function createLocalRepositoryBundle(db: ForgeOSDatabase) {
  const meta = createMetaRepository(db);
  const activities = createActivityRepository(db);
  const leads = createLeadRepository(db, activities);
  const customers = createCustomerRepository(db, leads, activities);
  const customerContacts = createCustomerContactRepository(db);
  const opportunities = createOpportunityRepository(db, leads);
  const quotes = createQuoteRepository(db, activities);
  const machines = createMachineRepository(db, activities);
  const productionOrders = createProductionOrderRepository(
    db,
    quotes,
    customers,
    machines,
    activities
  );
  const inventory = createInventoryRepository(db, activities);
  const outreachMessages = createOutreachMessageRepository(db);
  const campaigns = createCampaignRepository(db);
  const companyProfiles = createCompanyProfileRepository(db);
  const userProfiles = createUserProfileRepository(db);
  const senderIdentities = createSenderIdentityRepository(db);
  const localAssets = createLocalAssetRepository(db);
  const products = createProductRepository(db, activities);
  const customizerSimulations = createCustomizerSimulationRepository(db, activities);
  const importBatches = createImportBatchRepository(db);
  const importRows = createImportRowRepository(db);
  const leadContacts = createLeadContactRepository(db);
  const emailSuppressions = createEmailSuppressionRepository(db);
  const campaignRecipients = createCampaignRecipientRepository(db);
  const outreachSendAttempts = createOutreachSendAttemptRepository(db);
  const outreachProviderEvents = createOutreachProviderEventRepository(db);
  const outreachSendJobs = createOutreachSendJobRepository(db);
  const outreachSendJobRecipients = createOutreachSendJobRecipientRepository(db);
  const outreachSendJobAttempts = createOutreachSendJobAttemptRepository(db);
  const outreachSendJobDailyUsage = createOutreachSendJobDailyUsageRepository(db);

  return {
    meta,
    leads,
    customers,
    customerContacts,
    opportunities,
    quotes,
    productionOrders,
    machines,
    inventory,
    outreachMessages,
    campaigns,
    campaignRecipients,
    activities,
    companyProfiles,
    userProfiles,
    senderIdentities,
    localAssets,
    products,
    customizerSimulations,
    importBatches,
    importRows,
    leadContacts,
    emailSuppressions,
    outreachSendAttempts,
    outreachProviderEvents,
    outreachSendJobs,
    outreachSendJobRecipients,
    outreachSendJobAttempts,
    outreachSendJobDailyUsage,
    async reset() {
      await resetDatabase(db);
    },
    async resetDemoData(tenantId: string) {
      await resetDemoRecords(db, tenantId);
    },
    async seed(tenantId: string) {
      await seedDatabase(db, tenantId, true);
    },
    async importBackupData(backup: ForgeOSBackup) {
      await importBackupToDb(db, backup);
    }
  };
}
