import { defineConfig, devices } from "@playwright/test";
import { buildPlaywrightWebServerEnv } from "./e2e/helpers/runtime";

/** Keep in sync with scripts/demo/contract.mjs */
export const DEMO_DB_NAME = "forgeos:jhgomes:0.2.0-demo";
export const DEMO_WALKTHROUGH_PORT = 3003;
export const DEMO_WALKTHROUGH_BASE_URL = `http://localhost:${DEMO_WALKTHROUGH_PORT}`;

const demoDbName =
  process.env.FORGEOS_LOCAL_DB_NAME ??
  process.env.NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME ??
  DEMO_DB_NAME;

process.env.FORGEOS_LOCAL_DB_NAME = demoDbName;
process.env.NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME = demoDbName;

const walkthroughEnv = buildPlaywrightWebServerEnv(demoDbName);
walkthroughEnv.FORGEOS_TEST_USER_ID = "00000000-0000-4000-8000-0000000000de";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "forgeos-0.2.0-demo.spec.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 180000,
  expect: { timeout: 20000 },
  reporter: [["list"]],
  outputDir: "qa/demo/results/walkthrough-test-results",
  use: {
    baseURL: DEMO_WALKTHROUGH_BASE_URL,
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
    command: `npm run dev -- --port ${DEMO_WALKTHROUGH_PORT}`,
    env: walkthroughEnv,
    reuseExistingServer: false,
    timeout: 180000,
    url: `${DEMO_WALKTHROUGH_BASE_URL}/pt-PT`
  }
});
