import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_TENANT_ID, SCHEMA_VERSION, SEED_VERSION } from "@/domain/constants";
import {
  getLocalDemoDatasetManifest,
  LOCAL_DEMO_CUSTOMER_IDS,
  LOCAL_DEMO_CUSTOMIZER_IDS,
  LOCAL_DEMO_SEED_LEAD_IDS
} from "@/demo/local-demo-dataset";
import {
  applyLocalDemoDataset,
  isLocalDemoDatasetComplete,
  resetLocalDemoDatasetRecords
} from "@/demo/local-demo-seed-service";
import {
  assertLocalDemoLifecycleAllowed,
  LocalDemoLifecycleError
} from "@/features/demo/local-demo-guard";
import {
  exportBackup,
  importBackup,
  isBackupSchemaCompatible,
  validateBackup,
  type ForgeOSBackup
} from "@/features/backup/service";
import { destroyDatabaseForTests } from "@/persistence/registry";
import { getDatabase } from "@/persistence/db";
import {
  createLocalRepositoryBundle,
  restoreDeterministicDemoState,
  seedDatabase
} from "@/persistence/indexeddb/repositories";

const TEST_DB = "forgeos:test:demo-lifecycle";
const OTHER_TENANT = "tenant_other_demo";

function getTestRepos() {
  return createLocalRepositoryBundle(getDatabase(TEST_DB));
}

