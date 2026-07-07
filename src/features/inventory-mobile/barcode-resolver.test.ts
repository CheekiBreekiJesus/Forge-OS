import { describe, expect, it } from "vitest";
import type { InventoryItem } from "@/domain/operations-types";
import {
  createSkuBarcodeResolver,
  isLowStock,
  normalizeScanCode
} from "@/features/inventory-mobile/barcode-resolver";

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    active: true,
    archivedAt: null,
    archivedBy: null,
    archiveReason: null,
    batch: null,
    category: "materials",
    createdAt: "2026-01-01T00:00:00.000Z",
    currentQuantity: 10,
    id: "inv_1",
    name: "Test item",
    notes: "",
    productId: null,
    reorderLevel: 5,
    sku: "05601234000250",
    tenantId: "tenant_a",
    unit: "un",
    updatedAt: "2026-01-01T00:00:00.000Z",
    warehouseLocation: "A1",
    ...overrides
  };
}

describe("inventory mobile barcode resolver", () => {
  it("preserves leading zeroes in scan codes", () => {
    expect(normalizeScanCode(" 0001234567890 ")).toBe("0001234567890");
    expect(normalizeScanCode("05601234000250")).toBe("05601234000250");
  });

  it("resolves known SKU to inventory item", async () => {
    const item = makeItem();
    const resolver = createSkuBarcodeResolver(async () => [item]);
    const result = await resolver.resolve("tenant_a", "05601234000250");
    expect(result.status).toBe("resolved");
    if (result.status === "resolved") {
      expect(result.item.id).toBe("inv_1");
    }
  });

  it("scopes resolution to tenant items only", async () => {
    const item = makeItem({ tenantId: "tenant_a" });
    const resolver = createSkuBarcodeResolver(async () => [item]);
    const unknown = await resolver.resolve("tenant_b", "05601234000250");
    expect(unknown.status).toBe("unknown");
  });

  it("does not create or mutate inventory for unknown codes", async () => {
    const items = [makeItem()];
    const resolver = createSkuBarcodeResolver(async () => items);
    const result = await resolver.resolve("tenant_a", "UNKNOWN-CODE");
    expect(result.status).toBe("unknown");
    expect(items).toHaveLength(1);
    expect(items[0]!.currentQuantity).toBe(10);
  });

  it("flags ambiguous active SKU matches", async () => {
    const resolver = createSkuBarcodeResolver(async () => [
      makeItem({ id: "a", sku: "DUPLICATE" }),
      makeItem({ id: "b", sku: "duplicate" })
    ]);
    const result = await resolver.resolve("tenant_a", "duplicate");
    expect(result.status).toBe("ambiguous");
  });

  it("ignores archived items", async () => {
    const resolver = createSkuBarcodeResolver(async () => [
      makeItem({ active: false, sku: "ARCHIVED-SKU" })
    ]);
    const result = await resolver.resolve("tenant_a", "ARCHIVED-SKU");
    expect(result.status).toBe("unknown");
  });
});

describe("isLowStock", () => {
  it("detects low stock when quantity is at or below reorder level", () => {
    expect(isLowStock(makeItem({ currentQuantity: 5, reorderLevel: 5 }))).toBe(true);
    expect(isLowStock(makeItem({ currentQuantity: 6, reorderLevel: 5 }))).toBe(false);
    expect(isLowStock(makeItem({ currentQuantity: 0, reorderLevel: 0 }))).toBe(false);
  });
});
