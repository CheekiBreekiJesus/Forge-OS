/**
 * Private import acceptance runner — aggregate metrics only, no row content.
 */
import { chromium, type Page } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

const BASE_URL = process.env.ACCEPTANCE_BASE_URL ?? "http://localhost:3002";
const DB_NAME = process.env.FORGEOS_LOCAL_DB_NAME ?? "forgeos:private:import-acceptance";
const PORTUGAL_LEADS_DIR =
  process.env.PRIVATE_ACCEPTANCE_LEADS_DIR ??
  "C:\\Users\\J35U5\\Desktop\\JH Gomes\\Databases\\Lead Databases\\Portugal";

function resolveWorkbookPath(): string {
  if (process.env.PRIVATE_ACCEPTANCE_WORKBOOK) {
    return process.env.PRIVATE_ACCEPTANCE_WORKBOOK;
  }
  const match = fs
    .readdirSync(PORTUGAL_LEADS_DIR)
    .find((name) => name.toLowerCase().startsWith("municipios"));
  return match ? path.join(PORTUGAL_LEADS_DIR, match) : "";
}

const WORKBOOK = resolveWorkbookPath();

const TARGET_SHEET = process.env.PRIVATE_ACCEPTANCE_SHEET ?? "Municipalidades";
const PROFILE_LABEL = process.env.PRIVATE_ACCEPTANCE_PROFILE ?? "Municipalities";

type Metrics = {
  workbookCategory: string;
  selectedSheet: string;
  sheetOptionsCount: number;
  mappingProfile: string;
  mappedFieldCount: number;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  missingEmailRows: number;
  duplicateRows: number;
  possibleDuplicateRows: number;
  importedOrganizations: number;
  skippedRows: number;
  persistenceLeadRowCount: number;
  filterVisibleAfterReload: number;
  segmentMatchingOrganizations: number;
  segmentMatchingContacts: number;
  segmentSendableRecipients: number;
  segmentExclusions: Record<string, number>;
  campaignCreated: boolean;
  defects: string[];
};

async function waitForStablePreview(
  page: Page,
  expectedTotal: number,
  minimumValid: number
): Promise<void> {
  await page.waitForFunction(
    ({ total, minValid }) => {
      const cards = document.querySelectorAll(
        '[data-testid="lead-import-wizard"] .grid.gap-3.sm\\:grid-cols-2 .rounded-lg.border'
      );
      const totalValue = Number(cards[0]?.querySelector("div:last-child")?.textContent?.trim() ?? 0);
      const validValue = Number(
        document.querySelector('[data-testid="import-metric-valid"] div:last-child')?.textContent?.trim() ?? 0
      );
      return totalValue === total && validValue >= minValid;
    },
    { total: expectedTotal, minValid: minimumValid },
    { timeout: 120000 }
  );
}

async function readImportMetrics(page: Page): Promise<Partial<Metrics>> {
  const readMetric = async (testId: string | null, cardIndex?: number): Promise<number> => {
    const locator = testId
      ? page.getByTestId(testId).locator("div").last()
      : page
          .locator('[data-testid="lead-import-wizard"] .grid.gap-3.sm\\:grid-cols-2 .rounded-lg.border')
          .nth(cardIndex ?? 0)
          .locator("div")
          .last();
    return Number((await locator.textContent())?.trim() ?? 0);
  };

  return {
    totalRows: await readMetric(null, 0),
    validRows: await readMetric("import-metric-valid"),
    invalidRows: await readMetric("import-metric-invalid"),
    duplicateRows: await readMetric("import-metric-duplicates"),
    possibleDuplicateRows: await readMetric(null, 4),
    missingEmailRows: await readMetric(null, 5)
  };
}

async function countMappedFields(page: Page): Promise<number> {
  const values = await page.evaluate(() => {
    const fields = ["companyName", "email", "phone", "website", "region", "industry"];
    return fields.map((field) => {
      const select = document.querySelector(`[data-testid="lead-import-mapping-${field}"]`) as
        | HTMLSelectElement
        | null;
      return select?.value ?? "";
    });
  });
  return values.filter(Boolean).length;
}

