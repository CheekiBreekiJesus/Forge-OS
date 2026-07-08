import { expect, test } from "@playwright/test";

test.describe("inventory foundation workspace", () => {
  test("desktop inventory workspace navigation exposes stock workflows", async ({ page }) => {
    await page.setViewportSize({ height: 900, width: 1440 });
    await page.goto("/pt-PT/inventory/stock");
    await expect(page.getByRole("heading", { name: /controlo de inventário|inventory control/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /receções|receipts/i })).toBeVisible();
    await page.getByRole("link", { name: /ajustes|adjustments/i }).click();
    await expect(page.getByRole("button", { name: /increase stock|aumentar stock/i })).toBeVisible();
  });

  test("mobile inventory workspace remains usable", async ({ page }) => {
    await page.setViewportSize({ height: 844, width: 390 });
    await page.goto("/pt-PT/inventory/receipts");
    await expect(page.getByLabel(/artigo|item/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /receção|receipt/i })).toBeVisible();
  });
});
