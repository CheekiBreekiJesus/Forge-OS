/** Default single-tenant MVP identifier (JH Gomes). */
export const DEFAULT_TENANT_ID = "tenant_jh_gomes" as const;

/** IndexedDB database name for local MVP development (override via env for E2E). */
function resolveLocalDbName(): string {
  if (typeof process !== "undefined") {
    const override =
      process.env.NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME ?? process.env.FORGEOS_LOCAL_DB_NAME;
    if (override?.trim()) return override.trim();
  }
  return "forgeos:jhgomes:development";
}

export const LOCAL_DB_NAME = resolveLocalDbName();

/** Bump when seed data shape changes to trigger optional reseed prompts. */
export const SEED_VERSION = 5 as const;

/** IndexedDB Dexie schema version. */
export const SCHEMA_VERSION = 13 as const;
