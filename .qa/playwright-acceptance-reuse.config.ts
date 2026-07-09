import { defineConfig, devices } from "@playwright/test";
import {
  ACCEPTANCE_BASE_URL,
  ACCEPTANCE_DB_NAME
} from "../e2e/helpers/runtime";

const acceptanceDbName =
  process.env.FORGEOS_LOCAL_DB_NAME ??
  process.env.NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME ??
  ACCEPTANCE_DB_NAME;

process.env.FORGEOS_LOCAL_DB_NAME = acceptanceDbName;
process.env.NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME = acceptanceDbName;

export default defineConfig({
  testDir: "../e2e/acceptance",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 120000,
  expect: { timeout: 15000 },
  reporter: [
    ["list"],
    ["html", { outputFolder: "../qa/acceptance/results/html-report", open: "never" }]
  ],
  outputDir: "../qa/acceptance/results/test-results",
  use: {
    baseURL: ACCEPTANCE_BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
