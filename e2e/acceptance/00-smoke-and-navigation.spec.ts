import { expect, test } from "@playwright/test";
import {
  attachPaidCallGuard,
  createConsoleCollector,
  gotoAndWait,
  resetAcceptanceState,
  waitForPersistence
} from "../helpers";

const ROUTES_PT = [
  { path: "/pt-PT", heading: /painel|dashboard|bom dia/i },
  { path: "/pt-PT/demo", heading: /demo de crm|crm até produção/i },
  { path: "/pt-PT/leadops", heading: /contactos comerciais/i },
  { path: "/pt-PT/customers", heading: /clientes/i },
  { path: "/pt-PT/products", heading: /produtos|catálogo/i },
  { path: "/pt-PT/quotations", heading: /orçamentos/i },
  { path: "/pt-PT/quotations/customizer", heading: /personalizador de copos/i },
  { path: "/pt-PT/production", heading: /ordens de produção/i },
  { path: "/pt-PT/inventory", heading: /inventário/i },
  { path: "/pt-PT/machines", heading: /máquinas/i },
  { path: "/pt-PT/maintenance", heading: /manutenção/i },
  { path: "/pt-PT/settings", heading: /definições/i }
];

test.describe("Smoke and navigation", () => {
  test.beforeEach(async ({ page }) => {
    attachPaidCallGuard(page);
    await resetAcceptanceState(page);
  });

  test("starts application with PT locale and dashboard", async ({ page }) => {
    const consoleAudit = createConsoleCollector(page);
    consoleAudit.attach();

    await gotoAndWait(page, "/pt-PT");
    await expect(page.getByRole("link", { name: "PT", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: /bom dia|good morning/i })).toBeVisible();

    consoleAudit.assertClean();
  });

  test("navigates primary modules without unhandled errors", async ({ page }) => {
    const consoleAudit = createConsoleCollector(page);
    consoleAudit.attach();

    for (const route of ROUTES_PT) {
      await gotoAndWait(page, route.path);
      await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible({
        timeout: 20000
      });
    }

    consoleAudit.assertClean();
  });

  test("hosted-only maintenance module shows explanatory shell", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/maintenance");
    await expect(page.getByRole("heading", { name: /manutenção/i })).toBeVisible();
    await expect(page.getByText(/local|pré-visualização|preview|hosted/i).first()).toBeVisible();
  });

  test("switches to English locale and renders EN routes", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT");
    await page.getByRole("link", { name: "EN", exact: true }).click();
    await waitForPersistence(page);
    await expect(page).toHaveURL(/\/en(\/)?$/);
    await expect(page.getByRole("link", { name: "EN", exact: true })).toBeVisible();

    await page.goto("/en/customers");
    await waitForPersistence(page);
    await expect(page.getByRole("heading", { name: /customers|clientes/i })).toBeVisible();
  });
});
