import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import { exportBackup, importBackup, validateBackup } from "@/features/backup/service";
import { destroyDatabaseForTests } from "@/persistence/registry";
import { getDatabase } from "@/persistence/db";
import { createLocalRepositoryBundle, seedDatabase } from "@/persistence/indexeddb/repositories";

const TEST_DB = "forgeos:test:inventory-product-persistence";

async function setupRepos() {
  await destroyDatabaseForTests(TEST_DB);
  const db = getDatabase(TEST_DB);
  await db.open();
  await seedDatabase(db, DEFAULT_TENANT_ID, true);
  return createLocalRepositoryBundle(db);
}

describe("inventory product persistence", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
  });

  it("seeds the canonical product and inventory snapshot", async () => {
    const repos = await setupRepos();
    const snapshot = await repos.inventoryProduct.getSnapshot(DEFAULT_TENANT_ID);
    const integrity = await repos.inventoryProduct.validateIntegrity(DEFAULT_TENANT_ID);

    expect(snapshot.unitOfMeasures.length).toBeGreaterThan(0);
    expect(snapshot.items.map((item) => item.internalReference)).toContain("FG-CUP-330-CLR");
    expect(snapshot.products.map((product) => product.productCode)).toContain("PROD-CUP-330");
    expect(snapshot.transactions.length).toBe(2);
    expect(snapshot.entries.length).toBe(3);
    expect(snapshot.barcodes.length).toBe(2);
    expect(integrity).toEqual({ issues: [], ok: true });
  });

  it("posts ledger transactions idempotently", async () => {
    const repos = await setupRepos();
    const before = await repos.inventoryProduct.getSnapshot(DEFAULT_TENANT_ID);

    const result = await repos.inventoryProduct.postTransaction(DEFAULT_TENANT_ID, {
      entries: [
        {
          baseQuantityDelta: 250,
          costBasis: 0.042,
          itemId: "item_clear_cup_330",
          itemReferenceSnapshot: "FG-CUP-330-CLR",
          locationId: "loc_a_r1_s1",
          lotId: "lot_cup_330_001",
          productVariantId: "variant_clear_cup_330_box",
          productVariantSnapshot: "PROD-CUP-330 / 1000-unit box",
          quantityDelta: 250,
          stockCondition: "available",
          unitOfMeasureId: "uom_unit",
          warehouseId: "wh_main"
        }
      ],
      idempotencyKey: "test:receipt:cup330:250",
      occurredAt: "2026-07-01T12:00:00.000Z",
      operatorId: "operator_test",
      reasonCode: "receipt",
      sourceDocumentId: "receipt_test_001",
      sourceDocumentType: "receipt",
      tenantId: DEFAULT_TENANT_ID,
      transactionType: "receipt"
    });

    await repos.inventoryProduct.postTransaction(DEFAULT_TENANT_ID, {
      entries: result.entries.map((entry) => ({
        baseQuantityDelta: entry.baseQuantityDelta,
        costBasis: entry.costBasis,
        itemId: entry.itemId,
        itemReferenceSnapshot: entry.itemReferenceSnapshot,
        locationId: entry.locationId,
        lotId: entry.lotId,
        productVariantId: entry.productVariantId,
        productVariantSnapshot: entry.productVariantSnapshot,
        quantityDelta: entry.quantityDelta,
        stockCondition: entry.stockCondition,
        unitOfMeasureId: entry.unitOfMeasureId,
        warehouseId: entry.warehouseId
      })),
      idempotencyKey: "test:receipt:cup330:250",
      occurredAt: "2026-07-01T12:00:00.000Z",
      operatorId: "operator_test",
      reasonCode: "receipt",
      tenantId: DEFAULT_TENANT_ID,
      transactionType: "receipt"
    });

    const after = await repos.inventoryProduct.getSnapshot(DEFAULT_TENANT_ID);
    expect(after.transactions.length).toBe(before.transactions.length + 1);
    expect(after.entries.filter((entry) => entry.transactionId === result.transaction.id)).toHaveLength(1);
  });

  it("rejects transactions when input tenant does not match repository scope", async () => {
    const repos = await setupRepos();

    await expect(
      repos.inventoryProduct.postTransaction(DEFAULT_TENANT_ID, {
        entries: [
          {
            baseQuantityDelta: 1,
            costBasis: 0.042,
            itemId: "item_clear_cup_330",
            itemReferenceSnapshot: "FG-CUP-330-CLR",
            locationId: "loc_a_r1_s1",
            lotId: "lot_cup_330_001",
            productVariantId: null,
            productVariantSnapshot: null,
            quantityDelta: 1,
            stockCondition: "available",
            unitOfMeasureId: "uom_unit",
            warehouseId: "wh_main"
          }
        ],
        idempotencyKey: "test:tenant-mismatch",
        occurredAt: "2026-07-01T12:00:00.000Z",
        operatorId: "operator_test",
        reasonCode: "receipt",
        tenantId: "tenant_other",
        transactionType: "receipt"
      })
    ).rejects.toThrow("Transaction tenant does not match repository scope.");
  });

  it("preserves canonical inventory data during demo reset", async () => {
    const repos = await setupRepos();
    const before = await repos.inventoryProduct.getSnapshot(DEFAULT_TENANT_ID);

    await repos.resetDemoData(DEFAULT_TENANT_ID);

    const after = await repos.inventoryProduct.getSnapshot(DEFAULT_TENANT_ID);
    expect(after.items).toHaveLength(before.items.length);
    expect(after.entries).toHaveLength(before.entries.length);
    expect(after.barcodes).toHaveLength(before.barcodes.length);
  });

  it("includes canonical inventory data in local backup and restore", async () => {
    const repos = await setupRepos();
    const backup = await exportBackup(repos, DEFAULT_TENANT_ID, false);

    expect(validateBackup(backup)).toBe(true);
    const inventoryProduct = backup.tables.inventoryProduct!;
    expect(inventoryProduct.items.length).toBeGreaterThan(0);
    expect(inventoryProduct.entries.length).toBeGreaterThan(0);

    await importBackup(repos, backup);

    const restored = await repos.inventoryProduct.getSnapshot(DEFAULT_TENANT_ID);
    expect(restored.items).toHaveLength(inventoryProduct.items.length);
    expect(restored.transactions).toHaveLength(inventoryProduct.transactions.length);
    expect(restored.entries).toHaveLength(inventoryProduct.entries.length);
  });
});
