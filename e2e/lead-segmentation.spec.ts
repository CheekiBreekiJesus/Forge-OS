import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  attachPaidCallGuard,
  gotoAndWait,
  resetAcceptanceState
} from "./helpers";

test.describe("Lead segmentation and campaigns", () => {
  test.beforeEach(async ({ page }) => {
    attachPaidCallGuard(page);
    await resetAcceptanceState(page);
  });

  test("filters leads, creates campaign, persists snapshot, and refreshes recipients", async ({ page }) => {
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
    await expect(page.getByTestId("segment-builder-dialog")).toBeVisible();
    await expect(page.getByTestId("segment-sendable")).toBeVisible();
    await page.getByTestId("segment-campaign-name").fill("E2E Segmentation Campaign");
    await page.getByTestId("segment-create-campaign").click();

    await expect(page.getByTestId("campaign-detail-name")).toContainText("E2E Segmentation Campaign", {
      timeout: 30000
    });
    await expect(page.getByTestId("campaign-recipient-count")).toBeVisible();

    await page.reload();
    await gotoAndWait(page, page.url());
    await expect(page.getByTestId("campaign-recipient-count")).toBeVisible();

    await page.getByTestId("refresh-recipients").click();
    await page.getByTestId("confirm-refresh-recipients").click();
    await expect(page.getByText(/Adicionados|Added/i)).toBeVisible();

    await gotoAndWait(page, "/en/leadops");
    await expect(page.getByTestId("lead-management-panel")).toBeVisible();
    expect(errors).toEqual([]);
  });
});
