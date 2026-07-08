import { expect, test } from "@playwright/test";
import { attachPaidCallGuard, gotoAndWait, resetAcceptanceState } from "./helpers";

test.describe("Inventory mobile barcode scanner", () => {
  test.beforeEach(async ({ page }) => {
    attachPaidCallGuard(page);
    await resetAcceptanceState(page);
  });

  test("scanner route renders manual entry and resolves seeded barcode", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/inventory/scan");
    await expect(page.getByRole("heading", { name: /ler código de barras/i })).toBeVisible();
    await expect(page.getByTestId("inventory-barcode-scanner")).toBeVisible();
    await expect(page.getByTestId("manual-barcode-input")).toBeVisible();

    await page.getByTestId("manual-barcode-input").fill("05601234001005");
    await page.getByRole("button", { name: /procurar código/i }).click();

    await expect(page.getByTestId("inventory-item-summary")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/clear cup 330 ml blank/i)).toBeVisible();
  });

  test("unknown barcode shows safe fallback without creating items", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/inventory/scan");
    await page.getByTestId("manual-barcode-input").fill("UNKNOWN-SCAN-CODE-999");
    await page.getByRole("button", { name: /procurar código/i }).click();
    await expect(page.getByTestId("inventory-unknown-barcode")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/código desconhecido/i)).toBeVisible();
    await expect(page.getByText(/nunca são criados artigos automaticamente/i)).toBeVisible();
  });

  test("desktop inventory page links to scanner", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/inventory");
    await expect(page.getByRole("link", { name: /leitor móvel/i })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole("link", { name: /leitor móvel/i }).first()).toBeVisible();
  });

  test("manual receive updates balance once", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/inventory/scan");
    await page.getByTestId("manual-barcode-input").fill("05601234001005");
    await page.getByRole("button", { name: /procurar código/i }).click();
    await expect(page.getByTestId("inventory-item-stock-panel")).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: /^entrada$/i }).click();
    await page.getByTestId("stock-quantity-input").fill("1");
    await page.getByTestId("stock-reason-input").fill("Playwright receipt");
    await page.getByRole("button", { name: /confirmar e registar/i }).click();
    await page.getByTestId("confirm-stock-transaction").click();

    await expect(page.getByText(/movimento registado com sucesso/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/playwright receipt/i)).toBeVisible();
  });

  test("mobile layout keeps scanner controls reachable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoAndWait(page, "/pt-PT/inventory/scan");
    await expect(page.getByTestId("inventory-barcode-scanner")).toBeVisible();
    await expect(page.getByRole("button", { name: /iniciar câmara/i })).toBeVisible();
    await expect(page.getByTestId("manual-barcode-input")).toBeVisible();
  });
});
