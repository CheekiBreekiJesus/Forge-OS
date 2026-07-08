import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  attachHostedPreparationApiMocks,
  attachPaidCallGuard,
  gotoAndWait,
  resetAcceptanceState
} from "./helpers";
import { assertGmailComposeUrl } from "./helpers/mail-urls";

test.describe("Campaign review and manual send", () => {
  test.beforeEach(async ({ page }) => {
    attachPaidCallGuard(page);
    await attachHostedPreparationApiMocks(page);
    await resetAcceptanceState(page);
  });

  test("approves draft, opens Gmail, confirms external open, marks sent, blocks duplicate", async ({
    page,
    context
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
    await page.getByTestId("segment-campaign-name").fill("E2E Review Send Campaign");
    await page.getByTestId("segment-create-campaign").click();
    await expect(page.getByTestId("campaign-detail-name")).toContainText("E2E Review Send Campaign", {
      timeout: 30000
    });

    await page.getByTestId("generate-campaign-drafts").click();
    await expect(page.getByTestId("campaign-drafts-panel")).toBeVisible();

    const firstRow = page.locator('[data-testid^="campaign-draft-row-"]').first();
    await firstRow.click();
    await page.getByTestId("approve-campaign-draft").click();
    await expect(page.getByTestId("campaign-review-feedback")).toContainText(/aprovado|approved/i);

    const popupPromise = context.waitForEvent("page");
    await page.getByTestId("open-gmail-compose").click();
    const popup = await popupPromise;
    await popup.waitForLoadState("domcontentloaded");
    assertGmailComposeUrl(popup.url(), "acceptance", "Acceptance");
    await popup.close();

    await expect(page.getByTestId("campaign-opened-external-badge")).toBeVisible();
    await expect(page.getByTestId("campaign-sent-manual-badge")).toHaveCount(0);

    await page.getByTestId("mark-sent-externally").click();
    await expect(page.getByTestId("confirm-manual-sent")).toBeVisible();
    await page.getByTestId("confirm-mark-sent").click();
    await expect(page.getByTestId("campaign-sent-manual-badge")).toBeVisible();

    await expect(page.getByTestId("campaign-duplicate-warning")).toBeVisible();
    await expect(page.getByTestId("open-gmail-compose")).toHaveCount(0);

    await gotoAndWait(page, "/en/leadops/campaigns");
    await expect(page.getByRole("heading", { name: /Outreach campaigns|Campanhas de outreach/i })).toBeVisible();
    expect(errors).toEqual([]);
  });
});
