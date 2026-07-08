import { expect, test } from "@playwright/test";

const liveEnabled = process.env.FORGEOS_LIVE_AI === "1";

test.describe("Optional live Abacus smoke", () => {
  test.skip(!liveEnabled, "Set FORGEOS_LIVE_AI=1 to run live Abacus acceptance smoke");

  test("makes one Abacus outreach generation call", async ({ page }) => {
    await page.goto("/pt-PT/leadops/leadops_001");
    await expect(page.getByText(/carregar base de dados|loading local database/i)).toBeHidden({
      timeout: 45000
    });

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/leadops/generate") && response.request().method() === "POST"
    );
    await page.getByRole("button", { name: /gerar email/i }).click();
    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { provider?: string; subject?: string; body?: string };
    expect(body.subject).toBeTruthy();
    expect(body.body).toBeTruthy();
    if (body.provider) {
      expect(body.provider.toLowerCase()).toContain("abacus");
    }
  });
});
