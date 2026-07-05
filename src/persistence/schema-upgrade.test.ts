import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_TENANT_ID, SCHEMA_VERSION } from "@/domain/constants";
import { getDatabase, resetDatabaseInstance } from "@/persistence/db";
import { destroyDatabaseForTests } from "@/persistence/registry";
import { createLocalRepositoryBundle, seedDatabase } from "@/persistence/indexeddb/repositories";

const TEST_DB = "forgeos:test:schema-upgrade";

describe("IndexedDB schema upgrade", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
  });

  afterEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
  });

  it("opens at schema version 13 with import mapping and recipient greeting fields", async () => {
    const db = getDatabase(TEST_DB);
    expect(db.verno).toBe(SCHEMA_VERSION);
    const schemaMeta = await db.meta.get("schemaVersion");
    expect(schemaMeta?.value).toBeUndefined();
  });

  it("preserves user-created records across reopen and demo seed", async () => {
    const db = getDatabase(TEST_DB);
    const repos = createLocalRepositoryBundle(db);
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
    const userLead = await repos.leads.create(DEFAULT_TENANT_ID, {
      companyName: "Upgrade Survivor Co",
      contactName: "Survivor",
      email: "survivor.upgrade@example.invalid"
    });
    const survivorId = userLead.id;
    await db.close();
    resetDatabaseInstance();
    const reopened = getDatabase(TEST_DB);
    await reopened.open();
    const restored = await reopened.leads.get(survivorId);
    expect(restored?.companyName).toBe("Upgrade Survivor Co");
    expect(reopened.verno).toBe(SCHEMA_VERSION);
  });

  it("retains user-created leads readable after open", async () => {
    const db = getDatabase(TEST_DB);
    const repos = createLocalRepositoryBundle(db);
    const lead = await repos.leads.create(DEFAULT_TENANT_ID, {
      companyName: "Legacy Shape Co",
      contactName: "Legacy",
      email: "legacy@example.invalid"
    });
    const stored = await db.leads.get(lead.id);
    expect(stored?.companyName).toBe("Legacy Shape Co");
  });
});
