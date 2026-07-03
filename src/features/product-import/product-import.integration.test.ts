import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import { commitApprovedRows } from "@/features/product-import/commit";
import { createBatchFromSpreadsheet, processAndStageRows } from "@/features/product-import/pipeline";
import { parseSpreadsheet } from "@/features/product-import/parse-spreadsheet";
import { getDatabase } from "@/persistence/db";
import { createLocalRepositoryBundle, seedDatabase } from "@/persistence/indexeddb/repositories";
import { destroyDatabaseForTests } from "@/persistence/registry";

const TEST_DB = "forgeos:test:product-import";
const fixturesDir = resolve(process.cwd(), "scripts/data-preparation/fixtures");

describe("product import integration", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
  });

  it("stages curated CSV, commits subset, detects invoice overlap without inventory changes", async () => {
    const repos = createLocalRepositoryBundle(getDatabase(TEST_DB));
    const tenantId = DEFAULT_TENANT_ID;

    const curatedCsv = readFileSync(resolve(fixturesDir, "synthetic_curated_products.csv"), "utf8");
    const parsedCurated = parseSpreadsheet({
      data: curatedCsv,
      filename: "synthetic_curated_products.csv"
    });
    const columnMappings = {
      reference: "internalReference" as const,
      description: "description" as const,
      sale_price: "salePrice" as const,
      barcode: "barcode" as const,
      category: "category" as const,
      base_unit: "baseUnit" as const,
      status: "status" as const
    };

    const batch = await createBatchFromSpreadsheet(
      tenantId,
      parsedCurated,
      parsedCurated.worksheets[0].name,
      new TextEncoder().encode(curatedCsv).buffer as ArrayBuffer,
      repos.productImport,
      null
    );
    const stagedBatch = await processAndStageRows(
      tenantId,
      batch,
      parsedCurated,
      columnMappings,
      await repos.products.list(tenantId),
      repos.productImport
    );
    expect(stagedBatch.stagedRows).toBe(5);

    const rows = await repos.productImport.rows.listByBatch(tenantId, stagedBatch.id);
    const safeRows = rows.filter((row) => row.status === "valid" && row.proposedAction === "create_new");
    expect(safeRows.length).toBeGreaterThan(0);

    const inventoryBefore = await repos.inventory.list(tenantId);
    const commitResult = await commitApprovedRows(
      tenantId,
      stagedBatch.id,
      safeRows.slice(0, 2).map((r) => r.id),
      repos.products,
      repos.productImport,
      null
    );
    expect(commitResult.committed).toBe(2);

    const reloaded = await repos.products.getBySku(tenantId, "SYN-CUP-001");
    expect(reloaded?.name).toContain("Synthetic Cup Alpha");

    const invoiceCsv = readFileSync(resolve(fixturesDir, "synthetic_invoice_export.csv"), "utf8");
    const parsedInvoice = parseSpreadsheet({
      data: invoiceCsv,
      filename: "synthetic_invoice_export.csv"
    });
    const invoiceBatch = await createBatchFromSpreadsheet(
      tenantId,
      parsedInvoice,
      parsedInvoice.worksheets[0].name,
      new TextEncoder().encode(invoiceCsv).buffer as ArrayBuffer,
      repos.productImport,
      null
    );
    await processAndStageRows(
      tenantId,
      invoiceBatch,
      parsedInvoice,
      {
        Referencia: "internalReference" as const,
        Descricao: "description" as const,
        "Preco s/Imposto": "salePrice" as const,
        "Cod. Barras": "barcode" as const,
        "Unidade de Venda": "baseUnit" as const
      },
      await repos.products.list(tenantId),
      repos.productImport
    );
    const invoiceRows = await repos.productImport.rows.listByBatch(tenantId, invoiceBatch.id);
    expect(invoiceRows.some((row) => row.duplicateMatches.length > 0)).toBe(true);

    const inventoryAfter = await repos.inventory.list(tenantId);
    expect(inventoryAfter.length).toBe(inventoryBefore.length);
  });
});
