import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import { createInventoryProductDemoState } from "@/features/inventory-product/demo";
import { createScanCooldown } from "@/features/inventory-mobile/scan-cooldown";
import {
  assertMobileMovementPermission,
  createMovementIdempotencyKey,
  linkBarcodeToItem,
  postMobileMovement,
  validateMobileMovementInput
} from "@/features/inventory-mobile/movement-service";
import {
  clearOfflineQueue,
  enqueueMovement,
  isBrowserOnline,
  listQueuedMovements,
  markMovementFailed,
  markMovementSynced,
  resetMovementForRetry
} from "@/features/inventory-mobile/offline-queue";
import { destroyDatabaseForTests } from "@/persistence/registry";
import { getDatabase } from "@/persistence/db";
import { createLocalRepositoryBundle, seedDatabase } from "@/persistence/indexeddb/repositories";

const TEST_DB = "forgeos:test:inventory-mobile";

function getTestRepos() {
  return createLocalRepositoryBundle(getDatabase(TEST_DB));
}

function movementRequest(overrides: Record<string, unknown> = {}) {
  return {
    destinationLocationId: undefined,
    idempotencyKey: createMovementIdempotencyKey("test"),
    itemId: "item_clear_cup_330",
    locationId: "loc_a_r1_s1",
    lotId: "lot_cup_330_001",
    notes: "test",
    operatorId: "operator_test",
    quantity: 10,
    reasonCode: "mobile_scan",
    tenantId: DEFAULT_TENANT_ID,
    unitOfMeasureId: "uom_unit",
    warehouseId: "wh_main",
    ...overrides
  };
}

describe("inventory mobile movement service", () => {
  beforeEach(async () => {
    await destroyDatabaseForTests(TEST_DB);
    const db = getDatabase(TEST_DB);
    await db.open();
    await seedDatabase(db, DEFAULT_TENANT_ID, true);
    const repos = getTestRepos();
    await repos.inventoryProduct.replaceSnapshot(DEFAULT_TENANT_ID, createInventoryProductDemoState(DEFAULT_TENANT_ID));
    clearOfflineQueue(DEFAULT_TENANT_ID);
  });

  it("posts receive movement through inventory foundation", async () => {
    const repos = getTestRepos();
    const before = await repos.inventoryProduct.getSnapshot(DEFAULT_TENANT_ID);
    const request = movementRequest();
    await postMobileMovement(repos.inventoryProduct, DEFAULT_TENANT_ID, "receipt", request);
    const after = await repos.inventoryProduct.getSnapshot(DEFAULT_TENANT_ID);
    expect(after.transactions.length).toBeGreaterThan(before.transactions.length);
  });

  it("posts issue movement through inventory foundation", async () => {
    const repos = getTestRepos();
    const request = movementRequest({ quantity: 1 });
    await postMobileMovement(repos.inventoryProduct, DEFAULT_TENANT_ID, "issue", request);
    const after = await repos.inventoryProduct.getSnapshot(DEFAULT_TENANT_ID);
    expect(after.transactions.some((row) => row.idempotencyKey === request.idempotencyKey)).toBe(true);
  });

  it("posts transfer movement through inventory foundation", async () => {
    const repos = getTestRepos();
    const request = movementRequest({
      destinationLocationId: "loc_quarantine",
      quantity: 2
    });
    await postMobileMovement(repos.inventoryProduct, DEFAULT_TENANT_ID, "transfer", request);
    const after = await repos.inventoryProduct.getSnapshot(DEFAULT_TENANT_ID);
    expect(after.entries.filter((entry) => entry.transactionId === after.transactions.at(-1)?.id)).toHaveLength(2);
  });

  it("blocks insufficient stock on issue", async () => {
    const repos = getTestRepos();
    await expect(
      postMobileMovement(
        repos.inventoryProduct,
        DEFAULT_TENANT_ID,
        "issue",
        movementRequest({ quantity: 999999 })
      )
    ).rejects.toThrow(/negative|insufficient/i);
  });

  it("enforces permissions for receive and issue", () => {
    expect(() => assertMobileMovementPermission("warehouse_manager", "receipt")).not.toThrow();
    expect(() => assertMobileMovementPermission("warehouse_operator", "issue")).not.toThrow();
    expect(() => assertMobileMovementPermission("sales", "receipt")).toThrow();
    expect(() => assertMobileMovementPermission("sales", "issue")).toThrow();
    expect(() => assertMobileMovementPermission("warehouse_manager", "issue")).not.toThrow();
  });

  it("deduplicates by idempotency key", async () => {
    const repos = getTestRepos();
    const request = movementRequest({ quantity: 1 });
    const spy = vi.spyOn(repos.inventoryProduct, "receiveStock");
    await postMobileMovement(repos.inventoryProduct, DEFAULT_TENANT_ID, "receipt", request);
    await postMobileMovement(repos.inventoryProduct, DEFAULT_TENANT_ID, "receipt", request);
    expect(spy).toHaveBeenCalledTimes(2);
    const after = await repos.inventoryProduct.getSnapshot(DEFAULT_TENANT_ID);
    expect(after.transactions.filter((row) => row.idempotencyKey === request.idempotencyKey)).toHaveLength(1);
  });

  it("links unknown barcode to existing item without creating products", async () => {
    const repos = getTestRepos();
    const beforeItems = (await repos.inventoryProduct.getSnapshot(DEFAULT_TENANT_ID)).items.length;
    await linkBarcodeToItem(repos.inventoryProduct, {
      itemId: "item_box_medium",
      operatorId: "operator_test",
      scannedValue: "NEW-LINK-123",
      tenantId: DEFAULT_TENANT_ID
    });
    const after = await repos.inventoryProduct.getSnapshot(DEFAULT_TENANT_ID);
    expect(after.items).toHaveLength(beforeItems);
    expect(after.barcodes.some((row) => row.normalizedValue === "NEW-LINK-123")).toBe(true);
  });

  it("validates transfer destination", () => {
    expect(
      validateMobileMovementInput({
        destinationLocationId: "loc_a_r1_s1",
        kind: "transfer",
        locationId: "loc_a_r1_s1",
        quantity: 1
      })
    ).toBe("transfer_same_location");
  });
});

