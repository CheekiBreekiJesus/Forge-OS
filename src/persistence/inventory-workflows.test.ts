import { describe, expect, it, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { DEFAULT_TENANT_ID } from "@/domain/constants";
import { deleteDatabase, getDatabase } from "@/persistence/db";
import { createInventoryProductRepository } from "@/persistence/indexeddb/inventory-product-repositories";

describe("inventory product repository workflows", () => {
  const dbName = `forgeos:inventory-workflows:${Date.now()}`;

  beforeEach(async () => {
    await deleteDatabase(dbName);
  });

  afterEach(async () => {
    await deleteDatabase(dbName);
  });

  it("enforces tenant isolation on item reads", async () => {
    const db = getDatabase(dbName);
    const repo = createInventoryProductRepository(db);
    await repo.seedDemoFoundation(DEFAULT_TENANT_ID);
    const snapshot = await repo.getSnapshot(DEFAULT_TENANT_ID);
    expect(snapshot.items.length).toBeGreaterThan(0);
    const otherTenant = await repo.getSnapshot("tenant_other");
    expect(otherTenant.items).toHaveLength(0);
  });

  it("receives, issues, transfers, and adjusts stock through the ledger", async () => {
    const db = getDatabase(dbName);
    const repo = createInventoryProductRepository(db);
    await repo.seedDemoFoundation(DEFAULT_TENANT_ID);

    await repo.receiveStock(DEFAULT_TENANT_ID, {
      idempotencyKey: "repo:receipt:1",
      itemId: "item_clear_cup_330",
      locationId: "loc_a_r1_s1",
      lotId: "lot_cup_330_001",
      operatorId: "operator",
      quantity: 50,
      reasonCode: "receipt",
      tenantId: DEFAULT_TENANT_ID,
      unitOfMeasureId: "uom_unit",
      warehouseId: "wh_main"
    });

    await repo.issueStock(DEFAULT_TENANT_ID, {
      idempotencyKey: "repo:issue:1",
      itemId: "item_clear_cup_330",
      locationId: "loc_a_r1_s1",
      lotId: "lot_cup_330_001",
      operatorId: "operator",
      quantity: 10,
      reasonCode: "issue",
      tenantId: DEFAULT_TENANT_ID,
      unitOfMeasureId: "uom_unit",
      warehouseId: "wh_main"
    });

    await repo.transferStock(DEFAULT_TENANT_ID, {
      destinationLocationId: "loc_quarantine",
      idempotencyKey: "repo:transfer:1",
      itemId: "item_clear_cup_330",
      locationId: "loc_a_r1_s1",
      lotId: "lot_cup_330_001",
      operatorId: "operator",
      quantity: 5,
      reasonCode: "transfer",
      tenantId: DEFAULT_TENANT_ID,
      unitOfMeasureId: "uom_unit",
      warehouseId: "wh_main"
    });

    await repo.adjustStock(
      DEFAULT_TENANT_ID,
      {
        idempotencyKey: "repo:adjust:1",
        itemId: "item_clear_cup_330",
        locationId: "loc_a_r1_s1",
        lotId: "lot_cup_330_001",
        operatorId: "operator",
        quantity: 2,
        reasonCode: "count",
        tenantId: DEFAULT_TENANT_ID,
        unitOfMeasureId: "uom_unit",
        warehouseId: "wh_main"
      },
      "increase"
    );

    const snapshot = await repo.getSnapshot(DEFAULT_TENANT_ID);
    expect(snapshot.transactions.length).toBeGreaterThanOrEqual(4);
    expect(snapshot.entries.length).toBeGreaterThanOrEqual(5);
  });

  it("blocks insufficient stock on issue without override", async () => {
    const db = getDatabase(dbName);
    const repo = createInventoryProductRepository(db);
    await repo.seedDemoFoundation(DEFAULT_TENANT_ID);
    await expect(
      repo.issueStock(DEFAULT_TENANT_ID, {
        idempotencyKey: "repo:issue:fail",
        itemId: "item_clear_cup_330",
        locationId: "loc_a_r1_s1",
        lotId: "lot_cup_330_001",
        operatorId: "operator",
        quantity: 9_999_999,
        reasonCode: "issue",
        tenantId: DEFAULT_TENANT_ID,
        unitOfMeasureId: "uom_unit",
        warehouseId: "wh_main"
      })
    ).rejects.toThrow(/Negative available stock/);
  });

  it("creates and releases reservations", async () => {
    const db = getDatabase(dbName);
    const repo = createInventoryProductRepository(db);
    await repo.seedDemoFoundation(DEFAULT_TENANT_ID);
    const reservation = await repo.createReservation(DEFAULT_TENANT_ID, {
      itemId: "item_clear_cup_330",
      quantity: 25,
      sourceDocumentId: "so_100",
      sourceDocumentType: "sales_order",
      unitOfMeasureId: "uom_unit",
      warehouseId: "wh_main"
    });
    expect(reservation.status).toBe("active");
    const released = await repo.releaseReservation(DEFAULT_TENANT_ID, reservation.id);
    expect(released.status).toBe("released");
  });
});
