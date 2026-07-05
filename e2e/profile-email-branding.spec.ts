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

test.describe("Profile and email branding", () => {
  test.beforeEach(async ({ page }) => {
    await resetLocalDatabase(page);
  });

  test("configures company profile and sender identity", async ({ page }) => {
    await page.goto("/pt-PT/settings");
    await expect(page.getByText("A carregar definições")).toBeHidden({ timeout: 30000 });

    await page.getByLabel(/nome comercial/i).fill("JH Gomes Test");
    await page.getByRole("button", { name: /guardar alterações/i }).click();
    await expect(page.getByText(/definições guardadas/i)).toBeVisible();

    await page.getByRole("button", { name: /identidades de remetente/i }).click();
    await expect(page.getByText(/operador@forgeos\.preview/i).first()).toBeVisible();
    await page.getByRole("button", { name: /guardar alterações/i }).first().click();
    await page.getByLabel(/email de envio/i).fill("branding@synthetic.example");
    await page.getByRole("button", { name: /guardar alterações/i }).click();
    await expect(page.getByText(/definições guardadas|identidade de remetente guardada/i)).toBeVisible();
    await page.reload();
    await expect(page.getByText(/a carregar definições/i)).toBeHidden({ timeout: 30000 });
    await page.getByRole("button", { name: /identidades de remetente/i }).click();
    await expect(page.getByText("branding@synthetic.example")).toBeVisible();
  });

  test("shows PT language label", async ({ page }) => {
    await page.goto("/pt-PT");
    await expect(page.getByRole("link", { name: "PT", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "EN", exact: true })).toBeVisible();
  });

  test("keeps OAuth login local when Supabase public config is missing", async ({ page }) => {
    await page.goto("/pt-PT/login");
    await page.getByRole("button", { name: /continuar com google/i }).click();
    await expect(page.getByText(/configuracao publica de autenticacao supabase/i)).toBeVisible();
    await expect(page).not.toHaveURL(/accounts\.google\.com/);
    await page.getByRole("button", { name: /continuar com microsoft/i }).click();
    await expect(page.getByText(/configuracao publica de autenticacao supabase/i)).toBeVisible();
    await expect(page).not.toHaveURL(/login\.microsoftonline\.com/);
  });

  test("generates email with signature and copy actions after approval", async ({ page }) => {
    await page.goto("/pt-PT/leadops/leadops_001");
    await expect(page.getByText(/carregar base de dados|loading local database/i)).toBeHidden({
      timeout: 30000
    });

    const responsePromise = page.waitForResponse(
      (r) => r.url().includes("/api/leadops/generate") && r.request().method() === "POST"
    );
    await page.getByRole("button", { name: /gerar email/i }).click();
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();

    await page.getByRole("button", { name: /aprovar mensagem/i }).click();
    await expect(page.getByRole("button", { name: /copiar texto simples/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /abrir gmail/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /abrir outlook/i })).toBeVisible();
  });
});