describe("offline queue", () => {
  beforeEach(() => clearOfflineQueue(DEFAULT_TENANT_ID));

  it("queues movements with idempotency keys", () => {
    const request = movementRequest();
    enqueueMovement(DEFAULT_TENANT_ID, "receipt", request);
    const queue = listQueuedMovements(DEFAULT_TENANT_ID);
    expect(queue).toHaveLength(1);
    expect(queue[0]?.idempotencyKey).toBe(request.idempotencyKey);
  });

  it("prevents duplicate queue entries for the same idempotency key", () => {
    const request = movementRequest();
    enqueueMovement(DEFAULT_TENANT_ID, "receipt", request);
    enqueueMovement(DEFAULT_TENANT_ID, "receipt", request);
    expect(listQueuedMovements(DEFAULT_TENANT_ID)).toHaveLength(1);
  });

  it("removes synced movements from queue", () => {
    const request = movementRequest();
    enqueueMovement(DEFAULT_TENANT_ID, "receipt", request);
    markMovementSynced(DEFAULT_TENANT_ID, request.idempotencyKey);
    expect(listQueuedMovements(DEFAULT_TENANT_ID)).toHaveLength(0);
  });

  it("resets failed movements for retry", () => {
    const request = movementRequest();
    enqueueMovement(DEFAULT_TENANT_ID, "receipt", request);
    markMovementFailed(DEFAULT_TENANT_ID, request.idempotencyKey, "network error");
    resetMovementForRetry(DEFAULT_TENANT_ID, request.idempotencyKey);
    const entry = listQueuedMovements(DEFAULT_TENANT_ID)[0];
    expect(entry?.status).toBe("pending");
    expect(entry?.lastError).toBeUndefined();
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

describe("browser online helper", () => {
  it("reports online in test runtime", () => {
    expect(isBrowserOnline()).toBe(true);
  });
});
