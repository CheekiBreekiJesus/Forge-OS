import { expect, test } from "@playwright/test";
import { attachPaidCallGuard, drawer, gotoAndWait, resetAcceptanceState, waitForCreateDrawer } from "../helpers";

test.describe("Products, machines and inventory", () => {
  test.beforeEach(async ({ page }) => {
    attachPaidCallGuard(page);
    await resetAcceptanceState(page);
  });

  test("creates a product and verifies it in the catalog", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/products#create");
    await waitForCreateDrawer(page, /criar produto/i);
    const sku = `ACC-${Date.now()}`;
    await drawer(page).getByLabel(/^nome/i).fill("Acceptance Cup Product");
    await drawer(page).getByLabel(/^sku/i).fill(sku);
    await drawer(page).getByLabel(/preço base/i).fill("0.12");
    await drawer(page).getByRole("button", { name: /^criar$/i }).click();
    await expect(page.getByRole("cell", { name: "Acceptance Cup Product" })).toBeVisible({
      timeout: 15000
    });
  });

  test("creates a machine from catalog", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/machines#create");
    await waitForCreateDrawer(page, /criar máquina/i);
    await drawer(page).getByLabel(/^nome/i).fill("Acceptance Screen Printer");
    const codeField = drawer(page).getByLabel(/código|code/i);
    if (await codeField.isVisible()) {
      await codeField.fill(`M-${Date.now()}`);
    }
    await drawer(page).getByRole("button", { name: /^criar$/i }).click();
    await expect(page.getByRole("cell", { name: "Acceptance Screen Printer" })).toBeVisible({
      timeout: 15000
    });
  });

  test("inventory module loads with create action", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/inventory");
    await expect(page.getByRole("heading", { name: /inventário/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /novo item|criar/i }).first()).toBeVisible();
  });
});
