import { defineConfig, devices } from "@playwright/test";
import { buildPlaywrightWebServerEnv } from "./e2e/helpers/runtime";

/** Keep in sync with scripts/demo/contract.mjs */
export const DEMO_DB_NAME = "forgeos:jhgomes:0.2.0-demo";
export const DEMO_SMOKE_PORT = 3002;
export const DEMO_SMOKE_BASE_URL = `http://localhost:${DEMO_SMOKE_PORT}`;
export const DEMO_ENTRY_PATH = "/pt-PT";

const demoDbName =
  process.env.FORGEOS_LOCAL_DB_NAME ??
  process.env.NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME ??
  DEMO_DB_NAME;

process.env.FORGEOS_LOCAL_DB_NAME = demoDbName;
process.env.NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME = demoDbName;

const smokeEnv = buildPlaywrightWebServerEnv(demoDbName);
smokeEnv.FORGEOS_TEST_USER_ID = "00000000-0000-4000-8000-0000000000de";

export default defineConfig({
  testDir: "./e2e/acceptance",
  testMatch: "00-smoke-and-navigation.spec.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 120000,
  expect: { timeout: 15000 },
  reporter: [["list"]],
  outputDir: "qa/demo/results/test-results",
  use: {
    baseURL: DEMO_SMOKE_BASE_URL,
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
    command: `npm run dev -- --port ${DEMO_SMOKE_PORT}`,
    env: smokeEnv,
    reuseExistingServer: false,
    timeout: 180000,
    url: `${DEMO_SMOKE_BASE_URL}${DEMO_ENTRY_PATH}`
  }
});
