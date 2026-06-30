import type { LocalRepositoryBundle } from "@/persistence/interfaces";
import type { CreateLeadInput } from "@/domain/types";
import { demoProducts } from "@/demo/seed";
import { calculatePersonalizedCupQuote } from "@/demo/workflow";
import { PersistenceError } from "@/persistence/interfaces";

export type DemoWorkflowContext = {
  leadId: string | null;
  customerId: string | null;
  opportunityId: string | null;
  quoteId: string | null;
  productionOrderId: string | null;
};

export type DemoActionResult =
  | { ok: true; data: Record<string, string | number | boolean | null> }
  | { ok: false; code: string; message: string };

const actionLocks = new Set<string>();

function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (actionLocks.has(key)) {
    return Promise.reject(
      new PersistenceError("duplicate", "Action already in progress.")
    );
  }
  actionLocks.add(key);
  return fn().finally(() => {
    actionLocks.delete(key);
  });
}

export async function createDemoLead(
  repos: LocalRepositoryBundle,
  tenantId: string,
  input: {
    companyName: string;
    contactName: string;
    email: string;
    productId: string;
    quantity: number;
    notes?: string;
  }
): Promise<DemoActionResult> {
  return withLock("create-lead", async () => {
    try {
      const lead = await repos.leads.create(tenantId, {
        companyName: input.companyName,
        contactName: input.contactName,
        email: input.email,
        requestedProductId: input.productId,
        quantity: input.quantity,
        notes: input.notes,
        source: "demo",
        sourceDatabase: "Demo Workflow",
        industry: "Hospitality",
        location: "Portugal"
      } as CreateLeadInput);

      await repos.activities.append(tenantId, {
        entityType: "lead",
        entityId: lead.id,
        action: "lead_created",
        title: `Lead created: ${lead.companyName}`,
        metadata: { companyName: lead.companyName }
      });

      return {
        ok: true,
        data: {
          leadId: lead.id,
          companyName: lead.companyName,
          contactName: lead.contactName,
          email: lead.email,
          status: lead.crmStatus,
          createdAt: lead.createdAt
        }
      };
    } catch (error) {
      return toErrorResult(error);
    }
  });
}

export async function qualifyDemoLead(
  repos: LocalRepositoryBundle,
  tenantId: string,
  leadId: string
): Promise<DemoActionResult> {
  return withLock(`qualify-${leadId}`, async () => {
    try {
      const existing = await repos.leads.getById(tenantId, leadId);
      if (!existing) {
        throw new PersistenceError("not_found", "Lead not found.");
      }
      const previousStatus = existing.crmStatus;
      const lead = await repos.leads.update(tenantId, leadId, {
        crmStatus: "qualified",
        outreachStatus: "ready",
        quality: "high"
      });

      await repos.activities.append(tenantId, {
        entityType: "lead",
        entityId: lead.id,
        action: "lead_qualified",
        title: `Lead qualified: ${lead.companyName}`,
        metadata: { previousStatus, newStatus: lead.crmStatus, qualityScore: 85 }
      });

      return {
        ok: true,
        data: {
          previousStatus,
          newStatus: lead.crmStatus,
          qualityScore: 85,
          recommendedAction: "outreach"
        }
      };
    } catch (error) {
      return toErrorResult(error);
    }
  });
}

export async function convertDemoLead(
  repos: LocalRepositoryBundle,
  tenantId: string,
  leadId: string
): Promise<DemoActionResult> {
  return withLock(`convert-${leadId}`, async () => {
    try {
      const customer = await repos.customers.createFromLead(tenantId, leadId);
      const opportunity = await repos.opportunities.createFromLead(
        tenantId,
        leadId,
        customer.id
      );

      await repos.activities.append(tenantId, {
        entityType: "customer",
        entityId: customer.id,
        action: "customer_created",
        title: `Customer created: ${customer.companyName}`,
        metadata: { leadId }
      });
      await repos.activities.append(tenantId, {
        entityType: "opportunity",
        entityId: opportunity.id,
        action: "opportunity_created",
        title: `Opportunity created: ${opportunity.title}`,
        metadata: { leadId, customerId: customer.id }
      });

      return {
        ok: true,
        data: {
          customerId: customer.id,
          opportunityId: opportunity.id,
          company: customer.companyName,
          opportunityStage: opportunity.stage
        }
      };
    } catch (error) {
      return toErrorResult(error);
    }
  });
}

