import type { Page } from "@playwright/test";

export async function attachHostedPreparationApiMocks(page: Page) {
  await page.route("**/api/outreach/send-jobs/tenant-memberships", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        ok: true,
        result: {
          memberships: [],
          selectedTenantId: null
        }
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
          campaignId: "campaign_e2e",
          preparedAt: null,
          preparedBy: null,
          preparedRecipients: 0,
          snapshotFingerprint: null,
          status: "not_prepared"
        }
      }
    });
  });
}
