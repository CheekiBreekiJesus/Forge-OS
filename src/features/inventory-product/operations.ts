import { createRecordId } from "@/domain/ids";
import type {
  InventoryActivityType,
  InventoryItemMaster,
  InventoryItemType,
  InventoryPermissionAction,
  InventoryPermissionRole,
  InventoryReservation,
  InventoryReservationStatus,
  StockCondition
} from "@/domain/inventory-product-types";
import type { PreviewRole } from "@/features/crud/role-preview";
import {
  buildStockBalances,
  canPerformInventoryAction,
  type LedgerEntryInput,
  type PostTransactionInput,
  type StockBalance
} from "@/features/inventory-product/ledger";
import type { InventoryProductSnapshot } from "@/persistence/interfaces";

export type InventoryMovementKind = "receipt" | "issue" | "transfer" | "adjustment";

export type StockMovementRequest = {
  tenantId: string;
  operatorId: string;
  itemId: string;
  warehouseId: string;
  locationId: string;
  lotId?: string | null;
  productVariantId?: string | null;
  quantity: number;
  unitOfMeasureId: string;
  reasonCode: string;
  notes?: string;
  stockCondition?: StockCondition;
  allowNegativeAvailable?: boolean;
  overrideReason?: string;
  destinationLocationId?: string;
  destinationStockCondition?: StockCondition;
  idempotencyKey: string;
};

export type CreateInventoryItemMasterInput = {
  internalReference: string;
  itemType: InventoryItemType;
  name: string;
  description?: string;
  baseUnitOfMeasureId: string;
  minimumStock?: number;
  preferredStock?: number;
  defaultLocationId?: string | null;
  skuBarcode?: string | null;
};

export type CreateReservationInput = {
  itemId: string;
  productVariantId?: string | null;
  warehouseId: string;
  locationId?: string | null;
  lotId?: string | null;
  quantity: number;
  unitOfMeasureId: string;
  sourceDocumentType: InventoryReservation["sourceDocumentType"];
  sourceDocumentId: string;
};

export function mapPreviewRoleToInventoryRole(role: PreviewRole): InventoryPermissionRole {
  switch (role) {
    case "owner":
      return "company_owner";
    case "warehouse_manager":
      return "warehouse_manager";
    case "warehouse_operator":
      return "warehouse_operator";
    case "production_manager":
      return "warehouse_manager";
    case "sales":
      return "auditor";
    default: {
      const exhaustive: never = role;
      return exhaustive;
    }
  }
}

export function assertInventoryPermission(
  role: InventoryPermissionRole,
  action: InventoryPermissionAction
): void {
  if (!canPerformInventoryAction(role, action)) {
    throw new Error(`Role ${role} is not allowed to perform ${action}.`);
  }
}

