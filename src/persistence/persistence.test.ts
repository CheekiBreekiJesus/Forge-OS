import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import {
  approveDemoQuotation,
  convertDemoLead,
  createDemoLead,
  createDemoProductionOrder,
  createDemoQuotation,
  qualifyDemoLead
} from "@/application/demo-workflow-service";
import { destroyDatabaseForTests } from "@/persistence/registry";
import { getDatabase } from "@/persistence/db";
import { createLocalRepositoryBundle, seedDatabase } from "@/persistence/indexeddb/repositories";
import { PersistenceError } from "@/persistence/interfaces";

const TEST_DB = "forgeos:test:persistence";

function getTestRepos() {
  const db = getDatabase(TEST_DB);
  return createLocalRepositoryBundle(db);
}

describe("local persistence", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
  });

  it("seeds idempotently without duplicating leads", async () => {
    const db = getDatabase(TEST_DB);
    const before = await db.leads.where("tenantId").equals(DEFAULT_TENANT_ID).count();
    const seededAgain = await seedDatabase(db, DEFAULT_TENANT_ID, false);
    const after = await db.leads.where("tenantId").equals(DEFAULT_TENANT_ID).count();
    expect(seededAgain).toBe(false);
    expect(after).toBe(before);
  });

  it("isolates tenants on lead list", async () => {
    const repos = getTestRepos();
    const leads = await repos.leads.list(DEFAULT_TENANT_ID);
    expect(leads.every((l) => l.tenantId === DEFAULT_TENANT_ID)).toBe(true);
    expect(leads.some((l) => l.tenantId === "tenant_other_demo")).toBe(false);
  });

  it("creates and retrieves a lead", async () => {
    const repos = getTestRepos();
    const lead = await repos.leads.create(DEFAULT_TENANT_ID, {
      companyName: "Test Co",
      contactName: "Test User",
      email: `test.${Date.now()}@example.invalid`
    });
    const found = await repos.leads.getById(DEFAULT_TENANT_ID, lead.id);
    expect(found?.companyName).toBe("Test Co");
  });

  it("prevents duplicate leads by email", async () => {
    const repos = getTestRepos();
    const email = `dup.${Date.now()}@example.invalid`;
    await repos.leads.create(DEFAULT_TENANT_ID, {
      companyName: "A",
      contactName: "A",
      email
    });
    await expect(
      repos.leads.create(DEFAULT_TENANT_ID, {
        companyName: "B",
        contactName: "B",
        email
      })
    ).rejects.toBeInstanceOf(PersistenceError);
  });

  it("qualifies a lead via demo service", async () => {
    const repos = getTestRepos();
    const created = await createDemoLead(repos, DEFAULT_TENANT_ID, {
      companyName: "Qualify Co",
      contactName: "Qual",
      email: `qualify.${Date.now()}@example.invalid`,
      productId: "prod_pp_cup_330",
      quantity: 1000
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const leadId = String(created.data.leadId);
    const qualified = await qualifyDemoLead(repos, DEFAULT_TENANT_ID, leadId);
    expect(qualified.ok).toBe(true);
    const lead = await repos.leads.getById(DEFAULT_TENANT_ID, leadId);
    expect(lead?.crmStatus).toBe("qualified");
  });

  it("converts lead to customer and opportunity", async () => {
    const repos = getTestRepos();
    const created = await createDemoLead(repos, DEFAULT_TENANT_ID, {
      companyName: "Convert Co",
      contactName: "Conv",
      email: `convert.${Date.now()}@example.invalid`,
      productId: "prod_pp_cup_330",
      quantity: 5000
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const leadId = String(created.data.leadId);
    await qualifyDemoLead(repos, DEFAULT_TENANT_ID, leadId);
    const converted = await convertDemoLead(repos, DEFAULT_TENANT_ID, leadId);
    expect(converted.ok).toBe(true);
    const customer = await repos.customers.getByLeadId(DEFAULT_TENANT_ID, leadId);
    const opportunity = await repos.opportunities.getByLeadId(DEFAULT_TENANT_ID, leadId);
    expect(customer).not.toBeNull();
    expect(opportunity).not.toBeNull();
  });

  it("creates quote and production order workflow", async () => {
    const repos = getTestRepos();
    const created = await createDemoLead(repos, DEFAULT_TENANT_ID, {
      companyName: "Quote Co",
      contactName: "Q",
      email: `quote.${Date.now()}@example.invalid`,
      productId: "prod_pp_cup_330",
      quantity: 8000
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
      quantity: 8000,
      printColorCount: 2
    });
    expect(quoteResult.ok).toBe(true);
    if (!quoteResult.ok) return;
    const quoteId = String(quoteResult.data.quoteId);
    await approveDemoQuotation(repos, DEFAULT_TENANT_ID, quoteId);
    const poResult = await createDemoProductionOrder(repos, DEFAULT_TENANT_ID, quoteId);
    expect(poResult.ok).toBe(true);
    const order = await repos.productionOrders.getByQuoteId(DEFAULT_TENANT_ID, quoteId);
    expect(order).not.toBeNull();
  });

  it("appends activity events", async () => {
    const repos = getTestRepos();
    await repos.activities.append(DEFAULT_TENANT_ID, {
      entityType: "lead",
      entityId: "test",
      action: "lead_created",
      title: "Test event"
    });
    const events = await repos.activities.list(DEFAULT_TENANT_ID);
    expect(events.some((e) => e.title === "Test event")).toBe(true);
  });

  it("resets database", async () => {
    const repos = getTestRepos();
    await repos.leads.create(DEFAULT_TENANT_ID, {
      companyName: "Reset Co",
      contactName: "R",
      email: `reset.${Date.now()}@example.invalid`
    });
    await repos.reset();
    const count = await getDatabase(TEST_DB).leads.count();
    expect(count).toBe(0);
  });

  it("resets demo records without deleting operational leads or drafts", async () => {
    const repos = getTestRepos();
    const db = getDatabase(TEST_DB);
    const operationalLead = await repos.leads.create(DEFAULT_TENANT_ID, {
      companyName: "Imported Pilot Co",
      contactName: "Pilot User",
      email: `pilot.${Date.now()}@example.invalid`,
      source: "csv-import",
      sourceDatabase: "Pilot import"
    });
    await repos.outreachMessages.saveDraft(DEFAULT_TENANT_ID, operationalLead.id, {
      campaignId: "campaign_001",
      id: operationalLead.id,
      leadId: operationalLead.id,
      message: {
        approved: true,
        body: "Pilot draft body",
        edited: false,
        generationMethod: "deterministic-template",
        subject: "Pilot draft"
      },
      metricsUpdated: false,
      providerState: "approved",
      queuedAt: null,
      sentAt: null,
      tenantId: DEFAULT_TENANT_ID,
      updatedAt: new Date().toISOString()
    });

    await db.leads.delete("leadops_001");
    await repos.resetDemoData(DEFAULT_TENANT_ID);

    const preservedLead = await repos.leads.getById(DEFAULT_TENANT_ID, operationalLead.id);
    const preservedDraft = await repos.outreachMessages.getForLead(
      DEFAULT_TENANT_ID,
      operationalLead.id
    );
    const restoredSeedLead = await repos.leads.getById(DEFAULT_TENANT_ID, "leadops_001");

    expect(preservedLead?.companyName).toBe("Imported Pilot Co");
    expect(preservedDraft?.message?.subject).toBe("Pilot draft");
    expect(restoredSeedLead?.companyName).toBeTruthy();
  });

  it("persists outreach workflow draft", async () => {
    const repos = getTestRepos();
    const lead = await repos.leads.create(DEFAULT_TENANT_ID, {
      companyName: "Outreach Co",
      contactName: "O",
      email: `outreach.${Date.now()}@example.invalid`
    });
    await repos.outreachMessages.saveDraft(DEFAULT_TENANT_ID, lead.id, {
      id: lead.id,
      tenantId: DEFAULT_TENANT_ID,
      leadId: lead.id,
      campaignId: "campaign_001",
      message: {
        subject: "Test",
        body: "Body",
        generationMethod: "deterministic-template",
        approved: true,
        edited: false
      },
      providerState: "approved",
      queuedAt: null,
      sentAt: null,
      metricsUpdated: false,
      updatedAt: new Date().toISOString()
    });
    const saved = await repos.outreachMessages.getForLead(DEFAULT_TENANT_ID, lead.id);
    expect(saved?.message?.subject).toBe("Test");
    expect(saved?.providerState).toBe("approved");
  });
});
