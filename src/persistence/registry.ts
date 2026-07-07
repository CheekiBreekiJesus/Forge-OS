import { DEFAULT_TENANT_ID, LOCAL_DB_NAME } from "@/domain/constants";
import { closeDatabase, deleteDatabase, getDatabase, resetDatabaseInstance } from "./db";
import { createLocalRepositoryBundle, seedDatabase } from "./indexeddb/repositories";
import type { LocalRepositoryBundle } from "./interfaces";
import { openLocalDatabase, toPersistenceStartupError } from "./startup";

let bundle: LocalRepositoryBundle | null = null;
let initPromise: Promise<LocalRepositoryBundle> | null = null;
let initGeneration = 0;

function isDatabaseReady(): boolean {
  return getDatabase().isOpen();
}

function assertActiveGeneration(generation: number): void {
  if (generation !== initGeneration) {
    throw new Error("Persistence initialization was interrupted.");
  }
}

function invalidateRepositoryCache(): void {
  initGeneration += 1;
  bundle = null;
  initPromise = null;
}

export async function initializeRepositories(
  tenantId: string = DEFAULT_TENANT_ID
): Promise<LocalRepositoryBundle> {
  if (bundle && isDatabaseReady()) {
    return bundle;
  }
  if (bundle && !isDatabaseReady()) {
    bundle = null;
  }
  if (initPromise) return initPromise;

  const generation = initGeneration;
  initPromise = (async () => {
    try {
      const db = getDatabase();
      await openLocalDatabase(db);
      assertActiveGeneration(generation);
      await seedDatabase(db, tenantId, false);
      assertActiveGeneration(generation);
      const repos = createLocalRepositoryBundle(db);
      bundle = repos;
      return repos;
    } catch (error) {
      if (initGeneration !== generation) {
        throw new Error("Persistence initialization was interrupted.");
      }
      throw error;
    } finally {
      if (initGeneration === generation) {
        initPromise = null;
      }
    }
  })();

  try {
    return await initPromise;
  } catch (error) {
    if (initGeneration === generation) {
      bundle = null;
    }
    if (error instanceof Error && error.message.includes("interrupted")) {
      throw error;
    }
    throw toPersistenceStartupError(error);
  }
}

export function getRepositories(): LocalRepositoryBundle {
  if (!bundle) {
    throw new Error("Repositories not initialized. Call initializeRepositories() first.");
  }
  return bundle;
}

export async function resetAndReseedRepositories(
  tenantId: string = DEFAULT_TENANT_ID
): Promise<LocalRepositoryBundle> {
  const db = getDatabase();
  await openLocalDatabase(db);
  const repos = createLocalRepositoryBundle(db);
  await repos.reset();
  await repos.seed(tenantId);
  bundle = repos;
  return repos;
}

export async function destroyRepositories(): Promise<void> {
  invalidateRepositoryCache();
  await closeDatabase();
}

export async function recoverLocalDatabase(
  tenantId: string = DEFAULT_TENANT_ID,
  options?: { deleteDatabase?: boolean }
): Promise<LocalRepositoryBundle> {
  invalidateRepositoryCache();
  await closeDatabase();
  resetDatabaseInstance();
  if (options?.deleteDatabase) {
    await deleteDatabase(LOCAL_DB_NAME);
  }
  return initializeRepositories(tenantId);
}

export async function destroyDatabaseForTests(name: string = LOCAL_DB_NAME): Promise<void> {
  invalidateRepositoryCache();
  resetDatabaseInstance();
  await deleteDatabase(name);
}

export type { LocalRepositoryBundle, SupabaseRepositoryBundle } from "./interfaces";
