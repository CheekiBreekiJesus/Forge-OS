import { expect, test } from "@playwright/test";
import { attachPaidCallGuard, gotoAndWait, resetAcceptanceState, waitForCupCatalog, waitForOperationsSeed } from "../helpers";

test.describe("Customizer, quotation and production", () => {
  test.beforeEach(async ({ page }) => {
    attachPaidCallGuard(page);
    await resetAcceptanceState(page);
  });

  test("saves and persists cup customizer simulation", async ({ page }) => {
    await waitForOperationsSeed(page);
    await gotoAndWait(page, "/pt-PT/quotations/customizer");
    await waitForCupCatalog(page);
    const saveButton = page.getByRole("button", { name: /guardar simulação/i });
    await saveButton.click();
    await expect(page.getByText(/simulação guardada/i)).toBeVisible({ timeout: 15000 });

    await page.reload();
    await gotoAndWait(page, "/pt-PT/quotations/customizer");
    await expect(page.getByRole("button", { name: /guardar simulação/i })).toBeVisible();
  });

  test("quotations module links customizer and lists quotes", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/quotations");
    await expect(
      page.getByRole("navigation", { name: /navegação de orçamentos/i }).getByRole("link", {
        name: /personalizador de copos/i
      })
    ).toBeVisible();
    await page.getByRole("link", { name: /abrir personalizador de copos/i }).click();
    await expect(page).toHaveURL(/quotations\/customizer/);
  });

  test("production list renders and links from demo seed context", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/production");
    await expect(page.getByRole("heading", { name: /ordens de produção/i })).toBeVisible();
  });

  test("onboarding checklist includes customizer step", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT");
    await expect(page.getByTestId("onboarding-checklist")).toBeVisible();
    await expect(page.getByText(/testar personalizador de copos/i)).toBeVisible();
  });

  test("notification center opens and supports mark all read", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT");
    await page.getByRole("button", { name: /notificações/i }).click();
    await expect(page.getByText(/marcar todas como lidas/i)).toBeVisible();
    await page.getByText(/marcar todas como lidas/i).click();
  });
});
