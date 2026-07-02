import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  attachPaidCallGuard,
  gotoAndWait,
  resetAcceptanceState
} from "./helpers";

async function prepareApprovedCampaign(page: import("@playwright/test").Page) {
  await resetAcceptanceState(page, "/pt-PT/leadops");
  const csvPath = path.join(__dirname, "fixtures/leads-mixed.csv");
  await page.getByTestId("lead-import-file-input").setInputFiles(csvPath);
  await page.getByTestId("lead-import-confirm").click();
  await expect(page.getByTestId("lead-import-result")).toBeVisible({ timeout: 30000 });

  await page.getByTestId("lead-search-input").fill("");
  await page.getByTestId("create-campaign-from-filters").click();
  await page.getByTestId("segment-campaign-name").fill("E2E Send Job Simulation");
  await page.getByTestId("segment-create-campaign").click();
  await expect(page.getByTestId("campaign-detail-name")).toContainText("E2E Send Job Simulation", {
    timeout: 30000
  });

  await page.getByTestId("generate-campaign-drafts").click();
  await expect(page.getByTestId("campaign-drafts-panel")).toBeVisible();
  await page.getByTestId("bulk-approve-campaign-drafts").click();
  await expect(page.getByTestId("send-job-panel")).toBeVisible();
}

test.describe("Campaign send job simulation", () => {
  test.beforeEach(async ({ page }) => {
    attachPaidCallGuard(page);
  });

  test("queues, batches, pauses, resumes, and cancels a local simulation job in PT", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await prepareApprovedCampaign(page);
    await expect(page.getByTestId("send-job-simulation-banner")).toBeVisible();
    await expect(page.getByTestId("send-job-production-incomplete")).toBeVisible();
    await expect(page.getByTestId("send-job-brevo-disabled")).toBeVisible();
    await expect(page.getByTestId("queue-simulation-job")).toBeEnabled();

    await page.getByTestId("queue-simulation-job").click();
    await expect(page.getByText(/tarefa de simulacao criada|queued simulation job/i)).toBeVisible();
    await expect(page.getByTestId("send-job-status")).toContainText("QUEUED");

    await page.getByTestId("queue-simulation-job").click();
    await expect(page.getByText(/ja em fila|already queued/i)).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByTestId("pause-send-job").click();
    await expect(page.getByTestId("send-job-status")).toContainText("PAUSED");
    await expect(page.getByTestId("process-next-send-batch")).toBeDisabled();

    await page.getByTestId("resume-send-job").click();
    await expect(page.getByTestId("send-job-status")).toContainText("QUEUED");

    await page.getByTestId("process-next-send-batch").click();
    await expect(page.getByTestId("send-job-processed")).not.toHaveText("0");

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByTestId("cancel-send-job").click();
    await expect(page.getByTestId("send-job-status")).toContainText("CANCELLED");
    expect(errors).toEqual([]);
  });

  test("renders EN labels, light theme, and mobile layout without real-provider controls", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });

    await prepareApprovedCampaign(page);
    await page.getByRole("button", { name: /tema claro|light theme/i }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await gotoAndWait(page, page.url().replace("/pt-PT/", "/en/"));
    await expect(page.getByTestId("send-job-panel")).toBeVisible();
    await expect(page.getByText(/local simulation only/i)).toBeVisible();
    await expect(page.getByTestId("queue-simulation-job")).toHaveText(/queue simulation/i);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId("send-job-panel")).toBeVisible();
    await expect(page.getByTestId("queue-simulation-job")).toBeVisible();
    await expect(page.getByRole("button", { name: /queue brevo|enviar brevo/i })).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("skips suppressed recipients before processing", async ({ page }) => {
    await resetAcceptanceState(page, "/pt-PT/leadops");
    const csvPath = path.join(__dirname, "fixtures/leads-mixed.csv");
    await page.getByTestId("lead-import-file-input").setInputFiles(csvPath);
    await page.getByTestId("lead-import-confirm").click();
    await expect(page.getByTestId("lead-import-result")).toBeVisible({ timeout: 30000 });

    await page.getByTestId("lead-search-input").fill("Acceptance");
    await page.getByTestId("create-campaign-from-filters").click();
    await page.getByTestId("segment-campaign-name").fill("E2E Send Job Suppression");
    await page.getByTestId("segment-create-campaign").click();
    await expect(page.getByTestId("campaign-detail-name")).toContainText("E2E Send Job Suppression", {
      timeout: 30000
    });
    await page.getByTestId("generate-campaign-drafts").click();
    await page.getByTestId("bulk-approve-campaign-drafts").click();

    const campaignUrl = page.url();
    await page.getByTestId("queue-simulation-job").click();
    await expect(page.getByTestId("send-job-status")).toContainText("QUEUED");

    await gotoAndWait(page, "/pt-PT/leadops");
    await page.getByTestId("suppression-email-input").fill("acceptance.mixed.valid@example.invalid");
    await page.getByTestId("suppression-add-button").click();
    await expect(page.getByTestId("suppression-feedback")).toBeVisible();

    await gotoAndWait(page, campaignUrl);
    await page.getByTestId("process-next-send-batch").click();
    await expect(page.getByText("SUPPRESSED")).toBeVisible();
    await expect(page.getByTestId("send-job-skipped")).toHaveText("1");
  });
});
