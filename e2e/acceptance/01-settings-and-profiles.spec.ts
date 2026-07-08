import path from "node:path";
import { expect, test } from "@playwright/test";
import { attachPaidCallGuard, gotoAndWait, resetAcceptanceState } from "../helpers";

test.describe("Settings and profiles", () => {
  test.beforeEach(async ({ page }) => {
    attachPaidCallGuard(page);
    await resetAcceptanceState(page);
  });

  test("persists company profile and logo upload", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/settings");

    await page.getByLabel(/nome comercial/i).fill("JH Gomes Test");
    await page.getByLabel(/nome legal/i).fill("JH Gomes Test, Lda.");
    await page.getByLabel(/^nif$/i).fill("PT500000000");
    await page.getByLabel(/url do website/i).fill("https://example.com");
    await page.getByLabel(/email geral/i).fill("commercial@example.com");
    await page.getByLabel(/telefone geral/i).fill("+351 244 000 000");
    await page.getByRole("button", { name: /guardar alterações/i }).click();
    await expect(page.getByText(/definições guardadas/i)).toBeVisible();

    const logoPath = path.join(__dirname, "../fixtures/logo.png");
    await page.locator('input[type="file"][accept="image/*"]').first().setInputFiles(logoPath);
    await expect(page.getByText(/logótipo carregado/i)).toBeVisible();

    await page.reload();
    await expect(page.getByText(/a carregar definições/i)).toBeHidden({ timeout: 30000 });
    await expect(page.getByLabel(/nome comercial/i)).toHaveValue("JH Gomes Test");
    await expect(page.locator('img[alt="Logo"]')).toBeVisible();
  });

  test("rejects invalid company website URL", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/settings");
    await page.getByLabel(/url do website/i).fill("ftp://invalid.example");
    await page.getByRole("button", { name: /guardar alterações/i }).click();
    await expect(page.getByText(/url do website inválido/i)).toBeVisible();
  });

  test("persists user profile after reload", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/settings");
    await page.getByRole("button", { name: /o meu perfil/i }).click();
    await page.getByLabel(/nome completo/i).fill("Acceptance Operator");
    await page.getByLabel(/^cargo$/i).fill("QA Engineer");
    await page.getByRole("button", { name: /guardar alterações/i }).click();
    await expect(page.getByText(/definições guardadas/i)).toBeVisible();

    await page.reload();
    await expect(page.getByText(/a carregar definições/i)).toBeHidden({ timeout: 30000 });
    await page.getByRole("button", { name: /o meu perfil/i }).click();
    await expect(page.getByLabel(/nome completo/i)).toHaveValue("Acceptance Operator");
  });

  test("manages sender identities with signature preview", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/settings");
    await page.getByRole("button", { name: /identidades de remetente/i }).click();
    await page.getByRole("button", { name: /adicionar identidade/i }).click();
    await expect(page.getByText(/identidade de remetente criada/i)).toBeVisible();
    await page.getByRole("button", { name: /pré-visualizar assinatura/i }).first().click();
    await expect(page.getByText(/pré-visualização da assinatura/i)).toBeVisible();
    await expect(page.getByText("Predefinida", { exact: true })).toHaveCount(1);
  });

  test("creates local preview team user", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/settings");
    await page.getByRole("button", { name: /^equipa$/i }).click();
    await page.getByRole("button", { name: /adicionar utilizador de pré-visualização/i }).click();
    await expect(page.getByText(/utilizador de pré-visualização adicionado/i)).toBeVisible();
    await expect(page.getByText(/utilizador de pré-visualização local/i).first()).toBeVisible();
  });

  test("auth placeholders explain Google and Microsoft without success", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/login");
    await page.getByRole("button", { name: /continuar com google/i }).click();
    await expect(page.getByRole("heading", { name: /google/i })).toBeVisible();
    await expect(page).not.toHaveURL(/accounts\.google\.com/);
    await page.getByRole("button", { name: /fechar/i }).click();
    await page.getByRole("button", { name: /continuar com microsoft/i }).click();
    await expect(page.getByRole("heading", { name: /microsoft/i })).toBeVisible();
    await expect(page).not.toHaveURL(/login\.microsoftonline\.com/);
  });
});