export async function createDemoQuotation(
  repos: LocalRepositoryBundle,
  tenantId: string,
  input: {
    leadId: string;
    customerId: string | null;
    opportunityId: string | null;
    productId: string;
    quantity: number;
    printColorCount: number;
  }
): Promise<DemoActionResult> {
  return withLock(`quote-${input.leadId}`, async () => {
    try {
      const existing = await repos.quotes.getByLeadId(tenantId, input.leadId);
      if (existing) {
        throw new PersistenceError("duplicate", "Quotation already exists for this lead.");
      }

      const demoProduct =
        demoProducts.find((p) => p.id === input.productId) ?? demoProducts[0];
      const dbProduct = await repos.products.getBySku(tenantId, demoProduct.sku);
      if (!dbProduct) {
        throw new PersistenceError(
          "missing_link",
          "Product catalog is not ready. Reload and try again."
        );
      }
      const resolvedProductId = dbProduct.id;
      const breakdown = calculatePersonalizedCupQuote({
        printColorCount: input.printColorCount,
        product: demoProduct,
        quantity: input.quantity
      });

      const quote = await repos.quotes.create(tenantId, {
        leadId: input.leadId,
        customerId: input.customerId,
        opportunityId: input.opportunityId,
        productId: resolvedProductId,
        productName: dbProduct?.name ?? demoProduct.name,
        quantity: input.quantity,
        printColorCount: input.printColorCount,
        subtotal: breakdown.subtotal,
        vat: breakdown.vat,
        total: breakdown.total,
        setupCost: breakdown.setupCost,
        unitPrice: dbProduct?.basePrice ?? demoProduct.basePrice
      });

      await repos.leads.update(tenantId, input.leadId, { crmStatus: "quoted" });

      await repos.activities.append(tenantId, {
        entityType: "quote",
        entityId: quote.id,
        action: "quotation_created",
        title: `Quotation ${quote.quoteNumber} created`,
        metadata: {
          quoteNumber: quote.quoteNumber,
          total: quote.total
        }
      });

      return {
        ok: true,
        data: {
          quoteId: quote.id,
          quotationNumber: quote.quoteNumber,
          product: quote.productName,
          quantity: quote.quantity,
          setupCost: breakdown.setupCost,
          unitPrice: dbProduct?.basePrice ?? demoProduct.basePrice,
          total: quote.total
        }
      };
    } catch (error) {
      return toErrorResult(error);
    }
  });
}

export async function approveDemoQuotation(
  repos: LocalRepositoryBundle,
  tenantId: string,
  quoteId: string
): Promise<DemoActionResult> {
  return withLock(`approve-quote-${quoteId}`, async () => {
    try {
      const quote = await repos.quotes.updateStatus(tenantId, quoteId, "approved");

      await repos.activities.append(tenantId, {
        entityType: "quote",
        entityId: quote.id,
        action: "quotation_approved",
        title: `Quotation ${quote.quoteNumber} approved`,
        metadata: { quoteNumber: quote.quoteNumber }
      });

      return {
        ok: true,
        data: {
          quoteId: quote.id,
          quotationNumber: quote.quoteNumber,
          status: quote.status
        }
      };
    } catch (error) {
      return toErrorResult(error);
    }
  });
}

export async function createDemoProductionOrder(
  repos: LocalRepositoryBundle,
  tenantId: string,
  quoteId: string
): Promise<DemoActionResult> {
  return withLock(`po-${quoteId}`, async () => {
    try {
      const order = await repos.productionOrders.createFromQuote(tenantId, quoteId);

      await repos.activities.append(tenantId, {
        entityType: "production_order",
        entityId: order.id,
        action: "production_order_created",
        title: `Production order ${order.orderNumber} created`,
        metadata: { orderNumber: order.orderNumber }
      });

      return {
        ok: true,
        data: {
          productionOrderId: order.id,
          orderNumber: order.orderNumber,
          machine: order.machineName,
          plannedQuantity: order.quantity,
          status: order.status
        }
      };
    } catch (error) {
      return toErrorResult(error);
    }
  });
}

export async function assignDemoMachine(
  repos: LocalRepositoryBundle,
  tenantId: string,
  orderId: string,
  machineId: string,
  machineName: string
): Promise<DemoActionResult> {
  return withLock(`machine-${orderId}`, async () => {
    try {
      const order = await repos.productionOrders.update(tenantId, orderId, {
        machineId,
        machineName
      });

      await repos.activities.append(tenantId, {
        entityType: "production_order",
        entityId: order.id,
        action: "machine_assigned",
        title: `Machine assigned: ${machineName}`,
        metadata: { machineId, machineName }
      });

      return {
        ok: true,
        data: {
          orderId: order.id,
          machine: machineName
        }
      };
    } catch (error) {
      return toErrorResult(error);
    }
  });
}

export async function logDemoProduction(
  repos: LocalRepositoryBundle,
  tenantId: string,
  orderId: string,
  progress: number
): Promise<DemoActionResult> {
  return withLock(`log-${orderId}`, async () => {
    try {
      const order = await repos.productionOrders.update(tenantId, orderId, {
        progress,
        status: progress >= 100 ? "completed" : "in-progress",
        artworkStatus: "approved",
        screenStatus: "ready"
      });

      await repos.activities.append(tenantId, {
        entityType: "production_order",
        entityId: order.id,
        action: "production_logged",
        title: `Production progress: ${progress}%`,
        metadata: { progress }
      });

      return {
        ok: true,
        data: {
          orderId: order.id,
          progress: order.progress,
          status: order.status
        }
      };
    } catch (error) {
      return toErrorResult(error);
    }
  });
}

export async function reserveDemoInventory(
  repos: LocalRepositoryBundle,
  tenantId: string,
  orderId: string
): Promise<DemoActionResult> {
  return withLock(`inventory-${orderId}`, async () => {
    try {
      const order = await repos.productionOrders.getById(tenantId, orderId);
      if (!order) {
        throw new PersistenceError("not_found", "Production order not found.");
      }

      await repos.activities.append(tenantId, {
        entityType: "production_order",
        entityId: order.id,
        action: "inventory_reserved",
        title: `Inventory reserved for ${order.orderNumber}`,
        metadata: { quantity: order.quantity }
      });

      return {
        ok: true,
        data: {
          orderId: order.id,
          quantity: order.quantity
        }
      };
    } catch (error) {
      return toErrorResult(error);
    }
  });
}

function toErrorResult(error: unknown): DemoActionResult {
  if (error instanceof PersistenceError) {
    return { ok: false, code: error.code, message: error.message };
  }
  return {
    ok: false,
    code: "unknown",
    message: error instanceof Error ? error.message : "Operation failed."
  };
}
