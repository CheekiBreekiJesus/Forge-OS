import { expect, type Page } from "@playwright/test";
import { ACCEPTANCE_DB_NAME } from "./env";

export async function clearIndexedDb(page: Page, dbName = ACCEPTANCE_DB_NAME): Promise<void> {
  await page.evaluate(async (name) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  }, dbName);
}

export async function resetAcceptanceState(page: Page, path = "/pt-PT"): Promise<void> {
  await page.goto(path);
  await clearIndexedDb(page);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await waitForPersistence(page);
}

export async function waitForPersistence(page: Page): Promise<void> {
  await expect(page.getByText(/carregar base de dados|loading local database|a carregar definições/i)).toBeHidden({
    timeout: 45000
  });
}

export async function gotoAndWait(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await waitForPersistence(page);
}

export async function waitForCreateDrawer(page: Page, title: RegExp | string): Promise<void> {
  const panel = drawer(page);
  await expect(panel).toBeVisible({ timeout: 15000 });
  await expect(panel.getByRole("heading")).toHaveText(title);
}

export function drawer(page: Page) {
  return page.getByTestId("entity-form-drawer");
}

export async function waitForOperationsSeed(page: Page): Promise<void> {
  await gotoAndWait(page, "/pt-PT/machines");
  await expect(page.getByRole("heading", { name: /máquinas|machines/i })).toBeVisible();
  await expect(page.getByRole("cell").first()).toBeVisible({ timeout: 45000 });
}

export async function waitForCupCatalog(page: Page): Promise<void> {
  await expect(page.getByRole("heading", { name: /estimativa de preço|price estimate/i })).toBeVisible({
    timeout: 45000
  });
}

/** Lead detail loads campaigns after persistence init; generation is a no-op until then. */
export async function waitForLeadOutreachReady(page: Page): Promise<void> {
  const generateButton = page.getByRole("button", { name: /gerar email/i });
  await expect(generateButton).toBeVisible({ timeout: 15000 });
  await expect(generateButton).toBeEnabled();
  await expect(page.locator("select option").first()).toBeAttached({ timeout: 15000 });
}
