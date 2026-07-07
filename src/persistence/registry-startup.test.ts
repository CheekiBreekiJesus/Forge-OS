import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_TENANT_ID, LOCAL_DB_NAME } from "@/domain/constants";
import {
  destroyDatabaseForTests,
  destroyRepositories,
  initializeRepositories,
  recoverLocalDatabase
} from "@/persistence/registry";

describe("repository startup lifecycle", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(LOCAL_DB_NAME);
  });

  afterEach(async () => {
    await destroyRepositories();
    await destroyDatabaseForTests(LOCAL_DB_NAME);
  });

  it("initializes repositories and seeds demo data", async () => {
    const repos = await initializeRepositories(DEFAULT_TENANT_ID);
    const leads = await repos.leads.list(DEFAULT_TENANT_ID);
    expect(leads.length).toBeGreaterThan(0);
  });

  it("recovers after destroyRepositories interrupts an in-flight initialization", async () => {
    const interrupted = initializeRepositories(DEFAULT_TENANT_ID).catch((error: unknown) => error);
    await destroyRepositories();
    const recovered = await initializeRepositories(DEFAULT_TENANT_ID);
    const leads = await recovered.leads.list(DEFAULT_TENANT_ID);
    expect(leads.length).toBeGreaterThan(0);
    const interruptedResult = await interrupted;
    expect(interruptedResult).toBeInstanceOf(Error);
    expect(String(interruptedResult)).toMatch(/interrupted/i);
  });

  it("reopens the database after destroyRepositories left a stale bundle", async () => {
    const first = await initializeRepositories(DEFAULT_TENANT_ID);
    expect(first).toBeDefined();
    await destroyRepositories();
    const second = await initializeRepositories(DEFAULT_TENANT_ID);
    const leads = await second.leads.list(DEFAULT_TENANT_ID);
    expect(leads.length).toBeGreaterThan(0);
  });

  it("recovers from a deleted database without requiring manual refresh", async () => {
    await initializeRepositories(DEFAULT_TENANT_ID);
    await destroyRepositories();
    const recovered = await recoverLocalDatabase(DEFAULT_TENANT_ID, { deleteDatabase: true });
    const leads = await recovered.leads.list(DEFAULT_TENANT_ID);
    expect(leads.length).toBeGreaterThan(0);
  });
});
