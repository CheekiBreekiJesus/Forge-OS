import "fake-indexeddb/auto";
import { describe, expect, it, beforeEach } from "vitest";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import {
  buildImportPreview,
  confirmLeadImport
} from "@/application/lead-import-service";
import { getDatabase } from "@/persistence/db";
import { destroyDatabaseForTests } from "@/persistence/registry";
import { createLocalRepositoryBundle, seedDatabase } from "@/persistence/indexeddb/repositories";

const TEST_DB = "forgeos:test:lead-import";

function csvFile(content: string, name = "synthetic-leads.csv"): File {
  return new File([content], name, { type: "text/csv" });
}

describe("lead import integration", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
  });

  it("imports synthetic CSV, persists data, and blocks duplicate contacts on re-import", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    const csv = [
      "company,contact,email,region,industry",
      "Synthetic Import Co,Import User,import.user@example.invalid,Lisbon,Hospitality",
      "No Email Org,, ,Porto,Events",
      "Dup Co,A,dup@example.invalid,Coimbra,Events",
      "Dup Co,B,dup@example.invalid,Faro,Events",
      "Bad Row,,not-an-email,Lisbon,Hospitality"
    ].join("\n");

    const preview = await buildImportPreview(
      repos,
      DEFAULT_TENANT_ID,
      csvFile(csv)
    );
    expect(preview.counts.validRows).toBeGreaterThan(0);
    expect(preview.counts.invalidRows).toBeGreaterThan(0);
    expect(preview.counts.duplicateRows).toBeGreaterThan(0);

    const firstImport = await confirmLeadImport(repos, DEFAULT_TENANT_ID, preview.batchId, {
      allowRepeatImport: true
    });
    expect(firstImport.importedOrganizations).toBeGreaterThan(0);

    const leadsAfter = await repos.leads.list(DEFAULT_TENANT_ID);
    expect(leadsAfter.some((lead) => lead.companyName === "Synthetic Import Co")).toBe(true);
    expect(leadsAfter.some((lead) => lead.companyName === "No Email Org")).toBe(true);

    const contactsAfter = await repos.leadContacts.list(DEFAULT_TENANT_ID);
    expect(contactsAfter.some((contact) => contact.email === "import.user@example.invalid")).toBe(
      true
    );

    const secondPreview = await buildImportPreview(
      repos,
      DEFAULT_TENANT_ID,
      csvFile(csv)
    );
    const secondImport = await confirmLeadImport(repos, DEFAULT_TENANT_ID, secondPreview.batchId, {
      allowRepeatImport: true
    });
    expect(secondImport.importedContacts).toBe(0);

    const contactsFinal = await repos.leadContacts.list(DEFAULT_TENANT_ID);
    const dupContacts = contactsFinal.filter((contact) => contact.email === "import.user@example.invalid");
    expect(dupContacts).toHaveLength(1);
  });

  it("enforces tenant isolation for import batches", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    const preview = await buildImportPreview(
      repos,
      DEFAULT_TENANT_ID,
      csvFile("company,email,region,industry\nTenant A,a@example.invalid,Lisbon,Hospitality")
    );
    const foreign = await repos.importBatches.getById("tenant_other", preview.batchId);
    expect(foreign).toBeNull();
  });
});