describe("local demo data lifecycle", () => {
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    process.env = {
      ...originalEnv,
      FORGEOS_PERSISTENCE_MODE: "local",
      NEXT_PUBLIC_FORGEOS_PERSISTENCE_MODE: "local",
      NODE_ENV: "test"
    };
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("seeds demo dataset on first seed", async () => {
    const db = getDatabase(TEST_DB);
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
    expect(await isLocalDemoDatasetComplete(db, DEFAULT_TENANT_ID)).toBe(true);
    const customers = await db.customers.bulkGet([...LOCAL_DEMO_CUSTOMER_IDS]);
    expect(customers.every((row) => row?.tenantId === DEFAULT_TENANT_ID)).toBe(true);
    const manifest = getLocalDemoDatasetManifest();
    expect(manifest.seedVersion).toBe(SEED_VERSION);
    expect(manifest.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it("repeated seed is idempotent", async () => {
    const db = getDatabase(TEST_DB);
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
    const leadCountBefore = await db.leads.where("tenantId").equals(DEFAULT_TENANT_ID).count();
    const seededAgain = await seedDatabase(db, DEFAULT_TENANT_ID, false);
    const leadCountAfter = await db.leads.where("tenantId").equals(DEFAULT_TENANT_ID).count();
    expect(seededAgain).toBe(false);
    expect(leadCountAfter).toBe(leadCountBefore);
    expect(await applyLocalDemoDataset(db, DEFAULT_TENANT_ID, { force: false })).toBe(false);
  });

  it("reset demo data then reseed restores managed records only", async () => {
    const repos = getTestRepos();
    const db = getDatabase(TEST_DB);
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
    const userLead = await repos.leads.create(DEFAULT_TENANT_ID, {
      companyName: "User Created Co",
      contactName: "User",
      email: "user.created@example.invalid"
    });
    await db.leads.delete(LOCAL_DEMO_SEED_LEAD_IDS[0]);
    await repos.resetDemoData(DEFAULT_TENANT_ID);
    const restoredSeedLead = await repos.leads.getById(DEFAULT_TENANT_ID, LOCAL_DEMO_SEED_LEAD_IDS[0]);
    const preservedUserLead = await repos.leads.getById(DEFAULT_TENANT_ID, userLead.id);
    expect(restoredSeedLead).not.toBeNull();
    expect(preservedUserLead?.companyName).toBe("User Created Co");
    expect(await isLocalDemoDatasetComplete(db, DEFAULT_TENANT_ID)).toBe(true);
  });

  it("restore deterministic demo state replaces all local data", async () => {
    const repos = getTestRepos();
    const db = getDatabase(TEST_DB);
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
    await repos.leads.create(DEFAULT_TENANT_ID, {
      companyName: "Temporary Co",
      contactName: "Temp",
      email: "temp@example.invalid"
    });
    await restoreDeterministicDemoState(db, DEFAULT_TENANT_ID);
    const leads = await repos.leads.list(DEFAULT_TENANT_ID);
    expect(leads.some((lead) => lead.companyName === "Temporary Co")).toBe(false);
    expect(await isLocalDemoDatasetComplete(db, DEFAULT_TENANT_ID)).toBe(true);
  });

  it("exports and restores backup without duplicating records", async () => {
    const repos = getTestRepos();
    const db = getDatabase(TEST_DB);
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
    const backup = await exportBackup(repos, DEFAULT_TENANT_ID, false);
    expect(backup.version).toBe(9);
    expect(backup.schemaVersion).toBe(SCHEMA_VERSION);
    expect(Array.isArray(backup.tables.machines)).toBe(true);
    expect(Array.isArray(backup.tables.customizerSimulations)).toBe(true);
    const leadCountBefore = await db.leads.where("tenantId").equals(DEFAULT_TENANT_ID).count();
    await importBackup(repos, backup);
    const leadCountAfter = await db.leads.where("tenantId").equals(DEFAULT_TENANT_ID).count();
    expect(leadCountAfter).toBe(leadCountBefore);
    await importBackup(repos, backup);
    const leadCountAfterRepeat = await db.leads.where("tenantId").equals(DEFAULT_TENANT_ID).count();
    expect(leadCountAfterRepeat).toBe(leadCountBefore);
  });

  it("rejects malformed backup files", () => {
    expect(validateBackup(null)).toBe(false);
    expect(validateBackup({ version: 9, tenantId: DEFAULT_TENANT_ID })).toBe(false);
  });

  it("rejects incompatible schema versions", () => {
    const incompatible = {
      version: 9,
      schemaVersion: 99,
      exportedAt: new Date().toISOString(),
      tenantId: DEFAULT_TENANT_ID,
      tables: {
        leads: [],
        customers: [],
        companyProfiles: [],
        userProfiles: [],
        senderIdentities: [],
        products: []
      }
    };
    expect(validateBackup(incompatible)).toBe(false);
    expect(isBackupSchemaCompatible(incompatible as unknown as ForgeOSBackup)).toBe(false);
  });

  it("isolates demo dataset by tenant", async () => {
    const db = getDatabase(TEST_DB);
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
    const defaultCustomers = await db.customers.where("tenantId").equals(DEFAULT_TENANT_ID).toArray();
    const otherCustomers = await db.customers.where("tenantId").equals(OTHER_TENANT).toArray();
    expect(defaultCustomers.length).toBeGreaterThan(0);
    expect(otherCustomers.length).toBe(0);
    expect(defaultCustomers.every((customer) => customer.tenantId === DEFAULT_TENANT_ID)).toBe(true);
  });

  it("blocks lifecycle in supabase persistence mode", () => {
    expect(() =>
      assertLocalDemoLifecycleAllowed({
        FORGEOS_PERSISTENCE_MODE: "supabase",
        NEXT_PUBLIC_FORGEOS_PERSISTENCE_MODE: "supabase"
      })
    ).toThrow(LocalDemoLifecycleError);
  });

  it("blocks lifecycle in production without explicit flag", () => {
    expect(() =>
      assertLocalDemoLifecycleAllowed({
        FORGEOS_PERSISTENCE_MODE: "local",
        NEXT_PUBLIC_FORGEOS_PERSISTENCE_MODE: "local",
        NODE_ENV: "production"
      })
    ).toThrow(LocalDemoLifecycleError);
  });

  it("resetLocalDemoDatasetRecords removes managed customizer simulation", async () => {
    const db = getDatabase(TEST_DB);
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
    await resetLocalDemoDatasetRecords(db, DEFAULT_TENANT_ID);
    const simulation = await db.customizerSimulations.get(LOCAL_DEMO_CUSTOMIZER_IDS[0]);
    expect(simulation).toBeUndefined();
  });
});
