import { expect, test } from "@playwright/test";

const DB_NAME = "forgeos:jhgomes:development";

async function resetLocalDatabase(page: import("@playwright/test").Page) {
  await page.goto("/pt-PT");
  await page.evaluate(async (dbName) => {
    window.localStorage.clear();
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase(dbName);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  }, DB_NAME);
  await page.reload();
}

async function waitForPersistence(page: import("@playwright/test").Page) {
  await expect(page.getByText(/carregar base de dados|loading local database/i)).toBeHidden({
    timeout: 30000
  });
}

test.describe("Module CRUD workflows", () => {
  test.beforeEach(async ({ page }) => {
    await resetLocalDatabase(page);
    await page.goto("/pt-PT");
    await waitForPersistence(page);
  });

  test("customers list loads with create action", async ({ page }) => {
    await page.goto("/pt-PT/customers");
    await waitForPersistence(page);
    await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Novo cliente" })).toBeVisible();
  });

  test("products catalog supports create drawer", async ({ page }) => {
    await page.goto("/pt-PT/products#create");
    await waitForPersistence(page);
    await expect(page.getByRole("heading", { name: "Criar produto" })).toBeVisible({ timeout: 10000 });
  });

  test("machines module renders", async ({ page }) => {
    await page.goto("/pt-PT/machines");
    await waitForPersistence(page);
    await expect(page.getByRole("heading", { name: "Máquinas" })).toBeVisible();
  });

  test("inventory module renders", async ({ page }) => {
    await page.goto("/pt-PT/inventory");
    await waitForPersistence(page);
    await expect(page.getByRole("heading", { name: "Inventário" })).toBeVisible();
  });

  test("quotations route uses quotations slug", async ({ page }) => {
    await page.goto("/pt-PT/quotations");
    await waitForPersistence(page);
    await expect(page.getByRole("heading", { name: "Orçamentos" })).toBeVisible();
  });

  test("production list loads", async ({ page }) => {
    await page.goto("/pt-PT/production");
    await waitForPersistence(page);
    await expect(page.getByRole("heading", { name: "Ordens de produção" })).toBeVisible();
  });

  test("command palette opens with keyboard shortcut", async ({ page }) => {
    await page.goto("/pt-PT/customers");
    await waitForPersistence(page);
    await page.keyboard.press("Control+K");
    await expect(page.getByTestId("command-palette")).toBeVisible();
  });

  test("role preview switcher is visible", async ({ page }) => {
    await page.goto("/pt-PT");
    await waitForPersistence(page);
    await expect(page.getByLabel("Papel de pré-visualização")).toBeVisible();
  });

  test("quick create menu offers actions", async ({ page }) => {
    await page.goto("/pt-PT");
    await waitForPersistence(page);
    await page.getByRole("button", { name: "Criar" }).click();
    await expect(page.getByRole("link", { name: "Cliente", exact: true })).toBeVisible();
  });

  test("leadops create lead drawer via hash", async ({ page }) => {
    await page.goto("/pt-PT/leadops#create-lead");
    await waitForPersistence(page);
    await expect(page.getByRole("heading", { name: "Criar lead" })).toBeVisible({ timeout: 10000 });
  });

  test("show archived toggle on customers", async ({ page }) => {
    await page.goto("/pt-PT/customers");
    await waitForPersistence(page);
    await expect(page.getByText("Mostrar arquivados")).toBeVisible();
  });

  test("customize button shows info dialog", async ({ page }) => {
    await page.goto("/pt-PT");
    await waitForPersistence(page);
    await page.getByRole("button", { name: "Personalizar" }).click();
    await expect(page.getByRole("heading", { name: "Personalizar painel" })).toBeVisible();
  });
});
