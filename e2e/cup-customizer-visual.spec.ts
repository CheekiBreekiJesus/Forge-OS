import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const DB_NAME = "forgeos:jhgomes:development";
const SCREENSHOT_DIR = path.resolve(process.cwd(), ".qa/cup-customizer-visual");

async function resetLocalDatabase(page: Page) {
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

async function waitForPersistence(page: Page) {
  await expect(page.getByText(/carregar base de dados|loading local database/i)).toBeHidden({
    timeout: 30000
  });
}

async function openCustomizer(page: Page) {
  await page.goto("/pt-PT/quotations/customizer");
  await waitForPersistence(page);
  await expect(page.getByRole("heading", { name: "Personalizador de Copos" })).toBeVisible();
}

async function selectCupSize(page: Page, sizeMl: string) {
  await page.locator("select").filter({ has: page.locator(`option[value="${sizeMl}"]`) }).first().selectOption(sizeMl);
}

test.describe("Cup Customizer visual validation", () => {
  test.beforeAll(() => {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  });

  test.beforeEach(async ({ page }) => {
    await resetLocalDatabase(page);
    await openCustomizer(page);
  });

  test("preview uses icon day/night controls without artwork alignment selector", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Dia", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Noite", exact: true })).toBeVisible();
    await expect(page.getByText("Posição da arte")).toHaveCount(0);
    await expect(page.getByText("Artwork position")).toHaveCount(0);

    const frame = page.getByTestId("cup-preview-frame");
    await expect(frame).toBeVisible();
    await expect(frame).not.toHaveClass(/border/);

    await page.screenshot({
      fullPage: true,
      path: path.join(SCREENSHOT_DIR, "customizer-layout-pt.png")
    });
  });

  test("all reusable PP sizes render preview screenshots on day and night", async ({ page }) => {
    for (const size of ["250", "330", "430", "500"]) {
      await selectCupSize(page, size);
      await expect(page.getByTestId("cup-preview-cup")).toHaveAttribute(
        "src",
        new RegExp(`/assets/cup-customizer/cups/reusable-pp/${size}ml\\.png`)
      );
      await page.getByRole("button", { name: "Dia", exact: true }).click();
      await expect(page.getByTestId("cup-preview-scene")).toHaveAttribute(
        "src",
        /\/assets\/cup-customizer\/backgrounds\/day\.png/
      );
      await page.getByTestId("cup-preview-frame").screenshot({
        path: path.join(SCREENSHOT_DIR, `cup-${size}ml-day.png`)
      });

      await page.getByRole("button", { name: "Noite", exact: true }).click();
      await expect(page.getByTestId("cup-preview-scene")).toHaveAttribute(
        "src",
        /\/assets\/cup-customizer\/backgrounds\/night\.png/
      );
      await page.getByTestId("cup-preview-frame").screenshot({
        path: path.join(SCREENSHOT_DIR, `cup-${size}ml-night.png`)
      });
    }
  });

  test("uploaded artwork can be dragged and syncs offset sliders", async ({ page }) => {
    await selectCupSize(page, "430");
    await page.locator('input[type="file"]').setInputFiles("e2e/fixtures/logo.png");
    await expect(page.getByText(/Arte carregada/i)).toBeVisible({ timeout: 10000 });

    const artwork = page.getByTestId("cup-preview-artwork");
    await expect(artwork).toBeVisible();
    const beforeX = Number(await page.getByLabel(/Desvio horizontal/i).inputValue());
    const beforeY = Number(await page.getByLabel(/Desvio vertical/i).inputValue());

    const box = await artwork.boundingBox();
    expect(box).not.toBeNull();
    if (!box) return;

    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 40, startY + 24, { steps: 8 });
    await page.mouse.up();

    await expect
      .poll(async () => Number(await page.getByLabel(/Desvio horizontal/i).inputValue()))
      .not.toBe(beforeX);
    await expect
      .poll(async () => Number(await page.getByLabel(/Desvio vertical/i).inputValue()))
      .not.toBe(beforeY);

    await page.getByTestId("cup-preview-frame").screenshot({
      path: path.join(SCREENSHOT_DIR, "artwork-drag-430ml.png")
    });
  });

  test("rotation slider supports -180 to 180 degrees", async ({ page }) => {
    const rotation = page.getByLabel(/Rota/i);
    await expect(rotation).toHaveAttribute("min", "-180");
    await expect(rotation).toHaveAttribute("max", "180");
    await expect(rotation).toHaveAttribute("step", "1");

    await rotation.fill("-180");
    await expect(rotation).toHaveValue("-180");
    await rotation.fill("180");
    await expect(rotation).toHaveValue("180");

    await page.getByTestId("cup-preview-frame").screenshot({
      path: path.join(SCREENSHOT_DIR, "rotation-range.png")
    });
  });

  test("english locale renders compact preview controls", async ({ page }) => {
    await page.goto("/en/quotations/customizer");
    await waitForPersistence(page);
    await expect(page.getByRole("button", { name: "Day", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Night", exact: true })).toBeVisible();
    await expect(page.getByText("Artwork position")).toHaveCount(0);
    await page.screenshot({
      fullPage: true,
      path: path.join(SCREENSHOT_DIR, "customizer-layout-en.png")
    });
  });
});
