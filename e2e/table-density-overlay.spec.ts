import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const DB_NAME = "forgeos:jhgomes:development";
const FIXTURE_PATH = path.join(__dirname, "fixtures", "synthetic-271-leads.csv");

function ensureSyntheticFixture() {
  const lines = ["company,contact,email,region,industry"];
  for (let index = 0; index < 271; index += 1) {
    lines.push(
      `Synthetic Municipality ${index},Contact ${index},synthetic${index}@example.test,Region ${index % 5},municipality`
    );
  }
  fs.writeFileSync(FIXTURE_PATH, `${lines.join("\n")}\n`, "utf8");
}

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

test.describe("Table density and action overlays", () => {
  test.beforeAll(() => {
    ensureSyntheticFixture();
  });

  test.beforeEach(async ({ page }) => {
    await resetLocalDatabase(page);
    await page.goto("/pt-PT");
    await waitForPersistence(page);
  });

  test("LeadOps lead table shows compact default with expand control", async ({ page }) => {
    await page.goto("/pt-PT/leadops");
    await waitForPersistence(page);
    await page.getByTestId("lead-import-file-input").setInputFiles(FIXTURE_PATH);
    await expect(page.getByTestId("import-metric-valid")).toBeVisible({ timeout: 30000 });
    await page.getByTestId("lead-import-confirm").click();
    await expect(page.getByTestId("lead-import-result")).toBeVisible({ timeout: 60000 });

    const rows = page.locator('[data-testid^="lead-row-"]');
    await expect(rows).toHaveCount(10);
    await expect(page.getByText(/A mostrar 10 de \d+/)).toBeVisible();
    await expect(page.getByTestId("table-show-more")).toBeVisible();

    await page.getByTestId("table-show-more").click();
    await expect(rows).toHaveCount(25);
    await expect(page.getByTestId("table-show-less")).toBeVisible();

    await page.getByTestId("table-show-less").click();
    await expect(rows).toHaveCount(10);
  });

  test("customers table action menu is portaled and clickable", async ({ page }) => {
    await page.goto("/pt-PT/customers");
    await waitForPersistence(page);

    const trigger = page.getByTestId("data-table-action-menu-trigger").first();
    if (await trigger.count()) {
      await trigger.click();
      const menu = page.getByTestId("data-table-action-menu");
      await expect(menu).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
    }
  });

  test("products table route remains available", async ({ page }) => {
    await page.goto("/pt-PT/products");
    await waitForPersistence(page);
    await expect(page.getByRole("heading", { name: /produtos|products/i })).toBeVisible();
  });

  test("campaign list route remains reachable", async ({ page }) => {
    await page.goto("/pt-PT/leadops/campaigns");
    await waitForPersistence(page);
    await expect(page.getByTestId("campaign-list")).toBeVisible();
  });
});
