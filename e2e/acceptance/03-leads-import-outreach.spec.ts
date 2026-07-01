import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  assertGenerateUsesDeterministicProvider,
  attachPaidCallGuard,
  drawer,
  gotoAndWait,
  resetAcceptanceState,
  waitForCreateDrawer
} from "../helpers";

test.describe("Leads, import and outreach", () => {
  test.beforeEach(async ({ page }) => {
    attachPaidCallGuard(page);
    await resetAcceptanceState(page);
  });

  test("creates manual lead with persistence and duplicate warning", async ({ page }) => {
    const email = `manual.${Date.now()}@example.invalid`;
    await gotoAndWait(page, "/pt-PT/leadops#create-lead");
    await waitForCreateDrawer(page, /criar lead/i);
    await drawer(page).getByLabel(/^empresa/i).fill("Manual Acceptance Co");
    await drawer(page).getByLabel(/^contacto/i).fill("Manual User");
    await drawer(page).getByLabel(/^email/i).fill(email);
    await drawer(page).getByRole("button", { name: /^criar$/i }).click();
    await expect(page.getByRole("cell", { name: "Manual Acceptance Co" })).toBeVisible({
      timeout: 15000
    });

    await page.reload();
    await gotoAndWait(page, "/pt-PT/leadops");
    await expect(page.getByRole("cell", { name: "Manual Acceptance Co" })).toBeVisible();

    await page.getByRole("button", { name: /novo lead/i }).click();
    await waitForCreateDrawer(page, /criar lead/i);
    await drawer(page).getByLabel(/^empresa/i).fill("Duplicate Co");
    await drawer(page).getByLabel(/^contacto/i).fill("Dup User");
    await drawer(page).getByLabel(/^email/i).fill(email);
    await drawer(page).getByRole("button", { name: /^criar$/i }).click();
    await expect(page.getByText(/already exists|já existe|duplicate/i)).toBeVisible();
  });

  test("imports mixed CSV with classifications", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/leadops");
    const csvPath = path.join(__dirname, "../fixtures/leads-mixed.csv");
    await page.getByTestId("lead-import-file-input").setInputFiles(csvPath);
    await expect(page.getByTestId("import-metric-valid")).toBeVisible();
    await expect(page.getByTestId("import-metric-duplicates")).toBeVisible();
    await expect(page.getByTestId("import-metric-invalid")).toBeVisible();
    await page.getByTestId("lead-import-confirm").click();
    await expect(page.getByText(/Importados \d+ leads/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("cell", { name: "Acceptance Mixed Valid" })).toBeVisible();
  });

  test("generates deterministic outreach with copy and mail client actions", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/leadops/leadops_001");

    await assertGenerateUsesDeterministicProvider(page, async () => {
      await page.getByRole("button", { name: /gerar email/i }).click();
    });

    const subject = page.getByRole("textbox", { name: /assunto/i });
    await expect(subject).not.toHaveValue("");
    await expect(subject).toHaveValue(/JH Gomes|copos/i);

    await page.getByRole("button", { name: /aprovar mensagem/i }).click();
    await expect(page.getByRole("button", { name: /copiar texto simples/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /abrir gmail/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /abrir outlook/i })).toBeVisible();
  });

  test("invalidates approval after edit and blocks unsubscribed queue", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/leadops/leadops_001");
    await page.getByRole("button", { name: /gerar email/i }).click();
    await expect(page.getByRole("textbox", { name: /assunto/i })).not.toHaveValue("", {
      timeout: 15000
    });
    await page.getByRole("button", { name: /aprovar mensagem/i }).click();
    await page.getByRole("textbox", { name: /mensagem/i }).fill("Edited after approval.");
    await expect(page.getByText(/por aprovar/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /colocar em fila/i })).toBeDisabled();

    await gotoAndWait(page, "/pt-PT/leadops/leadops_006");
    await expect(page.getByRole("button", { name: /colocar em fila/i })).toBeDisabled();
    await expect(page.getByText(/subscrição cancelada|unsubscribed/i)).toBeVisible();
  });

  test("simulates send without claiming live delivery", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/leadops/leadops_001");
    await page.getByRole("button", { name: /gerar email/i }).click();
    await expect(page.getByRole("textbox", { name: /assunto/i })).not.toHaveValue("", {
      timeout: 15000
    });
    await page.getByRole("button", { name: /aprovar mensagem/i }).click();
    await page.getByRole("button", { name: /colocar em fila/i }).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /simular envio/i }).click();
    await expect(page.getByText(/enviado|sent/i).first()).toBeVisible();
  });
});
