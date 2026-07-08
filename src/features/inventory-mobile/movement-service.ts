import { createRecordId } from "@/domain/ids";
import type { BarcodeRecord } from "@/domain/inventory-product-types";
import type { PreviewRole } from "@/features/crud/role-preview";
import {
  assertInventoryPermission,
  mapPreviewRoleToInventoryRole,
  type StockMovementRequest
} from "@/features/inventory-product/operations";
import { normalizeBarcode } from "@/features/inventory-product/ledger";
import type { InventoryProductRepository } from "@/persistence/interfaces";
import type { MobileMovementKind } from "@/features/inventory-mobile/offline-queue";

export type LinkBarcodeInput = {
  tenantId: string;
  itemId: string;
  scannedValue: string;
  operatorId: string;
};

export function createMovementIdempotencyKey(prefix = "mobile"): string {
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}:${suffix}`;
}

export function permissionActionForMovement(kind: MobileMovementKind | "lookup"): "receive" | "issue" | "transfer" | "scan" | null {
  switch (kind) {
    case "receipt":
      return "receive";
    case "issue":
      return "issue";
    case "transfer":
      return "transfer";
    case "lookup":
      return "scan";
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

export function assertMobileMovementPermission(role: PreviewRole, kind: MobileMovementKind): void {
  const inventoryRole = mapPreviewRoleToInventoryRole(role);
  const action = permissionActionForMovement(kind);
  if (!action) return;
  assertInventoryPermission(inventoryRole, action);
}

export function validateMobileMovementInput(input: {
  kind: MobileMovementKind;
  quantity: number;
  locationId: string;
  destinationLocationId?: string;
}): string | null {
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) return "quantity_required";
  if (!input.locationId.trim()) return "location_required";
  if (input.kind === "transfer" && !input.destinationLocationId?.trim()) {
    return "destination_required";
  }
  if (input.kind === "transfer" && input.destinationLocationId === input.locationId) {
    return "transfer_same_location";
  }
  return null;
}

export async function postMobileMovement(
  repo: InventoryProductRepository,
  tenantId: string,
  kind: MobileMovementKind,
  request: StockMovementRequest
): Promise<{ transactionId: string; idempotencyKey: string }> {
  const scoped = { ...request, tenantId };
  if (kind === "receipt") {
    const result = await repo.receiveStock(tenantId, scoped);
    return { idempotencyKey: result.transaction.idempotencyKey, transactionId: result.transaction.id };
  }
  if (kind === "issue") {
    const result = await repo.issueStock(tenantId, scoped);
    return { idempotencyKey: result.transaction.idempotencyKey, transactionId: result.transaction.id };
  }
  const result = await repo.transferStock(tenantId, scoped);
  return { idempotencyKey: result.transaction.idempotencyKey, transactionId: result.transaction.id };
}

export async function linkBarcodeToItem(
  repo: InventoryProductRepository,
  input: LinkBarcodeInput
): Promise<BarcodeRecord> {
  const snapshot = await repo.getSnapshot(input.tenantId);
  const item = snapshot.items.find((row) => row.id === input.itemId && row.tenantId === input.tenantId);
  if (!item) throw new Error("Inventory item not found.");

  const normalizedValue = normalizeBarcode(input.scannedValue);
  if (!normalizedValue) throw new Error("Barcode value is required.");

  const duplicate = snapshot.barcodes.some(
    (record) =>
      record.tenantId === input.tenantId &&
      record.status === "active" &&
      record.normalizedValue === normalizedValue
  );
  if (duplicate) throw new Error("Barcode is already linked to an item.");

  const now = new Date().toISOString();
  const record: BarcodeRecord = {
    createdAt: now,
    customerId: null,
    id: createRecordId("bc"),
    itemId: item.id,
    lotId: null,
    lotSpecific: false,
    normalizedValue,
    ownershipType: "internal",
    packagingConfigurationId: null,
    primary: false,
    productVariantId: null,
    replacedBarcodeId: null,
    status: "active",
    supplierId: null,
    symbology: "unknown",
    tenantId: input.tenantId,
    updatedAt: now,
    validFrom: now.slice(0, 10),
    validTo: null,
    value: input.scannedValue.trim(),
    verificationStatus: "unchecked"
  };

  await repo.replaceSnapshot(input.tenantId, {
    ...snapshot,
    barcodes: [...snapshot.barcodes, record]
  });
  return record;
}
