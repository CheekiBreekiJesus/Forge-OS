import { expect, test } from "@playwright/test";
import { assertGenerateUsesDeterministicProvider } from "./helpers/paid-call-guard";

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

async function submitGenerateForm(page: import("@playwright/test").Page) {
  return assertGenerateUsesDeterministicProvider(page, async () => {
    await page.getByRole("button", { name: "Gerar email PT-PT" }).click();
  });
}

test.describe("Outreach workflow", () => {
  test.beforeEach(async ({ page }) => {
    await resetLocalDatabase(page);
  });

  test("completes generate, approve, queue, and simulate send on leadops_001", async ({ page }) => {
    await page.goto("/pt-PT/leadops/leadops_001");
    await expect(page.getByText(/carregar base de dados|loading local database/i)).toBeHidden({
      timeout: 30000
    });

    await submitGenerateForm(page);

    const subject = page.getByRole("textbox", { name: "Assunto" });
    await expect(subject).not.toHaveValue("", { timeout: 15000 });
    await expect(subject).toHaveValue(/JH Gomes|copos/i);

    await page.getByRole("textbox", { name: "Mensagem" }).fill(
      "Olá Rita Ferreira,\n\nMensagem editada para validação E2E com copos de plástico personalizados."
    );
    await expect(page.getByText("Por aprovar")).toBeVisible();

    await page.getByRole("button", { name: "Aprovar mensagem" }).click();
    await expect(page.getByRole("button", { name: "Colocar em fila" })).toBeEnabled({
      timeout: 10000
    });
    await page.getByRole("button", { name: "Colocar em fila" }).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Simular envio" }).click();

    await expect(page.getByText("Envio simulado", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Mensagem gerada")).toBeVisible();
  });

  test("requires reapproval after editing an approved message", async ({ page }) => {
    await page.goto("/pt-PT/leadops/leadops_001");
    await expect(page.getByText(/carregar base de dados|loading local database/i)).toBeHidden({
      timeout: 30000
    });

    await submitGenerateForm(page);
    await expect(page.getByRole("textbox", { name: "Assunto" })).not.toHaveValue("", { timeout: 15000 });
    await page.getByRole("button", { name: "Aprovar mensagem" }).click();
    await page.getByRole("textbox", { name: "Mensagem" }).fill("Mensagem alterada após aprovação.");
    await expect(page.getByText("Por aprovar")).toBeVisible();
    await expect(page.getByRole("button", { name: "Colocar em fila" })).toBeDisabled();
  });

  test("blocks queue for unsubscribed or bounced lead", async ({ page }) => {
    await page.goto("/pt-PT/leadops/leadops_006");
    await expect(page.getByText(/carregar base de dados|loading local database/i)).toBeHidden({
      timeout: 30000
    });
    await expect(page.getByRole("button", { name: "Colocar em fila" })).toBeDisabled();
    await expect(page.getByText(/subscrição cancelada/i)).toBeVisible();
  });
});
