import type { InventoryItemMaster, InventoryTransaction, StockLocation } from "@/domain/inventory-product-types";
import type { InventoryItemSummary, MovementHistoryEntry, StockBalanceSummary, StockLocationSummary } from "@/application/inventory-service";
import { getItemStockContext, listItemTransactions } from "@/features/inventory-mobile/item-context";
import type { InventoryProductSnapshot } from "@/persistence/interfaces";
import type { ItemStockContext } from "@/features/inventory-mobile/item-context";

export function mapApiItemToMaster(item: InventoryItemSummary, tenantId: string): InventoryItemMaster {
  return {
    active: item.active,
    archivedAt: null,
    baseUnitOfMeasureId: item.baseUnitCode,
    createdAt: item.createdAt,
    defaultLocationId: item.defaultLocationId,
    defaultStockCondition: "available",
    description: item.description,
    expiryTrackingPolicy: "none",
    id: item.id,
    internalReference: item.internalReference,
    itemType: item.itemType as InventoryItemMaster["itemType"],
    lotTrackingPolicy: "optional",
    minimumStock: item.minimumStock,
    name: item.name,
    preferredStock: item.preferredStock,
    stockTrackingEnabled: true,
    tenantId,
    updatedAt: item.updatedAt
  };
}

export function mapApiLocation(location: StockLocationSummary): StockLocation {
  return {
    active: location.active,
    code: location.code,
    createdAt: "",
    id: location.id,
    locationType: location.locationType as StockLocation["locationType"],
    name: location.name,
    parentLocationId: null,
    tenantId: location.tenantId,
    updatedAt: "",
    warehouseId: location.warehouseId
  };
}

export function buildItemStockContextFromApi(input: {
  item: InventoryItemSummary;
  locations: StockLocationSummary[];
  balances: StockBalanceSummary[];
  tenantId: string;
}): ItemStockContext {
  const locations = input.locations.map(mapApiLocation);
  const itemBalances = input.balances.filter((balance) => balance.itemId === input.item.id);
  const availableStock = itemBalances
    .filter((balance) => balance.stockCondition === "available")
    .reduce((sum, balance) => sum + balance.availableStock, 0);
  const physicalStock = itemBalances.reduce((sum, balance) => sum + balance.physicalStock, 0);
  const defaultLocation =
    locations.find((row) => row.id === input.item.defaultLocationId) ??
    locations.find((row) => row.locationType === "shelf") ??
    locations[0] ??
    null;

  return {
    availableStock,
    defaultLocation,
    item: mapApiItemToMaster(input.item, input.tenantId),
    locations,
    physicalStock,
    unitSymbol: input.item.baseUnitCode,
    warehouseId: defaultLocation?.warehouseId ?? locations[0]?.warehouseId ?? ""
  };
}

export function mapMovementHistoryToTransactions(
  movements: MovementHistoryEntry[],
  tenantId: string
): InventoryTransaction[] {
  const byId = new Map<string, InventoryTransaction>();
  for (const movement of movements) {
    const existing = byId.get(movement.transactionId);
    if (existing) continue;
    byId.set(movement.transactionId, {
      createdAt: movement.occurredAt,
      id: movement.transactionId,
      idempotencyKey: movement.transactionId,
      notes: movement.notes,
      occurredAt: movement.occurredAt,
      operatorId: movement.operatorId,
      postedAt: movement.occurredAt,
      reasonCode: movement.reasonCode,
      reversalOfTransactionId: null,
      sourceDocumentId: null,
      sourceDocumentType: null,
      status: "posted",
      tenantId,
      transactionType: movement.transactionType as InventoryTransaction["transactionType"]
    });
  }
  return [...byId.values()];
}

export function getDemoItemStockContext(
  snapshot: InventoryProductSnapshot,
  tenantId: string,
  itemId: string
): ItemStockContext | null {
  return getItemStockContext(snapshot, tenantId, itemId);
}

export function getDemoItemTransactions(
  snapshot: InventoryProductSnapshot,
  tenantId: string,
  itemId: string
): InventoryTransaction[] {
  return listItemTransactions(snapshot, tenantId, itemId);
}
