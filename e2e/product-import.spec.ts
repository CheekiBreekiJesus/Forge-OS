import { expect, test } from "@playwright/test";
import { resolve } from "node:path";

const fixturePath = resolve(process.cwd(), "scripts/data-preparation/fixtures/synthetic_curated_products.csv");

test.describe("Product import workspace", () => {
  test("XLSX/CSV import wizard with staging and commit @product-import", async ({ page }) => {
    await page.goto("/en/products/import");
    await expect(page.getByRole("heading", { name: /Product import/i })).toBeVisible();

    await page.getByTestId("product-import-file").setInputFiles(fixturePath);
    await page.getByTestId("product-import-continue-mapping").click();
    await page.getByTestId("product-import-stage").click();
    await expect(page.getByTestId("product-import-preview-table")).toBeVisible({ timeout: 15000 });

    const firstCheckbox = page.getByTestId("select-row-1");
    await firstCheckbox.check();
    await page.getByTestId("product-import-commit").click();
    await expect(page.getByText(/Committed products/i)).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: /History/i }).click();
    await expect(page.getByTestId("import-history-item").first()).toBeVisible();
  });

  test("Portuguese locale renders import workspace", async ({ page }) => {
    await page.goto("/pt-PT/products/import");
    await expect(page.getByRole("heading", { name: /Importação de produtos/i })).toBeVisible();
  });
});
