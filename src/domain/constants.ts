/** Default single-tenant MVP identifier (JH Gomes). */
export const DEFAULT_TENANT_ID = "tenant_jh_gomes" as const;

/** IndexedDB database name for local MVP development. */
export const LOCAL_DB_NAME = "forgeos:jhgomes:development" as const;

/** Bump when seed data shape changes to trigger optional reseed prompts. */
export const SEED_VERSION = 2 as const;

/** IndexedDB Dexie schema version. */
export const SCHEMA_VERSION = 2 as const;
