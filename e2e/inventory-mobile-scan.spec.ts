import { expect, test } from "@playwright/test";
import { attachPaidCallGuard, gotoAndWait, resetAcceptanceState } from "./helpers";

test.describe("Inventory mobile barcode scanner", () => {
  test.beforeEach(async ({ page }) => {
    attachPaidCallGuard(page);
    await resetAcceptanceState(page);
  });

  test("scanner route renders manual entry and resolves seeded SKU", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/inventory/scan");
    await expect(page.getByRole("heading", { name: /ler código de barras/i })).toBeVisible();
    await expect(page.getByTestId("inventory-barcode-scanner")).toBeVisible();
    await expect(page.getByTestId("manual-barcode-input")).toBeVisible();

    await page.getByTestId("manual-barcode-input").fill("PP-250-05601234000250");
    await page.getByRole("button", { name: /procurar código/i }).click();

    await expect(page.getByTestId("inventory-item-summary")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/copo pp 250 ml/i)).toBeVisible();
  });

  test("unknown barcode shows safe fallback without creating items", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/inventory/scan");
    await page.getByTestId("manual-barcode-input").fill("UNKNOWN-SCAN-CODE-999");
    await page.getByRole("button", { name: /procurar código/i }).click();
    await expect(page.getByTestId("inventory-unknown-barcode")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/código desconhecido/i)).toBeVisible();
    await expect(page.getByText(/revisão autorizada/i)).toBeVisible();
  });

  test("desktop inventory page links to scanner", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/inventory");
    await expect(page.getByRole("link", { name: /leitor móvel/i })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole("link", { name: /leitor móvel/i }).first()).toBeVisible();
  });

  test("manual receipt updates balance once", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/inventory/scan");
    await page.getByTestId("manual-barcode-input").fill("INK-UV-BLACK");
    await page.getByRole("button", { name: /procurar código/i }).click();
    await expect(page.getByTestId("inventory-item-stock-panel")).toBeVisible({ timeout: 15000 });

    const summary = page.getByTestId("inventory-item-summary");

    await page.getByTestId("stock-quantity-input").fill("1");
    await page.getByTestId("stock-reason-input").fill("Playwright receipt");
    await page.getByRole("button", { name: /confirmar e registar/i }).click();
    await page.getByTestId("confirm-stock-transaction").click();

    await expect(summary.getByText(/5\s*kg/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/playwright receipt/i)).toBeVisible();
  });
});
