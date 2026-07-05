import path from "node:path";
import { expect, test } from "@playwright/test";
import { BACKUP_VERSION } from "../src/features/backup/service";
import {
  assertGenerateUsesDeterministicProvider,
  attachPaidCallGuard,
  clickDemoActionStep,
  createConsoleCollector,
  DEMO_WALKTHROUGH_DB_NAME,
  DEMO_WALKTHROUGH_TENANT_ID,
  dismissConfirmDialog,
  gotoAndWait,
  resetDemoWalkthroughState,
  uploadCustomizerArtwork,
  waitForCupCatalog,
  waitForLeadOutreachReady,
  waitForOperationsSeed,
  waitForPersistence
} from "./helpers";

const MIXED_LEADS_CSV = path.join(__dirname, "fixtures/leads-mixed.csv");
const CAMPAIGN_NAME = "Walkthrough Outreach Campaign";

function quoteRow(page: import("@playwright/test").Page, quoteNumber: string) {
  return page.getByRole("row").filter({ hasText: quoteNumber });
}

async function openQuoteRowMenu(page: import("@playwright/test").Page, quoteNumber: string) {
  await quoteRow(page, quoteNumber).getByRole("button", { name: /^ações$/i }).click();
}

test.describe("ForgeOS 0.2.0 integrated demo walkthrough", () => {
  test.beforeEach(async ({ page }) => {
    attachPaidCallGuard(page);
    await page.route("**/api/outreach/send-jobs/tenant-memberships", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        json: {
          ok: true,
          result: { memberships: [], selectedTenantId: null }
        }
      });
    });
    await page.route("**/api/outreach/send-jobs/prepare-campaign/status?**", async (route) => {
      await route.fulfill({
        contentType: "application/json",
        json: {
          ok: true,
          result: {
            activity: [],
            campaignId: "campaign_walkthrough",
            preparedAt: null,
            preparedBy: null,
            preparedRecipients: 0,
            snapshotFingerprint: null,
            status: "not_prepared"
          }
        }
      });
    });
    await resetDemoWalkthroughState(page);
  });

  test("workflow A — commercial outreach end to end", async ({ page }) => {
    const consoleAudit = createConsoleCollector(page);
    consoleAudit.attach();

    await gotoAndWait(page, "/pt-PT/leadops");
    await page.getByTestId("lead-import-file-input").setInputFiles(MIXED_LEADS_CSV);
    await expect(page.getByTestId("import-metric-valid")).toBeVisible();
    await expect(page.getByTestId("import-metric-duplicates")).toBeVisible();
    await expect(page.getByTestId("import-metric-invalid")).toBeVisible();
    await page.getByTestId("lead-import-confirm").click();
    await expect(page.getByTestId("lead-import-result")).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole("cell", { name: "Acceptance Mixed Valid" })).toBeVisible();

    await page.getByTestId("lead-search-input").fill("Acceptance");
    await page.getByTestId("create-campaign-from-filters").click();
    await page.getByTestId("segment-campaign-name").fill(CAMPAIGN_NAME);
    await page.getByTestId("segment-create-campaign").click();
    await expect(page.getByTestId("campaign-detail-name")).toContainText(CAMPAIGN_NAME, {
      timeout: 30000
    });

    const campaignUrl = page.url();
    await page.getByTestId("generate-campaign-drafts").click();
    await expect(page.getByTestId("campaign-drafts-panel")).toBeVisible();
    await page.getByTestId("bulk-approve-campaign-drafts").click();
    await expect(page.getByTestId("send-job-panel")).toBeVisible();

    await page.getByTestId("queue-simulation-job").click();
    await expect(page.getByText(/tarefa de simulacao criada|queued simulation job/i)).toBeVisible();

    await gotoAndWait(page, "/pt-PT/leadops");
    await page.getByTestId("suppression-email-input").fill("acceptance.mixed.valid@example.invalid");
    await page.getByTestId("suppression-add-button").click();
    await expect(page.getByTestId("suppression-feedback")).toBeVisible();

    await gotoAndWait(page, campaignUrl);
    await page.getByTestId("process-next-send-batch").click();
    await expect(page.getByText("SUPPRESSED")).toBeVisible();
    await expect(page.getByTestId("send-job-skipped")).toHaveText("1");

    await page.reload();
    await waitForPersistence(page);
    await expect(page.getByTestId("campaign-detail-name")).toContainText(CAMPAIGN_NAME);
    await expect(page.getByTestId("send-job-panel")).toBeVisible();

    await gotoAndWait(page, "/en/leadops");
    await expect(page.getByTestId("lead-management-panel")).toBeVisible();

    consoleAudit.assertClean();
  });

  test("workflow B — cup customizer to quotation and production", async ({ page }) => {
    const consoleAudit = createConsoleCollector(page);
    consoleAudit.attach();

    await waitForOperationsSeed(page);
    await gotoAndWait(page, "/pt-PT/quotations/customizer");
    await waitForCupCatalog(page);

    await uploadCustomizerArtwork(page, 1280);
    await expect(page.getByText(/arte carregada/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("cup-preview-artwork")).toBeVisible();

    await page.getByRole("button", { name: /guardar simula/i }).click();
    await expect(page.getByText(/simulação guardada/i)).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: /gerar mockup realista/i }).click();
    await expect(page.getByText(/visualização realista gerada/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId("cup-mockup-image")).toBeVisible();

    await page.getByRole("button", { name: /criar or/i }).click();
    await expect(page).toHaveURL(/\/pt-PT\/quotations$/);
    const quoteCell = page.getByRole("cell", { name: /QT-/ }).first();
    await expect(quoteCell).toBeVisible({ timeout: 15000 });
    const quoteNumber = (await quoteCell.textContent())?.trim() ?? "";
    expect(quoteNumber).toMatch(/^QT-/);

    await openQuoteRowMenu(page, quoteNumber);
    await page
      .getByTestId("data-table-action-menu")
      .getByRole("menuitem", { name: /abrir no personalizador/i })
      .click();
    await expect(page).toHaveURL(/simulationId=/);
    await expect(page.getByText(/estimativa/i).first()).toBeVisible();

    await gotoAndWait(page, "/pt-PT/quotations");
    await openQuoteRowMenu(page, quoteNumber);
    await page.getByTestId("data-table-action-menu").getByRole("menuitem", { name: /^aprovar$/i }).click();
    await expect(quoteRow(page, quoteNumber).getByText(/aprovado/i)).toBeVisible();

    await gotoAndWait(page, "/pt-PT/quotations/customizer");
    await page.getByRole("button", { name: /criar or/i }).click();
    await gotoAndWait(page, "/pt-PT/quotations");
    await expect(page.getByRole("cell", { name: quoteNumber })).toHaveCount(1);

    await openQuoteRowMenu(page, quoteNumber);
    await page
      .getByTestId("data-table-action-menu")
      .getByRole("menuitem", { name: /criar ordem de produção/i })
      .click();
    await expect(page.getByTestId("quotation-action-feedback")).toContainText(/PO-|ordem de produção/i);

    await openQuoteRowMenu(page, quoteNumber);
    await expect(
      page
        .getByTestId("data-table-action-menu")
        .getByRole("menuitem", { name: /criar ordem de produção/i })
    ).toBeDisabled();

    await gotoAndWait(page, "/pt-PT/production");
    await expect(page.getByRole("cell", { name: /PO-/ }).first()).toBeVisible();

    await page.reload();
    await waitForPersistence(page);
    await gotoAndWait(page, "/pt-PT/quotations");
    await expect(page.getByRole("cell", { name: quoteNumber })).toBeVisible();

    consoleAudit.assertClean();
  });

  test("workflow C — customer to production with dashboard update", async ({ page }) => {
    const consoleAudit = createConsoleCollector(page);
    consoleAudit.attach();

    await gotoAndWait(page, "/pt-PT/demo");
    await waitForOperationsSeed(page);
    await gotoAndWait(page, "/pt-PT/demo");

    const uniqueEmail = `walkthrough.crm.${Date.now()}@example.invalid`;
    await page.getByLabel(/^email$/i).fill(uniqueEmail);

    await clickDemoActionStep(page, /criar lead/i);
    await clickDemoActionStep(page, /qualificar lead/i);
    await clickDemoActionStep(page, /converter em cliente/i);
    await page.getByRole("button", { name: /abrir em contactos comerciais/i }).click();
    await waitForPersistence(page);
    await gotoAndWait(page, "/pt-PT/demo");
    await clickDemoActionStep(page, /criar orçamento/i);
    await clickDemoActionStep(page, /aprovar orçamento/i);
    await clickDemoActionStep(page, /criar ordem de produção/i);
    await page.getByRole("button", { name: /abrir cartão de trabalho/i }).click();
    await waitForPersistence(page);
    await gotoAndWait(page, "/pt-PT/demo");
    await clickDemoActionStep(page, /atribuir máquina/i);
    await clickDemoActionStep(page, /reservar inventário/i);
    await clickDemoActionStep(page, /registar atividade de produção/i);

    await gotoAndWait(page, "/pt-PT/production");
    await expect(page.getByRole("cell", { name: /PO-/ }).first()).toBeVisible();

    await page.reload();
    await waitForPersistence(page);
    await gotoAndWait(page, "/pt-PT/demo");
    await expect(page.getByRole("button", { name: /registar atividade de produção/i })).toBeDisabled();

    await gotoAndWait(page, "/en/demo");
    await expect(page.getByRole("heading", { name: /crm to production demo/i })).toBeVisible();

    consoleAudit.assertClean();
  });

  test("workflow D — local operations backup reset and deterministic reseed", async ({ page }) => {
    const consoleAudit = createConsoleCollector(page);
    consoleAudit.attach();

    await gotoAndWait(page, "/pt-PT/settings");
    await page.getByLabel(/nome comercial/i).fill("Walkthrough Ops Co");
    await page.getByRole("button", { name: /guardar alterações/i }).click();
    await expect(page.getByText(/definições guardadas/i)).toBeVisible();

    await page.getByRole("button", { name: /identidades de remetente/i }).click();
    await page.getByRole("button", { name: /adicionar identidade/i }).click();
    await expect(page.getByText(/identidade de remetente criada/i)).toBeVisible();

    await page.getByRole("button", { name: /dados e cópia de segurança/i }).click();
    await expect(page.getByText(DEMO_WALKTHROUGH_DB_NAME)).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /exportar cópia json/i }).click();
    const download = await downloadPromise;
    const backupPath = await download.path();
    expect(backupPath).toBeTruthy();

    const fs = await import("node:fs/promises");
    const backupText = await fs.readFile(backupPath!, "utf8");
    const backup = JSON.parse(backupText) as {
      version: number;
      tenantId: string;
      tables: Record<string, unknown[]>;
    };
    expect(backup.version).toBe(BACKUP_VERSION);
    expect(backup.tenantId).toBe(DEMO_WALKTHROUGH_TENANT_ID);

    await page.getByRole("button", { name: /^empresa$/i }).click();
    await page.getByLabel(/nome comercial/i).fill("Temporary Walkthrough Name");
    await page.getByRole("button", { name: /guardar alterações/i }).click();

    await page.getByRole("button", { name: /dados e cópia de segurança/i }).click();
    await page.locator('input[type="file"][accept="application/json"]').setInputFiles(backupPath!);
    await expect(page.getByText(/cópia de segurança restaurada/i)).toBeVisible({ timeout: 30000 });
    await page.reload();
    await waitForPersistence(page);
    await page.getByRole("button", { name: /^empresa$/i }).click();
    await expect(page.getByLabel(/nome comercial/i)).toHaveValue("Walkthrough Ops Co", {
      timeout: 15000
    });

    await page.getByRole("button", { name: /dados e cópia de segurança/i }).click();
    await expect(page.getByText(DEMO_WALKTHROUGH_DB_NAME)).toBeVisible();

    dismissConfirmDialog(page);
    await page.getByRole("button", { name: /repor apenas dados demo/i }).click();
    await expect(page.getByText(/dados demo repostos/i)).toBeVisible({ timeout: 30000 });

    dismissConfirmDialog(page);
    await page.getByRole("button", { name: /restaurar estado demo original/i }).click();
    await expect(page.getByText(/estado demo determinístico restaurado/i)).toBeVisible({
      timeout: 30000
    });

    await gotoAndWait(page, "/pt-PT/leadops");
    await expect(page.getByRole("cell").first()).toBeVisible({ timeout: 45000 });

    await gotoAndWait(page, "/pt-PT/leadops/leadops_001");
    await waitForLeadOutreachReady(page);
    await assertGenerateUsesDeterministicProvider(page, async () => {
      await page.getByRole("button", { name: /gerar email/i }).click();
    });

    consoleAudit.assertClean();
  });
});
