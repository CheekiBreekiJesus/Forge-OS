import { expect, type Page } from "@playwright/test";
import { clearIndexedDb, waitForPersistence } from "./persistence";

/** Matches scripts/demo/contract.mjs DEMO_DB_NAME */
export const DEMO_WALKTHROUGH_DB_NAME = "forgeos:jhgomes:0.2.0-demo";
export const DEMO_WALKTHROUGH_TENANT_ID = "tenant_jh_gomes";

export async function resetDemoWalkthroughState(page: Page, path = "/pt-PT"): Promise<void> {
  await page.goto(path);
  await clearIndexedDb(page, DEMO_WALKTHROUGH_DB_NAME);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await waitForPersistence(page);
}

export async function uploadCustomizerArtwork(page: Page, viewportWidth: number): Promise<void> {
  if (viewportWidth < 1024) {
    await page.getByRole("button", { name: /^arte$|^artwork$/i }).click();
    await page.locator('input[type="file"]').setInputFiles("e2e/fixtures/logo.png");
    const previewStep = page.getByRole("button", { name: /^pré-visualização$|^preview$/i });
    if (await previewStep.isVisible()) {
      await previewStep.click();
    }
  } else {
    await page.locator('input[type="file"]').first().setInputFiles("e2e/fixtures/logo.png");
  }
}

export async function expectDemoStepSuccess(page: Page): Promise<void> {
  await expect(page.getByText(/ação falhou|action failed/i)).toBeHidden({ timeout: 5000 });
  await expect(page.getByText(/ação concluída|action completed/i)).toBeVisible({ timeout: 30000 });
}

export async function clickDemoActionStep(page: Page, name: RegExp | string): Promise<void> {
  await page.getByRole("button", { name }).click();
  await expectDemoStepSuccess(page);
}

export async function dismissConfirmDialog(page: Page): Promise<void> {
  page.once("dialog", async (dialog) => {
    await dialog.accept();
  });
}
