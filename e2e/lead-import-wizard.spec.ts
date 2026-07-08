import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  attachPaidCallGuard,
  gotoAndWait,
  resetAcceptanceState
} from "./helpers";

test.describe("Lead import wizard", () => {
  test.beforeEach(async ({ page }) => {
    attachPaidCallGuard(page);
    await resetAcceptanceState(page);
  });

  test("imports CSV with mapping, preview, and persistence after reload", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await resetAcceptanceState(page, "/pt-PT/leadops");
    const csvPath = path.join(__dirname, "fixtures/leads-mixed.csv");
    await page.getByTestId("lead-import-file-input").setInputFiles(csvPath);
    await expect(page.getByTestId("import-metric-valid")).toBeVisible();
    await expect(page.getByTestId("import-metric-duplicates")).toBeVisible();
    await expect(page.getByTestId("import-metric-invalid")).toBeVisible();
    await page.getByTestId("lead-import-confirm").click();
    await expect(page.getByTestId("lead-import-result")).toContainText(/Importados \d+ leads/i, {
      timeout: 30000
    });
    await expect(page.getByRole("cell", { name: "Acceptance Mixed Valid" })).toBeVisible();

    await page.reload();
    await gotoAndWait(page, "/pt-PT/leadops");
    await expect(page.getByRole("cell", { name: "Acceptance Mixed Valid" })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("supports EN locale and mobile layout", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoAndWait(page, "/en/leadops");
    await expect(page.getByText("Choose CSV or XLSX")).toBeVisible();
  });
});
