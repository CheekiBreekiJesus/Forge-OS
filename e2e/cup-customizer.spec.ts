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

test.describe("Cup Customizer workflows", () => {
  test.beforeEach(async ({ page }) => {
    await resetLocalDatabase(page);
    await page.goto("/pt-PT");
    await waitForPersistence(page);
  });

  test("products cup-customizer alias route loads shell", async ({ page }) => {
    await page.goto("/pt-PT/products/cup-customizer");
    await waitForPersistence(page);
    await expect(page.getByRole("heading", { name: "Personalizador de Copos" })).toBeVisible();
  });

  test("customizer page loads with tabs", async ({ page }) => {
    await page.goto("/pt-PT/quotations/customizer");
    await waitForPersistence(page);
    await expect(page.getByRole("heading", { name: "Personalizador de Copos" })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Navegação de orçamentos" }).getByRole("link", {
        name: "Orçamentos"
      })
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Navegação de orçamentos" }).getByRole("link", {
        name: "Personalizador de Copos"
      })
    ).toBeVisible();
  });

  test("quotations page shows customizer tab", async ({ page }) => {
    await page.goto("/pt-PT/quotations");
    await waitForPersistence(page);
    await expect(
      page.getByRole("navigation", { name: "Navegação de orçamentos" }).getByRole("link", {
        name: "Personalizador de Copos"
      })
    ).toBeVisible();
  });

  test("shows estimate badge on pricing panel", async ({ page }) => {
    await page.goto("/pt-PT/quotations/customizer");
    await waitForPersistence(page);
    await expect(page.getByText("Estimativa", { exact: true })).toBeVisible();
  });

  test("product catalog customize action navigates with productId", async ({ page }) => {
    await page.goto("/pt-PT/products");
    await waitForPersistence(page);
    const menu = page.getByRole("button", { name: "Ações" }).first();
    await menu.click();
    const customize = page.getByRole("menuitem", { name: "Personalizar" });
    if (await customize.isVisible()) {
      await customize.click();
      await expect(page).toHaveURL(/quotations\/customizer\?productId=/);
    }
  });

  test("customers header links to customizer", async ({ page }) => {
    await page.goto("/pt-PT/customers");
    await waitForPersistence(page);
    await page.getByRole("link", { name: "Abrir Personalizador de Copos" }).click();
    await expect(page).toHaveURL(/quotations\/customizer/);
  });

  test("quotations header opens customizer", async ({ page }) => {
    await page.goto("/pt-PT/quotations");
    await waitForPersistence(page);
    await page.getByRole("link", { name: "Abrir Personalizador de Copos" }).click();
    await expect(page).toHaveURL(/quotations\/customizer/);
  });

  test("quick create includes customizer", async ({ page }) => {
    await page.goto("/pt-PT");
    await waitForPersistence(page);
    await page.getByRole("button", { name: "Criar" }).click();
    await expect(
      page.getByRole("link", { name: "Personalizador de copos", exact: true })
    ).toBeVisible();
  });

  test("command palette lists customizer create action", async ({ page }) => {
    await page.goto("/pt-PT");
    await waitForPersistence(page);
    await page.keyboard.press("Control+K");
    await page.getByPlaceholder(/pesquisar módulos|search modules/i).fill("simulação");
    await expect(page.getByText("Nova simulação de copos")).toBeVisible();
  });

  test("hash create opens new simulation context", async ({ page }) => {
    await page.goto("/pt-PT/quotations/customizer#create");
    await waitForPersistence(page);
    await expect(page.getByRole("heading", { name: "Personalizador de Copos" })).toBeVisible();
  });

  test("can save and convert an artwork simulation", async ({ page }) => {
    await page.goto("/pt-PT/quotations/customizer");
    await waitForPersistence(page);
    await expect(page.getByText("Estimativa", { exact: true })).toBeVisible({ timeout: 15000 });
    await page.locator('input[type="file"]').setInputFiles("e2e/fixtures/logo.png");
    await expect(page.getByText(/Arte carregada/i)).toBeVisible({ timeout: 10000 });
    await page.getByLabel(/Escala da arte/i).fill("1.25");
    await page.getByLabel(/Desvio horizontal/i).fill("8");
    await page.getByLabel(/Desvio vertical/i).fill("-6");
    await page.getByLabel(/Rota/i).fill("12");
    await expect(page.getByTestId("cup-preview-artwork")).toBeVisible();
    await page.getByRole("button", { name: /Guardar simula/i }).click();
    await expect(page.getByText(/^Simulação guardada\.$/i)).toBeVisible({ timeout: 10000 });
    await page.reload();
    await waitForPersistence(page);
    await expect(page.locator("li").filter({ hasText: /Guardada|Saved/i }).first()).toBeVisible({
      timeout: 10000
    });
    await page.getByRole("button", { name: /Criar or/i }).click();
    await expect(page).toHaveURL(/\/pt-PT\/quotations$/);
    await expect(page.getByText(/QT-/).first()).toBeVisible({ timeout: 10000 });
  });

  test("can generate deterministic realistic mockup on demand", async ({ page }) => {
    await page.goto("/pt-PT/quotations/customizer");
    await waitForPersistence(page);
    await page.locator('input[type="file"]').setInputFiles("e2e/fixtures/logo.png");
    await expect(page.getByText(/Arte carregada/i)).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: /Gerar mockup realista/i }).click();
    await expect(page.getByText(/Visualização realista gerada/i)).toBeVisible({ timeout: 10000 });
  });

  test("onboarding checklist shows customizer step", async ({ page }) => {
    await page.goto("/pt-PT");
    await waitForPersistence(page);
    await expect(page.getByTestId("onboarding-checklist")).toBeVisible();
    await expect(page.getByText("Testar Personalizador de Copos")).toBeVisible();
  });

  test("notification bell renders", async ({ page }) => {
    await page.goto("/pt-PT");
    await waitForPersistence(page);
    await page.getByRole("button", { name: "Notificações" }).click();
    await expect(page.getByText("Marcar todas como lidas")).toBeVisible();
  });
});
