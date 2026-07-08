import { expect, type Page } from "@playwright/test";

export async function waitForJsonDownload(page: Page, trigger: () => Promise<void>): Promise<unknown> {
  const downloadPromise = page.waitForEvent("download", { timeout: 30000 });
  await trigger();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  const fs = await import("node:fs/promises");
  const text = await fs.readFile(path!, "utf8");
  return JSON.parse(text) as unknown;
}
