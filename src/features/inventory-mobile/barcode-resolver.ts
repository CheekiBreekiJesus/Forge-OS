import type { BarcodeRecord, InventoryItemMaster } from "@/domain/inventory-product-types";
import { normalizeBarcode, resolveBarcode } from "@/features/inventory-product/ledger";
import type { InventoryProductSnapshot } from "@/persistence/interfaces";

export type MobileBarcodeResolveResult =
  | {
      status: "resolved";
      item: InventoryItemMaster;
      barcode: BarcodeRecord;
      normalizedCode: string;
      scannedValue: string;
    }
  | { status: "unknown"; normalizedCode: string; scannedValue: string }
  | {
      status: "ambiguous";
      barcodes: BarcodeRecord[];
      normalizedCode: string;
      scannedValue: string;
    };

/** Trim outer whitespace; preserve leading zeroes; never parse as a number. */
export function normalizeScanCode(value: string): string {
  return normalizeBarcode(value);
}

export function resolveMobileBarcode(
  snapshot: InventoryProductSnapshot,
  tenantId: string,
  rawCode: string
): MobileBarcodeResolveResult {
  const scannedValue = rawCode;
  const normalizedCode = normalizeScanCode(rawCode);
  if (!normalizedCode) {
    return { status: "unknown", normalizedCode, scannedValue };
  }

  const tenantBarcodes = snapshot.barcodes.filter(
    (record) => record.tenantId === tenantId && record.status === "active"
  );
  const resolution = resolveBarcode(tenantBarcodes, rawCode);

  if (resolution.status === "unknown") {
    return { status: "unknown", normalizedCode: resolution.normalizedValue, scannedValue };
  }
  if (resolution.status === "ambiguous") {
    return {
      status: "ambiguous",
      barcodes: resolution.matches,
      normalizedCode: resolution.normalizedValue,
      scannedValue
    };
  }

  const item = snapshot.items.find(
    (row) => row.id === resolution.barcode.itemId && row.tenantId === tenantId && row.active
  );
  if (!item) {
    return {
      status: "unknown",
      normalizedCode: resolution.barcode.normalizedValue,
      scannedValue
    };
  }

  return {
    status: "resolved",
    item,
    barcode: resolution.barcode,
    normalizedCode: resolution.barcode.normalizedValue,
    scannedValue
  };
}

export function isLowStockItem(item: InventoryItemMaster, availableStock: number): boolean {
  return item.minimumStock > 0 && availableStock <= item.minimumStock;
}
