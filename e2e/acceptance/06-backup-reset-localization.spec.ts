import { expect, test } from "@playwright/test";
import {
  ACCEPTANCE_TENANT_ID,
  attachPaidCallGuard,
  drawer,
  gotoAndWait,
  resetAcceptanceState,
  waitForCreateDrawer
} from "../helpers";
import { BACKUP_VERSION } from "../../src/features/backup/service";

test.describe("Backup, reset and localization", () => {
  test.beforeEach(async ({ page }) => {
    attachPaidCallGuard(page);
    await resetAcceptanceState(page);
  });

  test("exports JSON backup without secrets", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/settings");
    await page.getByRole("button", { name: /dados e cópia de segurança/i }).click();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /exportar cópia json/i }).click();
    const download = await downloadPromise;
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    const fs = await import("node:fs/promises");
    const text = await fs.readFile(filePath!, "utf8");
    const backup = JSON.parse(text) as {
      version: number;
      exportedAt: string;
      tenantId: string;
      tables: Record<string, unknown[]>;
    };

    expect(backup.version).toBe(BACKUP_VERSION);
    expect(backup.exportedAt).toBeTruthy();
    expect(backup.tenantId).toBe(ACCEPTANCE_TENANT_ID);
    expect(backup.tables.leads?.length).toBeGreaterThan(0);
    expect(text).not.toMatch(/ABACUS_API_KEY|SUPABASE_SERVICE_ROLE|Bearer sk-/);
  });

  test("imports backup after modifying company name", async ({ page }) => {
    await gotoAndWait(page, "/pt-PT/settings");
    await page.getByLabel(/nome comercial/i).fill("Backup Marker Co");
    await page.getByRole("button", { name: /guardar alterações/i }).click();
    await expect(page.getByText(/definições guardadas/i)).toBeVisible();

    await page.getByRole("button", { name: /dados e cópia de segurança/i }).click();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: /exportar cópia json/i }).click();
    const download = await downloadPromise;
    const backupPath = await download.path();
    expect(backupPath).toBeTruthy();

    await page.getByRole("button", { name: /^empresa$/i }).click();
    await page.getByLabel(/nome comercial/i).fill("Temporary Name");
    await page.getByRole("button", { name: /guardar alterações/i }).click();

    await page.getByRole("button", { name: /dados e cópia de segurança/i }).click();
    await page.locator('input[type="file"][accept="application/json"]').setInputFiles(backupPath!);
    await expect(page.getByText(/cópia de segurança restaurada/i)).toBeVisible({ timeout: 30000 });
    await page.reload();
    await expect(page.getByText(/a carregar definições/i)).toBeHidden({ timeout: 30000 });
    await page.getByRole("button", { name: /^empresa$/i }).click();
    await expect(page.getByLabel(/nome comercial/i)).toHaveValue("Backup Marker Co", {
      timeout: 15000
    });
  });

  test("demo reset preserves operational leads", async ({ page }) => {
    const email = `operational.${Date.now()}@example.invalid`;
    await gotoAndWait(page, "/pt-PT/leadops#create-lead");
    await waitForCreateDrawer(page, /criar lead/i);
    await drawer(page).getByLabel(/^empresa/i).fill("Operational Lead Co");
    await drawer(page).getByLabel(/^contacto/i).fill("Ops User");
    await drawer(page).getByLabel(/^email/i).fill(email);
    await drawer(page).getByRole("button", { name: /^criar$/i }).click();
    await expect(page.getByRole("cell", { name: "Operational Lead Co" })).toBeVisible({
      timeout: 15000
    });

    await gotoAndWait(page, "/pt-PT/demo");
    await page.getByRole("button", { name: /repor dados demo/i }).click();
    await page.getByRole("button", { name: /repor dados demo/i }).last().click();
    await gotoAndWait(page, "/pt-PT/leadops");
    await expect(page.getByRole("cell", { name: "Operational Lead Co" })).toBeVisible({
      timeout: 15000
    });
  });

  test("shared records persist across locale switch", async ({ page }) => {
    const company = `Locale Co ${Date.now()}`;
    await gotoAndWait(page, "/pt-PT/leadops#create-lead");
    await waitForCreateDrawer(page, /criar lead/i);
    await drawer(page).getByLabel(/^empresa/i).fill(company);
    await drawer(page).getByLabel(/^contacto/i).fill("Locale User");
    await drawer(page).getByLabel(/^email/i).fill(`locale.${Date.now()}@example.invalid`);
    await drawer(page).getByRole("button", { name: /^criar$/i }).click();
    await expect(page.getByRole("cell", { name: company })).toBeVisible();

    await page.getByRole("link", { name: "EN", exact: true }).click();
    await gotoAndWait(page, "/en/leadops");
    await expect(page.getByRole("cell", { name: company })).toBeVisible();
    expect(page.url()).toContain("/en/leadops");
  });
});
