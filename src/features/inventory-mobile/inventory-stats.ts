import type { InventoryItem, StockMovement } from "@/domain/operations-types";
import { isLowStock } from "@/features/inventory-mobile/barcode-resolver";

export type InventorySummary = {
  totalActive: number;
  lowStockCount: number;
};

export function computeInventorySummary(items: InventoryItem[]): InventorySummary {
  const active = items.filter((item) => item.active);
  return {
    totalActive: active.length,
    lowStockCount: active.filter(isLowStock).length
  };
}

export function mergeRecentMovements(
  movementsByItem: Array<{ item: InventoryItem; movements: StockMovement[] }>,
  limit = 15
): Array<{ movement: StockMovement; item: InventoryItem }> {
  const merged = movementsByItem.flatMap(({ item, movements }) =>
    movements.map((movement) => ({ movement, item }))
  );
  return merged
    .sort((a, b) => b.movement.createdAt.localeCompare(a.movement.createdAt))
    .slice(0, limit);
}
