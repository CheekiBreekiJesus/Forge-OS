import type { InventoryItem } from "@/domain/operations-types";

export type BarcodeResolveStatus = "resolved" | "unknown" | "ambiguous";

export type BarcodeResolveResult =
  | { status: "resolved"; item: InventoryItem; normalizedCode: string; scannedValue: string }
  | { status: "unknown"; normalizedCode: string; scannedValue: string }
  | { status: "ambiguous"; items: InventoryItem[]; normalizedCode: string; scannedValue: string };

export interface InventoryBarcodeResolver {
  resolve(tenantId: string, rawCode: string): Promise<BarcodeResolveResult>;
}

/** Trim outer whitespace and collapse internal spaces; never parse as a number. */
export function normalizeScanCode(value: string): string {
  return value.trim().replace(/\s+/g, "");
}

function skuMatchesCode(item: InventoryItem, normalizedCode: string): boolean {
  return normalizeScanCode(item.sku).toUpperCase() === normalizedCode.toUpperCase();
}

/**
 * MVP fallback: internal barcode value equals inventory SKU.
 * Replace with a durable barcode registry resolver when persisted.
 */
export function createSkuBarcodeResolver(
  listItems: (tenantId: string) => Promise<InventoryItem[]>
): InventoryBarcodeResolver {
  return {
    async resolve(tenantId, rawCode) {
      const scannedValue = rawCode;
      const normalizedCode = normalizeScanCode(rawCode);
      if (!normalizedCode) {
        return { status: "unknown", normalizedCode, scannedValue };
      }

      const items = (await listItems(tenantId)).filter(
        (item) => item.active && item.tenantId === tenantId
      );
      const matches = items.filter((item) => skuMatchesCode(item, normalizedCode));

      if (matches.length === 0) {
        return { status: "unknown", normalizedCode, scannedValue };
      }
      if (matches.length > 1) {
        return { status: "ambiguous", items: matches, normalizedCode, scannedValue };
      }
      return { status: "resolved", item: matches[0]!, normalizedCode, scannedValue };
    }
  };
}

export function isLowStock(item: InventoryItem): boolean {
  return item.reorderLevel > 0 && item.currentQuantity <= item.reorderLevel;
}
