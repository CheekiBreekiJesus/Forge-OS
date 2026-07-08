import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  attachHostedPreparationApiMocks,
  attachPaidCallGuard,
  gotoAndWait,
  resetAcceptanceState
} from "./helpers";

test.describe("Outreach release checkpoint", () => {
  test.beforeEach(async ({ page }) => {
    attachPaidCallGuard(page);
    await attachHostedPreparationApiMocks(page);
    await resetAcceptanceState(page);
  });

  test("shows operational summary and suppression controls", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/leadops");
    await expect(page.getByTestId("leadops-operational-summary")).toBeVisible();
    await expect(page.getByTestId("leadops-suppression-panel")).toBeVisible();
    await expect(page.getByTestId("operational-metric-importedOrganizations")).toBeVisible();
  });

  test("adds suppression and blocks re-approval in campaign flow", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await resetAcceptanceState(page, "/pt-PT/leadops");
    const csvPath = path.join(__dirname, "fixtures/leads-mixed.csv");
    await page.getByTestId("lead-import-file-input").setInputFiles(csvPath);
    await page.getByTestId("lead-import-confirm").click();
    await expect(page.getByTestId("lead-import-result")).toBeVisible({ timeout: 30000 });

    await page.getByTestId("lead-search-input").fill("Acceptance");
    await page.getByTestId("create-campaign-from-filters").click();
    await page.getByTestId("segment-campaign-name").fill("Release Suppression Campaign");
    await page.getByTestId("segment-create-campaign").click();
    await page.getByTestId("generate-campaign-drafts").click();
    await expect(page.getByTestId("campaign-drafts-panel")).toBeVisible();

    const campaignUrl = page.url();
    await gotoAndWait(page, "/pt-PT/leadops");
    await page.getByTestId("suppression-email-input").fill("acceptance.mixed.valid@example.invalid");
    await page.getByTestId("suppression-add-button").click();
    await expect(page.getByTestId("suppression-feedback")).toBeVisible();

    await gotoAndWait(page, campaignUrl);
    const firstRow = page.locator('[data-testid^="campaign-draft-row-"]').first();
    await firstRow.click();
    await expect(page.getByTestId("campaign-approval-blockers")).toBeVisible();
    expect(errors).toEqual([]);
  });
});