async function run(): Promise<Metrics> {
  const metrics: Metrics = {
    workbookCategory: "municipalities-cafes-events-combined",
    selectedSheet: TARGET_SHEET,
    sheetOptionsCount: 0,
    mappingProfile: PROFILE_LABEL,
    mappedFieldCount: 0,
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    missingEmailRows: 0,
    duplicateRows: 0,
    possibleDuplicateRows: 0,
    importedOrganizations: 0,
    skippedRows: 0,
    persistenceLeadRowCount: 0,
    filterVisibleAfterReload: 0,
    segmentMatchingOrganizations: 0,
    segmentMatchingContacts: 0,
    segmentSendableRecipients: 0,
    segmentExclusions: {},
    campaignCreated: false,
    defects: []
  };

  if (!WORKBOOK || !fs.existsSync(WORKBOOK)) {
    metrics.defects.push("workbook_not_found");
    return metrics;
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(`${BASE_URL}/pt-PT/leadops`, { waitUntil: "networkidle" });
    await page.evaluate(
      (db) =>
        new Promise<boolean>((resolve, reject) => {
          const request = indexedDB.deleteDatabase(db);
          request.onsuccess = () => resolve(true);
          request.onerror = () => reject(request.error);
          request.onblocked = () => resolve(false);
        }),
      DB_NAME
    );
    await page.reload({ waitUntil: "networkidle" });

    await page.getByTestId("lead-import-file-input").setInputFiles(WORKBOOK);
    await page.getByTestId("import-metric-valid").waitFor({ state: "visible", timeout: 120000 });

    const sheetSelect = page.getByTestId("lead-import-sheet-select");
    if (await sheetSelect.count()) {
      metrics.sheetOptionsCount = await sheetSelect.locator("option").count();
      await sheetSelect.selectOption({ label: TARGET_SHEET });
      await waitForStablePreview(page, 271, 0);
    } else {
      metrics.defects.push("sheet_selector_missing");
    }

    await page.getByTestId("lead-import-profile-select").selectOption({ label: PROFILE_LABEL });
    await waitForStablePreview(page, 271, 200);

    metrics.mappedFieldCount = await countMappedFields(page);
    Object.assign(metrics, await readImportMetrics(page));

    if (await page.getByTestId("lead-import-repeat-confirm").isVisible().catch(() => false)) {
      await page.getByTestId("lead-import-repeat-confirm").check();
    }

    const confirmButton = page.getByTestId("lead-import-confirm");
    await confirmButton.waitFor({ state: "visible", timeout: 30000 });
    await page.waitForFunction(() => {
      const button = document.querySelector('[data-testid="lead-import-confirm"]') as HTMLButtonElement | null;
      return button && !button.disabled;
    }, { timeout: 120000 });

    await page.getByTestId("lead-import-status-filter").selectOption("invalid");
    if (metrics.invalidRows > 0 && (await page.locator("tbody tr").count()) === 0) {
      metrics.defects.push("invalid_rows_not_visible_in_filter");
    }

    await page.getByTestId("lead-import-status-filter").selectOption("duplicate");
    if (metrics.duplicateRows > 0 && (await page.locator("tbody tr").count()) === 0) {
      metrics.defects.push("duplicate_rows_not_visible_in_filter");
    }

    await page.getByTestId("lead-import-status-filter").selectOption("all");
    await page.getByTestId("lead-import-confirm").click();
    await page.getByTestId("lead-import-result").waitFor({ state: "visible", timeout: 120000 });

    const resultText = (await page.getByTestId("lead-import-result").textContent()) ?? "";
    const importedMatch = resultText.match(/Importados\s+(\d+)\s+leads?/i) ?? resultText.match(/(\d+)\s+leads?\s+imported/i);
    const skippedMatch =
      resultText.match(/Ignorados\s+(\d+)\s+duplicados/i) ?? resultText.match(/(\d+)\s+(?:skipped|duplicate)/i);
    metrics.importedOrganizations = importedMatch ? Number(importedMatch[1]) : 0;
    metrics.skippedRows = skippedMatch ? Number(skippedMatch[1]) : 0;

    await page.reload({ waitUntil: "networkidle" });
    await page.getByTestId("lead-management-panel").waitFor({ state: "visible", timeout: 60000 });
    metrics.persistenceLeadRowCount = await page.locator('[data-testid^="lead-row-"]').count();

    const panel = page.getByTestId("lead-management-panel");
    const selects = panel.locator("select");
    if ((await selects.count()) >= 8) {
      await selects.nth(6).selectOption({ label: "Municipalities" }).catch(() => undefined);
      await selects.nth(3).selectOption({ label: "Válido" }).catch(() => undefined);
      await selects.nth(9).selectOption({ label: "Enviável" }).catch(() => undefined);
    }
    await page.waitForTimeout(800);
    metrics.filterVisibleAfterReload = await page.locator('[data-testid^="lead-row-"]').count();

    await page.getByTestId("create-campaign-from-filters").click();
    await page.getByTestId("segment-sendable").waitFor({ state: "visible", timeout: 30000 });
    metrics.segmentMatchingOrganizations = Number(
      (await page.getByTestId("segment-orgs").locator("p").last().textContent())?.trim() ?? 0
    );
    metrics.segmentMatchingContacts = Number(
      (await page.getByTestId("segment-contacts").locator("p").last().textContent()) ?? 0
    );
    metrics.segmentSendableRecipients = Number(
      (await page.getByTestId("segment-sendable").locator("p").last().textContent()) ?? 0
    );

    for (const key of ["missingEmail", "invalidEmail", "suppressed", "duplicate", "inactive"]) {
      const row = page.getByTestId(`segment-exclusion-${key}`);
      if (await row.count()) {
        metrics.segmentExclusions[key] = Number((await row.locator("span").last().textContent())?.trim() ?? 0);
      }
    }

    await page.getByTestId("segment-campaign-name").fill("Private Acceptance Municipalities");
    await page.getByTestId("segment-create-campaign").click();
    await page.waitForURL(/\/leadops\/campaigns\//, { timeout: 60000 });
    metrics.campaignCreated = page.url().includes("/leadops/campaigns/");

    if (metrics.persistenceLeadRowCount === 0) metrics.defects.push("persistence_failed");
    if (metrics.importedOrganizations === 0) metrics.defects.push("import_zero_organizations");
    if (!metrics.campaignCreated) metrics.defects.push("campaign_segment_failed");
  } finally {
    await browser.close();
  }

  return metrics;
}

run()
  .then((metrics) => {
    const outPath = path.join(process.cwd(), "qa/outreach/.private-acceptance-metrics.json");
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), metrics }, null, 2));
    console.log(JSON.stringify(metrics, null, 2));
    process.exit(metrics.defects.length ? 1 : 0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
