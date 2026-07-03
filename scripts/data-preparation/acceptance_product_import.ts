/**
 * Local real-file acceptance (private). Aggregates logged only.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import "fake-indexeddb/auto";
import { DEFAULT_TENANT_ID } from "../../src/domain/constants";
import { commitApprovedRows } from "../../src/features/product-import/commit";
import { suggestFieldMapping } from "../../src/features/product-import/field-mapping";
import { createBatchFromSpreadsheet, processAndStageRows } from "../../src/features/product-import/pipeline";
import { parseSpreadsheet } from "../../src/features/product-import/parse-spreadsheet";
import { getDatabase, resetDatabaseInstance } from "../../src/persistence/db";
import { createLocalRepositoryBundle, seedDatabase } from "../../src/persistence/indexeddb/repositories";

const PRODUCTS_DIR = resolve("C:/Users/J35U5/Desktop/JH Gomes/Databases/Products");
const DB_NAME = process.env.FORGEOS_LOCAL_DB_NAME ?? "forgeos:jhgomes:product-import-acceptance";

async function main() {
  resetDatabaseInstance();
  const db = getDatabase(DB_NAME);
  await db.delete();
  resetDatabaseInstance();
  const fresh = getDatabase(DB_NAME);
  await fresh.open();
  await seedDatabase(fresh, DEFAULT_TENANT_ID, true);
  const repos = createLocalRepositoryBundle(fresh);

  const inventoryBefore = await repos.inventory.list(DEFAULT_TENANT_ID);
  const movementsBefore = await fresh.stockMovements.count();

  const curatedPath = resolve(PRODUCTS_DIR, "ForgeOS_Product_Catalog_Draft_2026-07-01.xlsx");
  const buffer = readFileSync(curatedPath);
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  const parsed = parseSpreadsheet({ data: arrayBuffer, filename: "ForgeOS_Product_Catalog_Draft_2026-07-01.xlsx" });
  const worksheet = parsed.worksheets.find((ws) => ws.name === "Products_Import")?.name ?? parsed.worksheets[0].name;
  const ws = parsed.worksheets.find((w) => w.name === worksheet)!;
  const mappings = suggestFieldMapping(ws.headers);

  const batch = await createBatchFromSpreadsheet(
    DEFAULT_TENANT_ID,
    parsed,
    worksheet,
    arrayBuffer,
    repos.productImport,
    null
  );
  const staged = await processAndStageRows(
    DEFAULT_TENANT_ID,
    batch,
    parsed,
    mappings,
    await repos.products.list(DEFAULT_TENANT_ID),
    repos.productImport
  );
  const rows = await repos.productImport.rows.listByBatch(DEFAULT_TENANT_ID, staged.id);
  const safe = rows.filter((r) => r.status === "valid" && r.proposedAction === "create_new").slice(0, 3);
  const commit = await commitApprovedRows(
    DEFAULT_TENANT_ID,
    staged.id,
    safe.map((r) => r.id),
    repos.products,
    repos.productImport,
    null
  );

  const inventoryAfter = await repos.inventory.list(DEFAULT_TENANT_ID);
  const movementsAfter = await fresh.stockMovements.count();
  const refs = await repos.productImport.sourceReferences.listByBatch(DEFAULT_TENANT_ID, staged.id);

  console.log(
    JSON.stringify(
      {
        committed: commit.committed,
        conflicts: staged.conflictRows,
        duplicates: staged.duplicateRows,
        invalidRows: staged.invalidRows,
        inventoryItemsUnchanged: inventoryBefore.length === inventoryAfter.length,
        sourceReferences: refs.length,
        stagedRows: staged.stagedRows,
        stockMovementsUnchanged: movementsBefore === movementsAfter,
        totalRows: staged.totalRows,
        validRows: staged.validRows,
        warningRows: staged.warningRows,
        worksheet
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
