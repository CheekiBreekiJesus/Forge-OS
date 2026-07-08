import { expect, type Page } from "@playwright/test";

const PAID_HOST_PATTERNS = [/abacus\.ai/i, /api\.openai\.com/i, /api\.anthropic\.com/i];

export function attachPaidCallGuard(page: Page): void {
  page.on("request", (request) => {
    const url = request.url();
    if (PAID_HOST_PATTERNS.some((pattern) => pattern.test(url))) {
      throw new Error(`Paid provider request blocked in acceptance tests: ${url}`);
    }
  });
}

export async function assertGenerateUsesDeterministicProvider(
  page: Page,
  action: () => Promise<void>
): Promise<void> {
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/leadops/generate") && response.request().method() === "POST",
    { timeout: 30000 }
  );
  await action();
  const response = await responsePromise;
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as { fallbackUsed?: boolean; mode?: string; provider?: string };
  const provider = (body.provider ?? body.mode ?? "").toLowerCase();
  expect(provider, "expected deterministic outreach provider").toContain("deterministic");
}
