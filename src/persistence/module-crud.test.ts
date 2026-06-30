import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import { approveDemoQuotation, createDemoProductionOrder, createDemoQuotation, qualifyDemoLead, convertDemoLead, createDemoLead } from "@/application/demo-workflow-service";
import { destroyDatabaseForTests } from "@/persistence/registry";
import { getDatabase } from "@/persistence/db";
import { createLocalRepositoryBundle, seedDatabase } from "@/persistence/indexeddb/repositories";
import { isActiveRecord } from "@/persistence/archive-utils";

const TEST_DB = "forgeos:test:module-crud";

function getTestRepos() {
  return createLocalRepositoryBundle(getDatabase(TEST_DB));
}

describe("module CRUD persistence", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
  });

  it("archives and restores a customer", async () => {
    const repos = getTestRepos();
    const customer = await repos.customers.create(DEFAULT_TENANT_ID, {
      legalName: "Archive Co",
      companyName: "Archive Co",
      contactName: "A",
      email: `archive.${Date.now()}@example.invalid`
    });
    const archived = await repos.customers.archive(DEFAULT_TENANT_ID, customer.id);
    expect(isActiveRecord(archived)).toBe(false);
    const hidden = await repos.customers.list(DEFAULT_TENANT_ID);
    expect(hidden.some((c) => c.id === customer.id)).toBe(false);
    const restored = await repos.customers.restore(DEFAULT_TENANT_ID, customer.id);
    expect(isActiveRecord(restored)).toBe(true);
  });

  it("records inventory stock movements", async () => {
    const repos = getTestRepos();
    const item = await repos.inventory.create(DEFAULT_TENANT_ID, {
      active: true,
      archivedAt: null,
      archivedBy: null,
      archiveReason: null,
      sku: `SKU-${Date.now()}`,
      name: "Test stock",
      category: "materials",
      unit: "units",
      productId: null,
      reorderLevel: 10,
      warehouseLocation: "A1",
      batch: null,
      notes: ""
    });
    const { item: updated, movement } = await repos.inventory.recordReceipt(DEFAULT_TENANT_ID, item.id, {
      quantity: 50,
      reason: "Test receipt"
    });
    expect(updated.currentQuantity).toBe(50);
    expect(movement.balanceAfter).toBe(50);
    const movements = await repos.inventory.listMovements(DEFAULT_TENANT_ID, item.id);
    expect(movements).toHaveLength(1);
  });

  it("approves quotation for production workflow", async () => {
    const repos = getTestRepos();
    const created = await createDemoLead(repos, DEFAULT_TENANT_ID, {
      companyName: "Quote Flow Co",
      contactName: "Q",
      email: `qflow.${Date.now()}@example.invalid`,
      productId: "prod_pp_cup_330",
      quantity: 2000
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const leadId = String(created.data.leadId);
    await qualifyDemoLead(repos, DEFAULT_TENANT_ID, leadId);
    await convertDemoLead(repos, DEFAULT_TENANT_ID, leadId);
    const customer = await repos.customers.getByLeadId(DEFAULT_TENANT_ID, leadId);
    const opportunity = await repos.opportunities.getByLeadId(DEFAULT_TENANT_ID, leadId);
    const quoteResult = await createDemoQuotation(repos, DEFAULT_TENANT_ID, {
      leadId,
      customerId: customer?.id ?? null,
      opportunityId: opportunity?.id ?? null,
      productId: "prod_pp_cup_330",
      quantity: 2000,
      printColorCount: 1
    });
    expect(quoteResult.ok).toBe(true);
    if (!quoteResult.ok) return;
    const quoteId = String(quoteResult.data.quoteId);
    const approved = await approveDemoQuotation(repos, DEFAULT_TENANT_ID, quoteId);
    expect(approved.ok).toBe(true);
    const quote = await repos.quotes.getById(DEFAULT_TENANT_ID, quoteId);
    expect(quote?.status).toBe("approved");
  });

  it("assigns machine to production order", async () => {
    const repos = getTestRepos();
    const machines = await repos.machines.list(DEFAULT_TENANT_ID);
    expect(machines.length).toBeGreaterThan(0);
    const machine = machines[0]!;

    const created = await createDemoLead(repos, DEFAULT_TENANT_ID, {
      companyName: "Machine Assign Co",
      contactName: "M",
      email: `machine.${Date.now()}@example.invalid`,
      productId: "prod_pp_cup_330",
      quantity: 1500
    });
    if (!created.ok) return;
    const leadId = String(created.data.leadId);
    await qualifyDemoLead(repos, DEFAULT_TENANT_ID, leadId);
    await convertDemoLead(repos, DEFAULT_TENANT_ID, leadId);
    const customer = await repos.customers.getByLeadId(DEFAULT_TENANT_ID, leadId);
    const opportunity = await repos.opportunities.getByLeadId(DEFAULT_TENANT_ID, leadId);
    const quoteResult = await createDemoQuotation(repos, DEFAULT_TENANT_ID, {
      leadId,
      customerId: customer?.id ?? null,
      opportunityId: opportunity?.id ?? null,
      productId: "prod_pp_cup_330",
      quantity: 1500,
      printColorCount: 1
    });
    if (!quoteResult.ok) return;
    const quoteId = String(quoteResult.data.quoteId);
    await approveDemoQuotation(repos, DEFAULT_TENANT_ID, quoteId);
    const poResult = await createDemoProductionOrder(repos, DEFAULT_TENANT_ID, quoteId);
    expect(poResult.ok).toBe(true);
    if (!poResult.ok) return;
    const orderId = String(poResult.data.productionOrderId);
    const assigned = await repos.productionOrders.assignMachine(
      DEFAULT_TENANT_ID,
      orderId,
      machine.id,
      machine.name
    );
    expect(assigned.machineId).toBe(machine.id);
    expect(assigned.machineName).toBe(machine.name);
  });
});
