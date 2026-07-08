import { expect, test } from "@playwright/test";
import { attachPaidCallGuard, gotoAndWait, resetAcceptanceState, waitForOperationsSeed, waitForPersistence } from "../helpers";

test.describe("Demo commercial flow", () => {
  test.beforeEach(async ({ page }) => {
    attachPaidCallGuard(page);
    await resetAcceptanceState(page);
  });

  test("runs CRM to production demo with mid-run persistence", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/demo");
    await waitForOperationsSeed(page);
    await gotoAndWait(page, "/pt-PT/demo");

    const uniqueEmail = `demo.flow.${Date.now()}@example.invalid`;
    await page.getByLabel(/^email$/i).fill(uniqueEmail);

    const expectStepSuccess = async () => {
      await expect(page.getByText(/ação falhou|action failed/i)).toBeHidden({ timeout: 5000 });
      await expect(page.getByText(/ação concluída|action completed/i)).toBeVisible({ timeout: 30000 });
    };

    const clickActionStep = async (name: RegExp | string) => {
      await page.getByRole("button", { name }).click();
      await expectStepSuccess();
    };

    const clickNavigationStep = async (name: RegExp | string) => {
      await page.getByRole("button", { name }).click();
    };

    await clickActionStep(/criar lead/i);
    await clickActionStep(/qualificar lead/i);
    await clickActionStep(/converter em cliente/i);

    await clickNavigationStep(/abrir em contactos comerciais/i);
    await waitForPersistence(page);
    await page.goto("/pt-PT/demo");
    await waitForPersistence(page);

    await clickActionStep(/criar orçamento/i);
    await clickActionStep(/aprovar orçamento/i);
    await clickActionStep(/criar ordem de produção/i);

    await clickNavigationStep(/abrir cartão de trabalho/i);
    await waitForPersistence(page);
    await page.goto("/pt-PT/demo");
    await waitForPersistence(page);

    await clickActionStep(/atribuir máquina/i);
    await clickActionStep(/reservar inventário/i);
    await clickActionStep(/registar atividade de produção/i);

    await page.reload();
    await waitForPersistence(page);
    await expect(page.getByRole("button", { name: /registar atividade de produção/i })).toBeDisabled();
  });
});
