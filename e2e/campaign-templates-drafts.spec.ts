import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  attachHostedPreparationApiMocks,
  attachPaidCallGuard,
  gotoAndWait,
  resetAcceptanceState
} from "./helpers";

test.describe("Campaign templates and drafts", () => {
  test.beforeEach(async ({ page }) => {
    attachPaidCallGuard(page);
    await attachHostedPreparationApiMocks(page);
    await resetAcceptanceState(page);
  });

  test("edits template, generates drafts, edits one recipient, and persists after reload", async ({
    page
  }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await resetAcceptanceState(page, "/pt-PT/leadops");
    const csvPath = path.join(__dirname, "fixtures/leads-mixed.csv");
    await page.getByTestId("lead-import-file-input").setInputFiles(csvPath);
    await page.getByTestId("lead-import-confirm").click();
    await expect(page.getByTestId("lead-import-result")).toBeVisible({ timeout: 30000 });

    await page.getByTestId("lead-search-input").fill("Acceptance");
    await page.getByTestId("create-campaign-from-filters").click();
    await expect(page.getByTestId("segment-builder-dialog")).toBeVisible();
    await page.getByTestId("segment-campaign-name").fill("E2E Template Draft Campaign");
    await page.getByTestId("segment-create-campaign").click();

    await expect(page.getByTestId("campaign-detail-name")).toContainText("E2E Template Draft Campaign", {
      timeout: 30000
    });
    await expect(page.getByTestId("campaign-template-editor")).toBeVisible();
    await expect(page.getByTestId("campaign-template-variables")).toBeVisible();

    const subject = page.getByTestId("campaign-template-subject");
    await subject.fill("Assunto E2E {{companyName}}");
    await page.getByTestId("campaign-template-body").fill(
      "Olá {{contactName}}, mensagem E2E de {{senderName}}."
    );
    await page.getByTestId("save-campaign-template").click();
    await expect(page.getByTestId("campaign-draft-feedback")).toContainText(/guardado|saved/i);

    await page.getByTestId("preview-campaign-template").click();
    await expect(page.getByTestId("campaign-template-preview")).toBeVisible();

    await page.getByTestId("generate-campaign-drafts").click();
    await expect(page.getByTestId("campaign-drafts-panel")).toBeVisible();
    await expect(page.getByTestId("campaign-draft-feedback")).toContainText(/Gerados|Generated/i);

    const firstDraftRow = page.locator('[data-testid^="campaign-draft-row-"]').first();
    await firstDraftRow.click();
    await expect(page.getByTestId("campaign-draft-editor")).toBeVisible();

    const marker = "Persistência E2E XYZ-456";
    await page.getByTestId("campaign-draft-body").fill(marker);
    await page.getByTestId("save-campaign-draft").click();
    await expect(page.getByTestId("campaign-draft-feedback")).toContainText(/guardado|saved/i);

    await page.reload();
    await gotoAndWait(page, page.url());
    await expect(page.getByTestId("campaign-template-editor")).toBeVisible();
    await firstDraftRow.click();
    await expect(page.getByTestId("campaign-draft-body")).toHaveValue(marker);

    await page.getByTestId("campaign-draft-filter").selectOption("edited");
    await expect(firstDraftRow).toBeVisible();

    await gotoAndWait(page, "/en/leadops/campaigns");
    await expect(page.getByRole("heading", { name: /Outreach campaigns|Campanhas de outreach/i })).toBeVisible();

    expect(errors).toEqual([]);
  });
});
