import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
});

async function submitGenerateForm(page: import("@playwright/test").Page) {
  const responsePromise = page.waitForResponse(
    (request) =>
      request.url().includes("/api/leadops/generate") && request.request().method() === "POST"
  );

  await page.getByRole("button", { name: "Gerar email PT-PT" }).click();

  return responsePromise;
}

test.describe("Outreach workflow", () => {
  test("completes generate, approve, queue, and simulate send on leadops_001", async ({ page }) => {
    await page.goto("/pt-PT/leadops/leadops_001");

    const response = await submitGenerateForm(page);
    expect(response.ok()).toBeTruthy();

    const subject = page.getByRole("textbox", { name: "Assunto" });
    await expect(subject).not.toHaveValue("", { timeout: 15000 });
    await expect(subject).toHaveValue(/JH Gomes|copos/i);

    await page.getByRole("textbox", { name: "Mensagem" }).fill(
      "Olá Rita Ferreira,\n\nMensagem editada para validação E2E com copos de plástico personalizados."
    );
    await expect(page.getByText("Por aprovar")).toBeVisible();

    await page.getByRole("button", { name: "Aprovar mensagem" }).click();
    await page.getByRole("button", { name: "Colocar em fila" }).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Simular envio" }).click();

    await expect(page.getByText("Enviado")).toBeVisible();
    await expect(page.getByText("Mensagem gerada")).toBeVisible();
  });

  test("requires reapproval after editing an approved message", async ({ page }) => {
    await page.goto("/pt-PT/leadops/leadops_001");

    await submitGenerateForm(page);
    await expect(page.getByRole("textbox", { name: "Assunto" })).not.toHaveValue("", { timeout: 15000 });
    await page.getByRole("button", { name: "Aprovar mensagem" }).click();
    await page.getByRole("textbox", { name: "Mensagem" }).fill("Mensagem alterada após aprovação.");
    await expect(page.getByText("Por aprovar")).toBeVisible();
    await expect(page.getByRole("button", { name: "Colocar em fila" })).toBeDisabled();
  });

  test("blocks queue for unsubscribed or bounced lead", async ({ page }) => {
    await page.goto("/pt-PT/leadops/leadops_006");
    await expect(page.getByRole("button", { name: "Colocar em fila" })).toBeDisabled();
    await expect(page.getByText("subscrição cancelada")).toBeVisible();
  });
});