export function inventoryActivityTypeForMovement(kind: InventoryMovementKind): InventoryActivityType {
  switch (kind) {
    case "receipt":
      return "receipt.posted";
    case "issue":
      return "inventory.adjusted";
    case "transfer":
      return "inventory.transferred";
    case "adjustment":
      return "inventory.adjusted";
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

function resolveItem(snapshot: InventoryProductSnapshot, itemId: string): InventoryItemMaster {
  const item = snapshot.items.find((row) => row.id === itemId);
  if (!item) throw new Error("Inventory item not found.");
  return item;
}

function resolveVariantSnapshot(
  snapshot: InventoryProductSnapshot,
  productVariantId: string | null | undefined
): string | null {
  if (!productVariantId) return null;
  const variant = snapshot.variants.find((row) => row.id === productVariantId);
  const product = variant ? snapshot.products.find((row) => row.id === variant.productId) : null;
  if (!variant || !product) return null;
  return `${product.productCode} / ${variant.variantType}`;
}

function baseEntry(
  snapshot: InventoryProductSnapshot,
  request: StockMovementRequest,
  quantityDelta: number,
  locationId: string,
  stockCondition: StockCondition
): LedgerEntryInput {
  const item = resolveItem(snapshot, request.itemId);
  return {
    baseQuantityDelta: quantityDelta,
    costBasis: null,
    itemId: item.id,
    itemReferenceSnapshot: item.internalReference,
    locationId,
    lotId: request.lotId ?? null,
    productVariantId: request.productVariantId ?? null,
    productVariantSnapshot: resolveVariantSnapshot(snapshot, request.productVariantId),
    quantityDelta,
    stockCondition,
    unitOfMeasureId: request.unitOfMeasureId,
    warehouseId: request.warehouseId
  };
}

export function validateStockMovementRequest(
  snapshot: InventoryProductSnapshot,
  request: StockMovementRequest,
  kind: InventoryMovementKind
): string[] {
  const errors: string[] = [];
  if (!request.tenantId.trim()) errors.push("Tenant is required.");
  if (!request.operatorId.trim()) errors.push("Operator is required.");
  if (!request.itemId.trim()) errors.push("Item is required.");
  if (!request.warehouseId.trim()) errors.push("Warehouse is required.");
  if (!request.locationId.trim()) errors.push("Location is required.");
  if (!request.unitOfMeasureId.trim()) errors.push("Unit of measure is required.");
  if (!request.reasonCode.trim()) errors.push("Reason code is required.");
  if (!Number.isFinite(request.quantity) || request.quantity <= 0) {
    errors.push("Quantity must be a positive number.");
  }
  if (!snapshot.items.some((row) => row.id === request.itemId && row.tenantId === request.tenantId)) {
    errors.push("Item does not belong to the tenant.");
  }
  if (
    !snapshot.warehouses.some(
      (row) => row.id === request.warehouseId && row.tenantId === request.tenantId
    )
  ) {
    errors.push("Warehouse not found.");
  }
  if (
    !snapshot.locations.some(
      (row) => row.id === request.locationId && row.tenantId === request.tenantId
    )
  ) {
    errors.push("Location not found.");
  }
  if (
    request.lotId &&
    !snapshot.lots.some((row) => row.id === request.lotId && row.tenantId === request.tenantId)
  ) {
    errors.push("Lot not found.");
  }
  if (kind === "transfer") {
    if (!request.destinationLocationId?.trim()) {
      errors.push("Destination location is required for transfers.");
    } else if (
      !snapshot.locations.some(
        (row) => row.id === request.destinationLocationId && row.tenantId === request.tenantId
      )
    ) {
      errors.push("Destination location not found.");
    }
    if (request.destinationLocationId === request.locationId) {
      errors.push("Transfer source and destination must differ.");
    }
  }
  if (request.allowNegativeAvailable && !request.overrideReason?.trim()) {
    errors.push("Negative stock override requires a reason.");
  }
  return errors;
}

export function buildReceiptTransaction(
  snapshot: InventoryProductSnapshot,
  request: StockMovementRequest
): PostTransactionInput {
  const errors = validateStockMovementRequest(snapshot, request, "receipt");
  if (errors.length > 0) throw new Error(errors.join(" "));
  return {
    allowNegativeAvailable: request.allowNegativeAvailable,
    entries: [
      baseEntry(
        snapshot,
        request,
        request.quantity,
        request.locationId,
        request.stockCondition ?? "available"
      )
    ],
    idempotencyKey: request.idempotencyKey,
    notes: request.notes,
    occurredAt: new Date().toISOString(),
    operatorId: request.operatorId,
    overrideReason: request.overrideReason,
    reasonCode: request.reasonCode,
    sourceDocumentId: request.idempotencyKey,
    sourceDocumentType: "receipt",
    tenantId: request.tenantId,
    transactionType: "receipt"
  };
}

export function buildIssueTransaction(
  snapshot: InventoryProductSnapshot,
  request: StockMovementRequest
): PostTransactionInput {
  const errors = validateStockMovementRequest(snapshot, request, "issue");
  if (errors.length > 0) throw new Error(errors.join(" "));
  return {
    allowNegativeAvailable: request.allowNegativeAvailable,
    entries: [
      baseEntry(
        snapshot,
        request,
        -request.quantity,
        request.locationId,
        request.stockCondition ?? "available"
      )
    ],
    idempotencyKey: request.idempotencyKey,
    notes: request.notes,
    occurredAt: new Date().toISOString(),
    operatorId: request.operatorId,
    overrideReason: request.overrideReason,
    reasonCode: request.reasonCode,
    sourceDocumentId: request.idempotencyKey,
    sourceDocumentType: "issue",
    tenantId: request.tenantId,
    transactionType: "adjustment_decrease"
  };
}

export function buildTransferTransaction(
  snapshot: InventoryProductSnapshot,
  request: StockMovementRequest
): PostTransactionInput {
  const errors = validateStockMovementRequest(snapshot, request, "transfer");
  if (errors.length > 0) throw new Error(errors.join(" "));
  const destinationLocationId = request.destinationLocationId!;
  const destinationCondition = request.destinationStockCondition ?? request.stockCondition ?? "available";
  return {
    allowNegativeAvailable: request.allowNegativeAvailable,
    entries: [
      baseEntry(snapshot, request, -request.quantity, request.locationId, request.stockCondition ?? "available"),
      baseEntry(snapshot, request, request.quantity, destinationLocationId, destinationCondition)
    ],
    idempotencyKey: request.idempotencyKey,
    notes: request.notes,
    occurredAt: new Date().toISOString(),
    operatorId: request.operatorId,
    overrideReason: request.overrideReason,
    reasonCode: request.reasonCode,
    sourceDocumentId: request.idempotencyKey,
    sourceDocumentType: "transfer",
    tenantId: request.tenantId,
    transactionType: "location_transfer"
  };
}

export function buildAdjustmentTransaction(
  snapshot: InventoryProductSnapshot,
  request: StockMovementRequest,
  direction: "increase" | "decrease"
): PostTransactionInput {
  const errors = validateStockMovementRequest(snapshot, request, "adjustment");
  if (errors.length > 0) throw new Error(errors.join(" "));
  const signedQuantity = direction === "increase" ? request.quantity : -request.quantity;
  return {
    allowNegativeAvailable: request.allowNegativeAvailable,
    entries: [
      baseEntry(
        snapshot,
        request,
        signedQuantity,
        request.locationId,
        request.stockCondition ?? "available"
      )
    ],
    idempotencyKey: request.idempotencyKey,
    notes: request.notes,
    occurredAt: new Date().toISOString(),
    operatorId: request.operatorId,
    overrideReason: request.overrideReason,
    reasonCode: request.reasonCode,
    sourceDocumentId: request.idempotencyKey,
    sourceDocumentType: "adjustment",
    tenantId: request.tenantId,
    transactionType: direction === "increase" ? "adjustment_increase" : "adjustment_decrease"
  };
}

export function createInventoryItemMaster(
  tenantId: string,
  input: CreateInventoryItemMasterInput,
  now = new Date().toISOString()
): InventoryItemMaster {
  if (!input.internalReference.trim() || !input.name.trim()) {
    throw new Error("Reference and name are required.");
  }
  return {
    active: true,
    archivedAt: null,
    baseUnitOfMeasureId: input.baseUnitOfMeasureId,
    createdAt: now,
    defaultLocationId: input.defaultLocationId ?? null,
    defaultStockCondition: "available",
    description: input.description?.trim() ?? "",
    expiryTrackingPolicy: "none",
    id: createRecordId("item"),
    internalReference: input.internalReference.trim().toUpperCase(),
    itemType: input.itemType,
    lotTrackingPolicy: "optional",
    minimumStock: input.minimumStock ?? 0,
    name: input.name.trim(),
    preferredStock: input.preferredStock ?? 0,
    stockTrackingEnabled: true,
    tenantId,
    updatedAt: now
  };
}

export function createReservationRecord(
  tenantId: string,
  input: CreateReservationInput,
  now = new Date().toISOString()
): InventoryReservation {
  if (!input.itemId.trim()) throw new Error("Item is required.");
  if (!input.sourceDocumentId.trim()) throw new Error("Source document is required.");
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
    throw new Error("Reservation quantity must be positive.");
  }
  return {
    baseQuantity: input.quantity,
    createdAt: now,
    id: createRecordId("res"),
    itemId: input.itemId,
    locationId: input.locationId ?? null,
    lotId: input.lotId ?? null,
    productVariantId: input.productVariantId ?? null,
    quantity: input.quantity,
    sourceDocumentId: input.sourceDocumentId,
    sourceDocumentType: input.sourceDocumentType,
    status: "active",
    tenantId,
    unitOfMeasureId: input.unitOfMeasureId,
    updatedAt: now,
    warehouseId: input.warehouseId
  };
}

export function releaseReservationRecord(
  reservation: InventoryReservation,
  status: Extract<InventoryReservationStatus, "released" | "consumed"> = "released",
  now = new Date().toISOString()
): InventoryReservation {
  if (reservation.status !== "active" && reservation.status !== "partially_consumed") {
    throw new Error("Only active reservations can be released.");
  }
  return { ...reservation, status, updatedAt: now };
}

export function getStockBalances(snapshot: InventoryProductSnapshot): StockBalance[] {
  return buildStockBalances(snapshot.entries, snapshot.reservations);
}

export function getLowStockItems(snapshot: InventoryProductSnapshot): Array<{
  item: InventoryItemMaster;
  available: number;
}> {
  const balances = getStockBalances(snapshot);
  const availableByItem = new Map<string, number>();
  for (const balance of balances) {
    if (balance.stockCondition !== "available") continue;
    availableByItem.set(
      balance.itemId,
      (availableByItem.get(balance.itemId) ?? 0) + balance.availableStock
    );
  }
  return snapshot.items
    .filter((item) => item.active && item.minimumStock > 0)
    .map((item) => ({
      available: availableByItem.get(item.id) ?? 0,
      item
    }))
    .filter((row) => row.available < row.item.minimumStock)
    .sort((a, b) => a.available - b.available);
}

export function listMovementHistory(snapshot: InventoryProductSnapshot) {
  return [...snapshot.transactions].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}
