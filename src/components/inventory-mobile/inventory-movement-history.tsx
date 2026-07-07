"use client";

import type { InventoryItem, StockMovement } from "@/domain/operations-types";
import type { InventoryMobileCopy } from "@/features/inventory-mobile/copy";
import { isLowStock } from "@/features/inventory-mobile/barcode-resolver";

type InventoryMovementHistoryProps = {
  copy: InventoryMobileCopy;
  movements: StockMovement[];
  locale: string;
};

export function InventoryMovementHistory({ copy, movements, locale }: InventoryMovementHistoryProps) {
  if (movements.length === 0) {
    return <p className="text-sm text-[var(--forge-text-muted)]">{copy.item.noMovements}</p>;
  }

  return (
    <ul className="space-y-2" data-testid="inventory-movement-history">
      {movements.map((movement) => (
        <li
          className="rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface-muted)] px-3 py-2 text-sm"
          key={movement.id}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">
              {movementTypeLabel(copy, movement.type)} · {formatSigned(movement.quantity)} {movement.type}
            </span>
            <span className="text-xs text-[var(--forge-text-muted)]">
              {new Date(movement.createdAt).toLocaleString(locale)}
            </span>
          </div>
          <p className="mt-1 text-[var(--forge-text-secondary)]">
            {copy.desktop.movementBalance}: {movement.balanceAfter.toLocaleString(locale)}
          </p>
          <p className="text-[var(--forge-text-muted)]">{movement.reason}</p>
        </li>
      ))}
    </ul>
  );
}

function movementTypeLabel(copy: InventoryMobileCopy, type: StockMovement["type"]): string {
  switch (type) {
    case "receipt":
      return copy.item.movementTypes.receipt;
    case "consumption":
      return copy.item.movementTypes.consumption;
    case "adjustment":
      return copy.item.movementTypes.adjustment;
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

function formatSigned(quantity: number): string {
  return quantity > 0 ? `+${quantity}` : String(quantity);
}

type InventoryItemSummaryProps = {
  copy: InventoryMobileCopy;
  item: InventoryItem;
  locale: string;
};

export function InventoryItemSummary({ copy, item, locale }: InventoryItemSummaryProps) {
  const low = isLowStock(item);
  return (
    <div className="space-y-3 rounded-xl border border-[var(--forge-border)] bg-[var(--forge-surface)] p-4" data-testid="inventory-item-summary">
      <div>
        <h2 className="text-lg font-bold">{item.name}</h2>
        <p className="text-sm text-[var(--forge-text-muted)]">
          {copy.item.barcode}: <span className="font-mono">{item.sku}</span>
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-[var(--forge-text-muted)]">{copy.item.category}</dt>
          <dd className="font-medium">{item.category}</dd>
        </div>
        <div>
          <dt className="text-[var(--forge-text-muted)]">{copy.item.currentStock}</dt>
          <dd className="text-lg font-bold">
            {item.currentQuantity.toLocaleString(locale)} {item.unit}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--forge-text-muted)]">{copy.item.location}</dt>
          <dd className="font-medium">{item.warehouseLocation || "—"}</dd>
        </div>
        <div>
          <dt className="text-[var(--forge-text-muted)]">{copy.item.reorderLevel}</dt>
          <dd className="font-medium">{item.reorderLevel.toLocaleString(locale)}</dd>
        </div>
      </dl>
      <div
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
          low
            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
        }`}
      >
        {low ? `${copy.item.lowStock} · ${copy.desktop.lowStockBadge}` : copy.item.stockOk}
      </div>
    </div>
  );
}
