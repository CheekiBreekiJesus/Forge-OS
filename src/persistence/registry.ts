import { DEFAULT_TENANT_ID, LOCAL_DB_NAME } from "@/domain/constants";
import { closeDatabase, deleteDatabase, getDatabase, resetDatabaseInstance } from "./db";
import { createLocalRepositoryBundle, seedDatabase } from "./indexeddb/repositories";
import type { LocalRepositoryBundle } from "./interfaces";

let bundle: LocalRepositoryBundle | null = null;
let initPromise: Promise<LocalRepositoryBundle> | null = null;

export async function initializeRepositories(
  tenantId: string = DEFAULT_TENANT_ID
): Promise<LocalRepositoryBundle> {
  if (bundle) return bundle;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const db = getDatabase();
    await db.open();
    await seedDatabase(db, tenantId, false);
    bundle = createLocalRepositoryBundle(db);
    return bundle;
  })();

  try {
    return await initPromise;
  } catch (error) {
    initPromise = null;
    throw error;
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
  await db.open();
  const repos = createLocalRepositoryBundle(db);
  await repos.reset();
  await repos.seed(tenantId);
  bundle = repos;
  return repos;
}

export async function destroyRepositories(): Promise<void> {
  bundle = null;
  initPromise = null;
  await closeDatabase();
}

export async function destroyDatabaseForTests(name: string = LOCAL_DB_NAME): Promise<void> {
  bundle = null;
  initPromise = null;
  resetDatabaseInstance();
  await deleteDatabase(name);
}

export type { LocalRepositoryBundle, SupabaseRepositoryBundle } from "./interfaces";
