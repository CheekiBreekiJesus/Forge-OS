import { expect, test } from "@playwright/test";

const DB_NAME = "forgeos:jhgomes:development";

async function resetLocalDatabase(page: import("@playwright/test").Page) {
  await page.goto("/pt-PT/demo");
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

test.describe("Local MVP workflow", () => {
  test.beforeEach(async ({ page }) => {
    await resetLocalDatabase(page);
  });

  test("demo creates lead and opens outreach workspace", async ({ page }) => {
    await page.goto("/pt-PT/demo");
    await waitForPersistence(page);

    const uniqueEmail = `e2e.${Date.now()}@example.invalid`;
    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByRole("button", { name: "Criar lead" }).click();
    await expect(page.getByText("Ação concluída")).toBeVisible({ timeout: 15000 });

    await page.getByRole("link", { name: "Abrir em Contactos Comerciais" }).click();
    await waitForPersistence(page);
    await expect(page.getByRole("heading", { name: "Demo Hospitality Client" })).toBeVisible({
      timeout: 15000
    });

    await page.reload();
    await waitForPersistence(page);
    await expect(page.getByRole("heading", { name: "Demo Hospitality Client" })).toBeVisible({
      timeout: 15000
    });
  });

  test("outreach workflow persists after reload on seed lead", async ({ page }) => {
    await page.goto("/pt-PT/leadops/leadops_001");
    await waitForPersistence(page);

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes("/api/leadops/generate") && r.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Gerar email PT-PT" }).click();
    await responsePromise;

    await expect(page.getByRole("textbox", { name: "Assunto" })).not.toHaveValue("", {
      timeout: 15000
    });
    await page.getByRole("button", { name: "Aprovar mensagem" }).click();
    await expect(page.getByRole("button", { name: "Colocar em fila" })).toBeEnabled({
      timeout: 10000
    });
    await page.getByRole("button", { name: "Colocar em fila" }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Simular envio" }).click();

    await expect(page.getByText("Mensagem gerada")).toBeVisible();
    await expect(page.getByText("Enviado", { exact: true }).first()).toBeVisible();

    await page.reload();
    await waitForPersistence(page);
    await expect(page.getByText("Enviado", { exact: true }).first()).toBeVisible({
      timeout: 15000
    });
  });
});
