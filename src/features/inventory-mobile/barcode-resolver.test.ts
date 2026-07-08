import { describe, expect, it } from "vitest";
import { createInventoryProductDemoState } from "@/features/inventory-product/demo";
import {
  isLowStockItem,
  normalizeScanCode,
  resolveMobileBarcode
} from "@/features/inventory-mobile/barcode-resolver";

const tenantId = "tenant_jh_gomes";

describe("inventory mobile barcode resolver", () => {
  const snapshot = createInventoryProductDemoState(tenantId);

  it("preserves leading zeroes in scan codes", () => {
    expect(normalizeScanCode(" 0001234567890 ")).toBe("0001234567890");
    expect(normalizeScanCode("05601234001005")).toBe("05601234001005");
  });

  it("resolves known barcode to inventory item master", async () => {
    const result = resolveMobileBarcode(snapshot, tenantId, "05601234001005");
    expect(result.status).toBe("resolved");
    if (result.status === "resolved") {
      expect(result.item.id).toBe("item_clear_cup_330");
    }
  });

  it("scopes resolution to tenant barcodes only", () => {
    const unknown = resolveMobileBarcode(snapshot, "tenant_other", "05601234001005");
    expect(unknown.status).toBe("unknown");
  });

  it("does not create inventory for unknown codes", () => {
    const beforeCount = snapshot.items.length;
    const result = resolveMobileBarcode(snapshot, tenantId, "UNKNOWN-CODE");
    expect(result.status).toBe("unknown");
    expect(snapshot.items).toHaveLength(beforeCount);
  });

  it("returns unknown when barcode maps to inactive item", () => {
    const inactiveSnapshot = {
      ...snapshot,
      items: snapshot.items.map((item) =>
        item.id === "item_clear_cup_330" ? { ...item, active: false } : item
      )
    };
    const result = resolveMobileBarcode(inactiveSnapshot, tenantId, "05601234001005");
    expect(result.status).toBe("unknown");
  });
});

describe("isLowStockItem", () => {
  it("detects low stock when available is at or below minimum", () => {
    const item = createInventoryProductDemoState(tenantId).items[0]!;
    expect(isLowStockItem(item, item.minimumStock)).toBe(true);
    expect(isLowStockItem(item, item.minimumStock + 1)).toBe(false);
    expect(isLowStockItem({ ...item, minimumStock: 0 }, 0)).toBe(false);
  });
});
