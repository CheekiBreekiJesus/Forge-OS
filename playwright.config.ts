import { defineConfig, devices } from "@playwright/test";

const e2eDbName =
  process.env.FORGEOS_LOCAL_DB_NAME ??
  process.env.NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME ??
  "forgeos:e2e:default";

// Keep Playwright helpers and webServer on the same isolated IndexedDB name.
process.env.FORGEOS_LOCAL_DB_NAME = e2eDbName;
process.env.NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME = e2eDbName;

export default defineConfig({
  testDir: "./e2e",
  testIgnore: ["**/acceptance/**"],
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  timeout: 60000,
  use: {
    baseURL: "http://localhost:3012",
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: {
    command: "npm run dev -- --port 3012",
    env: {
      ...process.env,
      ABACUS_API_KEY: "",
      AI_DEFAULT_PROVIDER: "deterministic",
      AI_FALLBACK_PROVIDER: "deterministic",
      AI_OUTREACH_PROVIDER: "deterministic",
      FORGEOS_E2E: "true",
      FORGEOS_LOCAL_DB_NAME: e2eDbName,
      NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME: e2eDbName,
      OUTREACH_DELIVERY_PROVIDER: "simulation"
    },
    reuseExistingServer: false,
    timeout: 180000,
    url: "http://localhost:3012/pt-PT/leadops"
  }
});
