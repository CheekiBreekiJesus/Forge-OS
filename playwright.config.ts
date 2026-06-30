import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  timeout: 60000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: {
    command: "npm run dev -- --port 3000",
    env: {
      ...process.env,
      AI_OUTREACH_PROVIDER: "deterministic",
      OUTREACH_DELIVERY_PROVIDER: "simulation"
    },
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
    url: "http://localhost:3000/pt-PT/leadops"
  }
});
