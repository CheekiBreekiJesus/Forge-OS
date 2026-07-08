import { test, expect } from "@playwright/test";
import {
  attachPaidCallGuard,
  createConsoleCollector,
  gotoAndWait,
  resetAcceptanceState,
  waitForPersistence
} from "../helpers";

test.describe("Dashboard visual refresh", () => {
  test.beforeEach(async ({ page }) => {
    attachPaidCallGuard(page);
    await resetAcceptanceState(page);
  });

  test("renders dark dashboard KPI cards and OEE panel", async ({ page }) => {
    const consoleAudit = createConsoleCollector(page);
    consoleAudit.attach();

    await gotoAndWait(page, "/pt-PT");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByRole("heading", { name: /bom dia/i })).toBeVisible();
    await expect(page.getByText(/produção oee|production oee/i).first()).toBeVisible();
    await expect(page.getByText(/receita|revenue/i).first()).toBeVisible();

    consoleAudit.assertClean();
  });

  test("switches to light theme and persists after reload", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT");
    await page.getByRole("button", { name: /tema claro|light theme/i }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.reload();
    await waitForPersistence(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("theme persists across locale switch", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT");
    await page.getByRole("button", { name: /tema claro|light theme/i }).click();
    await page.getByRole("link", { name: "EN", exact: true }).click();
    await waitForPersistence(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("opens customize dialog and saves layout", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT");
    await page.getByRole("button", { name: /personalizar|customize/i }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: /guardar layout|save layout/i }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("navigates outreach and marketing routes from refreshed shell", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT");
    await page.getByRole("navigation").getByRole("link", { name: /contactos comerciais/i }).click();
    await waitForPersistence(page);
    await expect(page).toHaveURL(/\/leadops/);

    await page.goto("/pt-PT/marketing");
    await waitForPersistence(page);
    await expect(page.getByRole("heading", { name: /marketing/i })).toBeVisible();
  });
});
