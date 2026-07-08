"use client";

import type { InventoryTransaction } from "@/domain/inventory-product-types";
import type { InventoryMobileCopy } from "@/features/inventory-mobile/copy";
import type { ItemStockContext } from "@/features/inventory-mobile/item-context";
import { isLowStockItem } from "@/features/inventory-mobile/barcode-resolver";

type InventoryMovementHistoryProps = {
  copy: InventoryMobileCopy;
  transactions: InventoryTransaction[];
  locale: string;
};

export function InventoryMovementHistory({ copy, transactions, locale }: InventoryMovementHistoryProps) {
  if (transactions.length === 0) {
    return <p className="text-sm text-[var(--forge-text-muted)]">{copy.item.noMovements}</p>;
  }

  return (
    <ul className="space-y-2" data-testid="inventory-movement-history">
      {transactions.map((transaction) => (
        <li
          className="rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface-muted)] px-3 py-2 text-sm"
          key={transaction.id}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">{transaction.transactionType}</span>
            <span className="text-xs text-[var(--forge-text-muted)]">
              {new Date(transaction.occurredAt).toLocaleString(locale)}
            </span>
          </div>
          <p className="mt-1 text-[var(--forge-text-muted)]">{transaction.reasonCode}</p>
          {transaction.notes ? (
            <p className="text-[var(--forge-text-secondary)]">{transaction.notes}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
};

type InventoryItemSummaryProps = {
  copy: InventoryMobileCopy;
  context: ItemStockContext;
  barcodeValue: string;
  locale: string;
};

export function InventoryItemSummary({ barcodeValue, context, copy, locale }: InventoryItemSummaryProps) {
  const low = isLowStockItem(context.item, context.availableStock);
  return (
    <div
      className="space-y-3 rounded-xl border border-[var(--forge-border)] bg-[var(--forge-surface)] p-4"
      data-testid="inventory-item-summary"
    >
      <div>
        <h2 className="text-lg font-bold">{context.item.name}</h2>
        <p className="text-sm text-[var(--forge-text-muted)]">
          {copy.item.barcode}: <span className="font-mono">{barcodeValue}</span>
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-[var(--forge-text-muted)]">{copy.item.reference}</dt>
          <dd className="font-medium">{context.item.internalReference}</dd>
        </div>
        <div>
          <dt className="text-[var(--forge-text-muted)]">{copy.item.itemType}</dt>
          <dd className="font-medium">{context.item.itemType}</dd>
        </div>
        <div>
          <dt className="text-[var(--forge-text-muted)]">{copy.item.currentStock}</dt>
          <dd className="text-lg font-bold">
            {context.availableStock.toLocaleString(locale)} {context.unitSymbol}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--forge-text-muted)]">{copy.item.location}</dt>
          <dd className="font-medium">
            {context.defaultLocation ? `${context.defaultLocation.code}` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--forge-text-muted)]">{copy.item.reorderLevel}</dt>
          <dd className="font-medium">{context.item.minimumStock.toLocaleString(locale)}</dd>
        </div>
      </dl>
      <div
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
          low
            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
            : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
        }`}
      >
        {low ? copy.item.lowStock : copy.item.stockOk}
      </div>
    </div>
  );
}
