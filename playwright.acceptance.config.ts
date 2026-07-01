import { defineConfig, devices } from "@playwright/test";

const acceptanceDbName =
  process.env.FORGEOS_LOCAL_DB_NAME ??
  process.env.NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME ??
  "forgeos:e2e:acceptance";

export default defineConfig({
  testDir: "./e2e/acceptance",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 120000,
  expect: { timeout: 15000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "qa/acceptance/results/html-report", open: "never" }]
  ],
  outputDir: "qa/acceptance/results/test-results",
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: {
    command: "npm run dev -- --port 3001",
    env: {
      ...process.env,
      FORGEOS_E2E: "true",
      FORGEOS_LOCAL_DB_NAME: acceptanceDbName,
      NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME: acceptanceDbName,
      ABACUS_API_KEY: "",
      AI_DEFAULT_PROVIDER: "deterministic",
      AI_FALLBACK_PROVIDER: "deterministic",
      AI_OUTREACH_PROVIDER: "deterministic",
      OUTREACH_DELIVERY_PROVIDER: "simulation"
    },
    reuseExistingServer: false,
    timeout: 180000,
    url: "http://localhost:3001/pt-PT"
  }
});
