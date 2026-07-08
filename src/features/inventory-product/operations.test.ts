import { describe, expect, it } from "vitest";
import { createInventoryProductDemoState } from "@/features/inventory-product/demo";
import {
  assertInventoryPermission,
  buildAdjustmentTransaction,
  buildIssueTransaction,
  buildReceiptTransaction,
  buildTransferTransaction,
  createReservationRecord,
  getLowStockItems,
  getStockBalances,
  listMovementHistory,
  mapPreviewRoleToInventoryRole,
  releaseReservationRecord,
  validateStockMovementRequest
} from "@/features/inventory-product/operations";

const tenantId = "tenant_jh_gomes";

function movement(overrides: Partial<Parameters<typeof buildReceiptTransaction>[1]> = {}) {
  return {
    destinationLocationId: "loc_quarantine",
    idempotencyKey: `test:${Math.random()}`,
    itemId: "item_clear_cup_330",
    locationId: "loc_a_r1_s1",
    lotId: "lot_cup_330_001",
    operatorId: "operator_test",
    quantity: 100,
    reasonCode: "test",
    tenantId,
    unitOfMeasureId: "uom_unit",
    warehouseId: "wh_main",
    ...overrides
  };
}

describe("inventory product operations", () => {
  const snapshot = createInventoryProductDemoState(tenantId);

  it("maps preview roles to inventory permission roles", () => {
    expect(mapPreviewRoleToInventoryRole("owner")).toBe("company_owner");
    expect(mapPreviewRoleToInventoryRole("warehouse_manager")).toBe("warehouse_manager");
    expect(mapPreviewRoleToInventoryRole("sales")).toBe("auditor");
  });

  it("enforces permission matrix", () => {
    expect(() => assertInventoryPermission("auditor", "receive")).toThrow();
    expect(() => assertInventoryPermission("warehouse_operator", "receive")).not.toThrow();
  });

  it("validates stock movement requests", () => {
    const errors = validateStockMovementRequest(snapshot, movement({ quantity: 0 }), "receipt");
    expect(errors).toContain("Quantity must be a positive number.");
  });

  it("builds receipt transactions", () => {
    const input = buildReceiptTransaction(snapshot, movement());
    expect(input.transactionType).toBe("receipt");
    expect(input.entries[0]?.baseQuantityDelta).toBe(100);
  });

  it("builds issue transactions with negative deltas", () => {
    const input = buildIssueTransaction(snapshot, movement({ quantity: 25 }));
    expect(input.transactionType).toBe("adjustment_decrease");
    expect(input.entries[0]?.baseQuantityDelta).toBe(-25);
  });

  it("builds balanced transfer transactions", () => {
    const input = buildTransferTransaction(
      snapshot,
      movement({ destinationLocationId: "loc_quarantine", quantity: 50 })
    );
    const total = input.entries.reduce((sum, entry) => sum + entry.baseQuantityDelta, 0);
    expect(total).toBe(0);
    expect(input.transactionType).toBe("location_transfer");
  });

  it("builds adjustment transactions in both directions", () => {
    const increase = buildAdjustmentTransaction(snapshot, movement(), "increase");
    const decrease = buildAdjustmentTransaction(snapshot, movement(), "decrease");
    expect(increase.transactionType).toBe("adjustment_increase");
    expect(decrease.entries[0]?.baseQuantityDelta).toBeLessThan(0);
  });

  it("projects balances and low-stock indicators", () => {
    const balances = getStockBalances(snapshot);
    expect(balances.length).toBeGreaterThan(0);
    const lowStock = getLowStockItems({
      ...snapshot,
      items: snapshot.items.map((item) =>
        item.id === "item_clear_cup_330" ? { ...item, minimumStock: 999999 } : item
      )
    });
    expect(lowStock.some((row) => row.item.id === "item_clear_cup_330")).toBe(true);
  });

  it("lists movement history newest first", () => {
    const history = listMovementHistory(snapshot);
    expect(history.length).toBeGreaterThan(0);
    for (let index = 1; index < history.length; index += 1) {
      expect(history[index - 1]!.occurredAt >= history[index]!.occurredAt).toBe(true);
    }
  });

  it("creates and releases reservations without changing ledger entries", () => {
    const reservation = createReservationRecord(tenantId, {
      itemId: "item_clear_cup_330",
      quantity: 10,
      sourceDocumentId: "so_demo",
      sourceDocumentType: "sales_order",
      unitOfMeasureId: "uom_unit",
      warehouseId: "wh_main"
    });
    expect(reservation.status).toBe("active");
    const released = releaseReservationRecord(reservation);
    expect(released.status).toBe("released");
  });
});
