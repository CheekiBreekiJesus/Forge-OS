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
  const env: Record<string, string> = {
    FORGEOS_E2E: "true",
    FORGEOS_LOCAL_DB_NAME: dbName,
    NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME: dbName,
    ABACUS_API_KEY: "",
    AI_DEFAULT_PROVIDER: "deterministic",
    AI_FALLBACK_PROVIDER: "deterministic",
    AI_OUTREACH_PROVIDER: "deterministic",
    OUTREACH_DELIVERY_PROVIDER: "simulation"
  };

  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string") {
      env[key] = value;
    }
  }

  return env;
}
