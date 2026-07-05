import { expect, test } from "@playwright/test";
import {
  ACCEPTANCE_DB_NAME,
  attachPaidCallGuard,
  createConsoleCollector,
  gotoAndWait,
  resetAcceptanceState,
  waitForPersistence
} from "../helpers";

const CRITICAL_ROUTES = [
  { path: "/pt-PT/login", heading: /entrar|login|forgeos/i },
  { path: "/pt-PT", heading: /bom dia|good morning|painel/i },
  { path: "/pt-PT/customers", heading: /clientes/i },
  { path: "/pt-PT/leadops", heading: /contactos comerciais/i },
  { path: "/pt-PT/leadops/campaigns", heading: /campanhas/i },
  { path: "/pt-PT/products", heading: /produtos|catálogo/i },
  { path: "/pt-PT/quotations/customizer", heading: /personalizador de copos/i },
  { path: "/pt-PT/quotations", heading: /orçamentos/i },
  { path: "/pt-PT/production", heading: /ordens de produção/i },
  { path: "/pt-PT/machines", heading: /máquinas/i },
  { path: "/pt-PT/inventory", heading: /inventário/i },
  { path: "/pt-PT/settings", heading: /definições/i }
] as const;

const VIEWPORTS = [
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1366x768", width: 1366, height: 768 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "768x1024", width: 768, height: 1024 },
  { name: "390x844", width: 390, height: 844 }
] as const;

test.describe("ForgeOS 0.2.0 critical route audit", () => {
  test.beforeEach(async ({ page }) => {
    attachPaidCallGuard(page);
    await resetAcceptanceState(page);
  });

  for (const viewport of VIEWPORTS) {
    test(`critical routes render at ${viewport.name} without horizontal overflow`, async ({ page }) => {
      const consoleAudit = createConsoleCollector(page);
      consoleAudit.attach();

      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const route of CRITICAL_ROUTES) {
        await gotoAndWait(page, route.path);
        await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible({
          timeout: 20000
        });
        const overflow = await page.evaluate(() => {
          const doc = document.documentElement;
          return doc.scrollWidth - doc.clientWidth;
        });
        expect(overflow, `${route.path} overflow at ${viewport.name}`).toBeLessThan(40);
      }

      consoleAudit.assertClean();
    });
  }

  test("mobile navigation drawer opens and links to customers", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoAndWait(page, "/pt-PT");
    await page.getByRole("button", { name: /abrir menu de navegação|open menu/i }).click();
    const drawer = page.locator("#forgeos-mobile-nav");
    await expect(drawer).toBeVisible();
    await drawer.getByRole("link", { name: /clientes/i }).click();
    await waitForPersistence(page);
    await expect(page).toHaveURL(/\/pt-PT\/customers/);
    await expect(page.getByRole("heading", { name: /clientes/i })).toBeVisible();
  });

  test("settings backup section shows active IndexedDB name", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/settings");
    await page.getByRole("button", { name: /dados e cópia de segurança/i }).click();
    await expect(page.getByText(ACCEPTANCE_DB_NAME)).toBeVisible();
  });

  test("footer shows local demo environment in local persistence mode", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT");
    await expect(page.getByText(/demo local/i)).toBeVisible();
  });

  test("settings destructive actions require confirmation", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/settings");
    await page.getByRole("button", { name: /dados e cópia de segurança/i }).click();

    let dialogCount = 0;
    page.on("dialog", async (dialog) => {
      dialogCount += 1;
      await dialog.dismiss();
    });

    await page.getByRole("button", { name: /repor apenas dados demo/i }).click();
    expect(dialogCount).toBe(1);

    await page.getByRole("button", { name: /limpar todos os dados locais/i }).click();
    expect(dialogCount).toBe(2);

    await page.getByRole("button", { name: /restaurar estado demo original/i }).click();
    expect(dialogCount).toBe(3);
  });

  test("local login route exposes preview entry", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/login");
    await expect(page.getByRole("heading", { name: /entrar no forgeos/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /entrar no painel/i })).toBeVisible();
  });
});
