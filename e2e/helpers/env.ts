/**
 * IndexedDB name for the active Playwright config.
 * Each config sets FORGEOS_LOCAL_DB_NAME before tests import helpers.
 */
export const ACCEPTANCE_DB_NAME =
  process.env.FORGEOS_LOCAL_DB_NAME ??
  process.env.NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME ??
  "forgeos:e2e:acceptance";

export const ACCEPTANCE_TENANT_ID = "tenant_jh_gomes";

export const ACCEPTANCE_BASE_LOCALE = "pt-PT";
