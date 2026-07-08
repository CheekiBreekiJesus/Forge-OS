import type { InventoryItemMaster, InventoryTransaction, StockLocation } from "@/domain/inventory-product-types";
import { buildStockBalances } from "@/features/inventory-product/ledger";
import type { InventoryProductSnapshot } from "@/persistence/interfaces";

export type ItemStockContext = {
  item: InventoryItemMaster;
  availableStock: number;
  physicalStock: number;
  defaultLocation: StockLocation | null;
  locations: StockLocation[];
  unitSymbol: string;
  warehouseId: string;
};

export function getItemStockContext(
  snapshot: InventoryProductSnapshot,
  tenantId: string,
  itemId: string
): ItemStockContext | null {
  const item = snapshot.items.find((row) => row.id === itemId && row.tenantId === tenantId);
  if (!item) return null;

  const balances = buildStockBalances(snapshot.entries, snapshot.reservations).filter(
    (balance) => balance.itemId === itemId && balance.tenantId === tenantId
  );
  const availableStock = balances
    .filter((balance) => balance.stockCondition === "available")
    .reduce((sum, balance) => sum + balance.availableStock, 0);
  const physicalStock = balances.reduce((sum, balance) => sum + balance.physicalStock, 0);
  const locations = snapshot.locations.filter((row) => row.tenantId === tenantId && row.active);
  const defaultLocation =
    locations.find((row) => row.id === item.defaultLocationId) ??
    locations.find((row) => row.locationType === "shelf") ??
    locations[0] ??
    null;
  const unit = snapshot.unitOfMeasures.find((row) => row.id === item.baseUnitOfMeasureId);

  return {
    item,
    availableStock,
    physicalStock,
    defaultLocation,
    locations,
    unitSymbol: unit?.symbol ?? "un",
    warehouseId: defaultLocation?.warehouseId ?? snapshot.warehouses[0]?.id ?? ""
  };
}

export function listItemTransactions(
  snapshot: InventoryProductSnapshot,
  tenantId: string,
  itemId: string,
  limit = 20
): InventoryTransaction[] {
  const transactionIds = new Set(
    snapshot.entries
      .filter((entry) => entry.tenantId === tenantId && entry.itemId === itemId)
      .map((entry) => entry.transactionId)
  );
  return snapshot.transactions
    .filter((transaction) => transaction.tenantId === tenantId && transactionIds.has(transaction.id))
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, limit);
}

export function getLocationLabel(snapshot: InventoryProductSnapshot, locationId: string | null): string {
  if (!locationId) return "—";
  const location = snapshot.locations.find((row) => row.id === locationId);
  return location ? `${location.code} · ${location.name}` : locationId;
}
