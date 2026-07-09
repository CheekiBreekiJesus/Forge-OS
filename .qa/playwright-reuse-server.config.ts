import { defineConfig, devices } from "@playwright/test";
import {
  buildPlaywrightWebServerEnv,
  E2E_BASE_URL,
  E2E_DB_NAME,
  PLAYWRIGHT_RUNTIME
} from "../e2e/helpers/runtime";

const e2eDbName =
  process.env.FORGEOS_LOCAL_DB_NAME ??
  process.env.NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME ??
  E2E_DB_NAME;

process.env.FORGEOS_LOCAL_DB_NAME = e2eDbName;
process.env.NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME = e2eDbName;

export default defineConfig({
  testDir: "../e2e",
  testIgnore: ["**/acceptance/**"],
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  timeout: 60000,
  use: {
    baseURL: E2E_BASE_URL,
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
