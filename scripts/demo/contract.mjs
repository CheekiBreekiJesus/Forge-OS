/** ForgeOS 0.2.0 local demo runtime contract (cross-platform). */

export const DEMO_VERSION = "0.2.0";

export const REQUIRED_NODE_MAJOR = 22;
export const REQUIRED_NPM_VERSION = "10.9.8";

export const DEMO_DB_NAME = "forgeos:jhgomes:0.2.0-demo";
export const DEMO_TENANT_ID = "tenant_jh_gomes";
export const DEMO_PORT = 3000;
export const DEMO_SMOKE_PORT = 3002;
export const DEMO_HOST = "localhost";
export const DEMO_BASE_URL = `http://${DEMO_HOST}:${DEMO_PORT}`;
export const DEMO_SMOKE_BASE_URL = `http://${DEMO_HOST}:${DEMO_SMOKE_PORT}`;
export const DEMO_HEALTH_PATH = "/api/health/local";
export const DEMO_ENTRY_LOCALE = "pt-PT";
export const DEMO_ENTRY_PATH = `/${DEMO_ENTRY_LOCALE}`;

export const DEMO_RUNTIME_DIR = ".demo";
export const DEMO_LOGS_DIR = ".demo/logs";
export const DEMO_PID_DIR = ".demo/runtime";
export const DEMO_RUNTIME_METADATA = ".demo/runtime/forgeos-demo.runtime.json";
export const DEMO_ENV_TEMPLATE = ".env.demo.local.example";

/** Critical demo routes (pt-PT) for walkthrough and smoke coverage. */
export const DEMO_CRITICAL_ROUTES = [
  { key: "login", path: "/pt-PT/login", module: "auth" },
  { key: "dashboard", path: "/pt-PT", module: "dashboard" },
  { key: "customers", path: "/pt-PT/customers", module: "crm" },
  { key: "leadops", path: "/pt-PT/leadops", module: "leadops" },
  { key: "campaigns", path: "/pt-PT/leadops/campaigns", module: "leadops" },
  { key: "products", path: "/pt-PT/products", module: "products" },
  { key: "cup-customizer", path: "/pt-PT/quotations/customizer", module: "customizer" },
  { key: "quotations", path: "/pt-PT/quotations", module: "orders" },
  { key: "production", path: "/pt-PT/production", module: "production" },
  { key: "machines", path: "/pt-PT/machines", module: "machines" },
  { key: "inventory", path: "/pt-PT/inventory", module: "inventory" },
  { key: "settings", path: "/pt-PT/settings", module: "settings" },
  { key: "demo-workflow", path: "/pt-PT/demo", module: "demo" },
  { key: "backup-reset", path: "/pt-PT/settings", module: "settings", note: "Dados e cópia de segurança panel" }
];

/**
 * Environment for demo dev server and Playwright smoke runs.
 * Does not read or write `.env.local`.
 */
export function buildDemoProcessEnv(overrides = {}) {
  const env = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === "string") {
      env[key] = value;
    }
  }

  Object.assign(env, {
    FORGEOS_DEMO_START: "true",
    FORGEOS_RUNTIME_MODE: "development",
    FORGEOS_PERSISTENCE_MODE: "local",
    NEXT_PUBLIC_FORGEOS_PERSISTENCE_MODE: "local",
    FORGEOS_LOCAL_DB_NAME: DEMO_DB_NAME,
    NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME: DEMO_DB_NAME,
    NEXT_PUBLIC_APP_URL: DEMO_BASE_URL,
    FORGEOS_PUBLIC_BASE_URL: DEMO_BASE_URL,
    NEXT_PUBLIC_DEFAULT_LOCALE: DEMO_ENTRY_LOCALE,
    FORGEOS_LOCAL_LOG_DIR: DEMO_LOGS_DIR,
    AI_DEFAULT_PROVIDER: "deterministic",
    AI_FALLBACK_PROVIDER: "deterministic",
    AI_OUTREACH_PROVIDER: "deterministic",
    AI_ALLOW_BROWSER_PROVIDER_SELECTION: "false",
    EMAIL_DELIVERY_PROVIDER: "simulation",
    OUTREACH_DELIVERY_PROVIDER: "simulation",
    OUTREACH_REAL_SEND_ENABLED: "false",
    OUTREACH_TEST_SEND_ENABLED: "false",
    OUTLOOK_GRAPH_ENABLED: "false",
    OUTLOOK_LIVE_SEND_ENABLED: "false",
    BREVO_API_KEY: "",
    ABACUS_API_KEY: "",
    OPENAI_API_KEY: "",
    NEXT_PUBLIC_SUPABASE_URL: "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    SUPABASE_URL: "",
    SUPABASE_SERVICE_ROLE_KEY: ""
  }, overrides);

  return env;
}

/**
 * Playwright webServer env — isolated from hosted Supabase and paid providers.
 */
export function buildDemoSmokeEnv(dbName = DEMO_DB_NAME, port = DEMO_SMOKE_PORT) {
  const baseUrl = `http://${DEMO_HOST}:${port}`;

  return buildDemoProcessEnv({
    FORGEOS_LOCAL_DB_NAME: dbName,
    NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME: dbName,
    FORGEOS_E2E: "true",
    FORGEOS_TEST_AUTH_ENABLED: "true",
    FORGEOS_TEST_USER_ID: "00000000-0000-4000-8000-0000000000de",
    FORGEOS_TEST_TENANT_ID: "11111111-1111-1111-1111-111111111111",
    FORGEOS_TEST_ROLES: "company_owner,marketing_manager,outreach_operator",
    NEXT_PUBLIC_APP_URL: baseUrl,
    FORGEOS_PUBLIC_BASE_URL: baseUrl
  });
}
