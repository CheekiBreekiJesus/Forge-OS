export const E2E_PORT = 3012;
export const ACCEPTANCE_PORT = 3001;
export const E2E_DB_NAME = "forgeos:e2e:default";
export const ACCEPTANCE_DB_NAME = "forgeos:e2e:acceptance";
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;
export const ACCEPTANCE_BASE_URL = `http://localhost:${ACCEPTANCE_PORT}`;

export const PLAYWRIGHT_RUNTIME = {
  e2e: {
    port: E2E_PORT,
    dbName: E2E_DB_NAME,
    baseUrl: E2E_BASE_URL,
    entryPath: "/pt-PT/leadops"
  },
  acceptance: {
    port: ACCEPTANCE_PORT,
    dbName: ACCEPTANCE_DB_NAME,
    baseUrl: ACCEPTANCE_BASE_URL,
    entryPath: "/pt-PT"
  }
} as const;

export function buildPlaywrightWebServerEnv(dbName: string): Record<string, string> {
  const env: Record<string, string> = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string") {
      env[key] = value;
    }
  }

  env.FORGEOS_E2E = "true";
  env.FORGEOS_TEST_AUTH_ENABLED = "true";
  env.FORGEOS_TEST_USER_ID = "00000000-0000-4000-8000-0000000000e2";
  env.FORGEOS_TEST_TENANT_ID = "11111111-1111-1111-1111-111111111111";
  env.FORGEOS_TEST_ROLES = "company_owner,marketing_manager,outreach_operator";
  env.FORGEOS_LOCAL_DB_NAME = dbName;
  env.NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME = dbName;
  env.FORGEOS_PERSISTENCE_MODE = "local";
  env.NEXT_PUBLIC_FORGEOS_PERSISTENCE_MODE = "local";
  env.ABACUS_API_KEY = "";
  env.AI_DEFAULT_PROVIDER = "deterministic";
  env.AI_FALLBACK_PROVIDER = "deterministic";
  env.AI_OUTREACH_PROVIDER = "deterministic";
  env.OUTREACH_DELIVERY_PROVIDER = "simulation";

  return env;
}
