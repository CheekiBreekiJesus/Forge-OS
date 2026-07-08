import { expect, test } from "@playwright/test";
import { attachPaidCallGuard, createConsoleCollector, gotoAndWait, resetAcceptanceState } from "../helpers";

const PRIMARY_ROUTES = [
  "/pt-PT",
  "/pt-PT/demo",
  "/pt-PT/leadops",
  "/pt-PT/customers",
  "/pt-PT/products",
  "/pt-PT/quotations",
  "/pt-PT/quotations/customizer",
  "/pt-PT/production",
  "/pt-PT/inventory",
  "/pt-PT/machines",
  "/pt-PT/settings"
];

test.describe("Controls and console audit", () => {
  test.beforeEach(async ({ page }) => {
    attachPaidCallGuard(page);
    await resetAcceptanceState(page);
  });

  test("quick create menu exposes working actions", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT");
    await page.getByRole("button", { name: /^criar$/i }).click();
    await expect(page.getByRole("link", { name: /^cliente$/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Personalizador de copos", exact: true })
    ).toBeVisible();
  });

  test("command palette searches modules and opens settings", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT");
    await page.keyboard.press("Control+K");
    await expect(page.getByTestId("command-palette")).toBeVisible();
    await page.getByPlaceholder(/pesquisar módulos|search modules/i).fill("definições");
    await page.getByText(/definições|settings/i).first().click();
    await expect(page).toHaveURL(/settings/);
  });

  test("primary routes have no uncaught console errors", async ({ page }) => {
    const consoleAudit = createConsoleCollector(page);
    consoleAudit.attach();

    for (const route of PRIMARY_ROUTES) {
      await gotoAndWait(page, route);
      await expect(page.getByRole("main").first()).toBeVisible();
    }

    consoleAudit.assertClean();
  });

  test("customize dashboard opens dialog instead of inert control", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT");
    await page.getByRole("button", { name: /personalizar/i }).click();
    await expect(page.getByRole("heading", { name: /personalizar painel/i })).toBeVisible();
  });
});
