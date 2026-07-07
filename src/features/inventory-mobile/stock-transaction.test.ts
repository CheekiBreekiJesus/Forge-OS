import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import { destroyDatabaseForTests } from "@/persistence/registry";
import { getDatabase } from "@/persistence/db";
import { createLocalRepositoryBundle, seedDatabase } from "@/persistence/indexeddb/repositories";
import { createScanCooldown } from "@/features/inventory-mobile/scan-cooldown";
import { postStockTransaction, validateStockTransaction } from "@/features/inventory-mobile/stock-transaction";

const TEST_DB = "forgeos:test:inventory-mobile";

function getTestRepos() {
  return createLocalRepositoryBundle(getDatabase(TEST_DB));
}

async function createTestItem(sku: string, quantity = 0) {
  const repos = getTestRepos();
  const item = await repos.inventory.create(DEFAULT_TENANT_ID, {
    active: true,
    archivedAt: null,
    archivedBy: null,
    archiveReason: null,
    sku,
    name: `Item ${sku}`,
    category: "materials",
    unit: "un",
    productId: null,
    reorderLevel: 5,
    warehouseLocation: "A1",
    batch: null,
    notes: ""
  });
  if (quantity > 0) {
    await repos.inventory.recordReceipt(DEFAULT_TENANT_ID, item.id, {
      quantity,
      reason: "seed"
    });
  }
  return repos.inventory.getById(DEFAULT_TENANT_ID, item.id);
}

describe("inventory mobile stock transactions", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
  });

  it("calls recordReceipt exactly once", async () => {
    const repos = getTestRepos();
    const item = await createTestItem(`SKU-R-${Date.now()}`, 10);
    if (!item) throw new Error("missing item");
    const spy = vi.spyOn(repos.inventory, "recordReceipt");
    await postStockTransaction(repos.inventory, DEFAULT_TENANT_ID, item.id, {
      type: "receipt",
      quantity: 3,
      reason: "test receipt"
    }, item);
    expect(spy).toHaveBeenCalledTimes(1);
    const updated = await repos.inventory.getById(DEFAULT_TENANT_ID, item.id);
    expect(updated?.currentQuantity).toBe(13);
  });

  it("calls recordConsumption exactly once", async () => {
    const repos = getTestRepos();
    const item = await createTestItem(`SKU-C-${Date.now()}`, 10);
    if (!item) throw new Error("missing item");
    const spy = vi.spyOn(repos.inventory, "recordConsumption");
    await postStockTransaction(repos.inventory, DEFAULT_TENANT_ID, item.id, {
      type: "consumption",
      quantity: 4,
      reason: "test consumption"
    }, item);
    expect(spy).toHaveBeenCalledTimes(1);
    const updated = await repos.inventory.getById(DEFAULT_TENANT_ID, item.id);
    expect(updated?.currentQuantity).toBe(6);
  });

  it("calls adjustStock exactly once", async () => {
    const repos = getTestRepos();
    const item = await createTestItem(`SKU-A-${Date.now()}`, 10);
    if (!item) throw new Error("missing item");
    const spy = vi.spyOn(repos.inventory, "adjustStock");
    await postStockTransaction(repos.inventory, DEFAULT_TENANT_ID, item.id, {
      type: "adjustment",
      quantity: 15,
      reason: "cycle count",
      adjustmentMode: "target"
    }, item);
    expect(spy).toHaveBeenCalledTimes(1);
    const updated = await repos.inventory.getById(DEFAULT_TENANT_ID, item.id);
    expect(updated?.currentQuantity).toBe(15);
  });

  it("blocks consumption that would create negative stock", async () => {
    const repos = getTestRepos();
    const item = await createTestItem(`SKU-N-${Date.now()}`, 2);
    if (!item) throw new Error("missing item");
    expect(
      validateStockTransaction({ type: "consumption", quantity: 5, reason: "too much" }, item)
    ).toBe("negative_stock");
    await expect(
      repos.inventory.recordConsumption(DEFAULT_TENANT_ID, item.id, {
        quantity: 5,
        reason: "too much"
      })
    ).rejects.toThrow(/negative/i);
  });
});

describe("scan cooldown", () => {
  it("prevents duplicate scan frames within cooldown window", () => {
    const cooldown = createScanCooldown(2000);
    expect(cooldown.shouldAccept("ABC", 1000)).toBe(true);
    expect(cooldown.shouldAccept("ABC", 1500)).toBe(false);
    expect(cooldown.shouldAccept("ABC", 3100)).toBe(true);
    expect(cooldown.shouldAccept("XYZ", 3200)).toBe(true);
  });
});
