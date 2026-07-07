"use client";

import { FormEvent, useState } from "react";
import type { InventoryItem, StockMovement } from "@/domain/operations-types";
import type { InventoryMobileCopy } from "@/features/inventory-mobile/copy";
import {
  postStockTransaction,
  validateStockTransaction,
  type AdjustmentMode,
  type StockTransactionType
} from "@/features/inventory-mobile/stock-transaction";
import { InventoryItemSummary, InventoryMovementHistory } from "@/components/inventory-mobile/inventory-movement-history";
import { inputClassName } from "@/components/crud";
import type { InventoryRepository } from "@/persistence/interfaces";

type InventoryItemStockPanelProps = {
  copy: InventoryMobileCopy;
  item: InventoryItem;
  locale: string;
  movements: StockMovement[];
  tenantId: string;
  inventoryRepo: InventoryRepository;
  onPosted: (item: InventoryItem) => void;
  onRescan: () => void;
};

export function InventoryItemStockPanel({
  copy,
  item,
  locale,
  movements,
  tenantId,
  inventoryRepo,
  onPosted,
  onRescan
}: InventoryItemStockPanelProps) {
  const [txType, setTxType] = useState<StockTransactionType>("receipt");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const [lotNote, setLotNote] = useState("");
  const [adjustmentMode, setAdjustmentMode] = useState<AdjustmentMode>("delta");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const parsedQuantity = Number(quantity);

  function resetForm() {
    setQuantity("");
    setReason("");
    setReference("");
    setLotNote("");
    setConfirmOpen(false);
    setError(null);
  }

  function validate(): string | null {
    const validation = validateStockTransaction(
      {
        type: txType,
        quantity: parsedQuantity,
        reason,
        adjustmentMode,
        referenceId: reference || lotNote || null
      },
      item
    );
    if (validation === "reason_required") return copy.transaction.reasonRequired;
    if (validation === "quantity_required") return copy.transaction.quantityRequired;
    if (validation === "negative_stock") return copy.transaction.negativeStockBlocked;
    return null;
  }

  function handlePrepareSubmit(event: FormEvent) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    if (submitting) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setConfirmOpen(false);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const combinedReason = [reason, lotNote].filter(Boolean).join(" · ");
      const { item: updated } = await postStockTransaction(
        inventoryRepo,
        tenantId,
        item.id,
        {
          type: txType,
          quantity: parsedQuantity,
          reason: combinedReason || reason,
          referenceId: reference || null,
          adjustmentMode
        },
        item
      );
      setSuccess(copy.transaction.success);
      resetForm();
      onPosted(updated);
    } catch {
      setError(copy.transaction.failure);
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  const confirmSummary = buildConfirmSummary(copy, txType, parsedQuantity, item.unit, adjustmentMode);

  return (
    <div className="space-y-4" data-testid="inventory-item-stock-panel">
      <InventoryItemSummary copy={copy} item={item} locale={locale} />

      <div className="flex flex-wrap gap-2">
        {(["receipt", "consumption", "adjustment"] as const).map((type) => (
          <button
            className={`min-h-11 flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${
              txType === type
                ? "bg-[var(--forge-accent-orange)] text-white"
                : "border border-[var(--forge-border)] bg-[var(--forge-surface)]"
            }`}
            key={type}
            onClick={() => {
              setTxType(type);
              setError(null);
              setSuccess(null);
            }}
            type="button"
          >
            {transactionTypeLabel(copy, type)}
          </button>
        ))}
      </div>

      <form className="space-y-3 rounded-xl border border-[var(--forge-border)] bg-[var(--forge-surface)] p-4" onSubmit={handlePrepareSubmit}>
        {txType === "adjustment" ? (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                checked={adjustmentMode === "delta"}
                name="adjustmentMode"
                onChange={() => setAdjustmentMode("delta")}
                type="radio"
              />
              {copy.transaction.adjustmentModeDelta}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                checked={adjustmentMode === "target"}
                name="adjustmentMode"
                onChange={() => setAdjustmentMode("target")}
                type="radio"
              />
              {copy.transaction.adjustmentModeTarget}
            </label>
            <p className="text-xs text-[var(--forge-text-muted)]">
              {adjustmentMode === "delta" ? copy.transaction.deltaHint : copy.transaction.targetHint}
            </p>
          </div>
        ) : null}

        <label className="block text-sm font-semibold">
          {txType === "adjustment" && adjustmentMode === "target"
            ? copy.transaction.targetBalance
            : copy.transaction.quantity}
          <input
            className={`${inputClassName} mt-1 min-h-12 text-base`}
            data-testid="stock-quantity-input"
            inputMode="decimal"
            min={txType === "adjustment" && adjustmentMode === "target" ? 0 : 0.0001}
            onChange={(event) => setQuantity(event.target.value)}
            required
            step="any"
            type="number"
            value={quantity}
          />
        </label>

        <label className="block text-sm font-semibold">
          {copy.transaction.reason}
          <input
            className={`${inputClassName} mt-1 min-h-12 text-base`}
            data-testid="stock-reason-input"
            onChange={(event) => setReason(event.target.value)}
            required={txType === "adjustment"}
            value={reason}
          />
        </label>

        <label className="block text-sm font-semibold">
          {copy.transaction.reference}
          <input
            className={`${inputClassName} mt-1`}
            onChange={(event) => setReference(event.target.value)}
            value={reference}
          />
        </label>

        {txType === "receipt" ? (
          <label className="block text-sm font-semibold">
            {copy.transaction.lotNote}
            <input
              className={`${inputClassName} mt-1`}
              onChange={(event) => setLotNote(event.target.value)}
              value={lotNote}
            />
          </label>
        ) : null}

        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        {success ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{success}</p> : null}

        <button
          className="min-h-12 w-full rounded-lg bg-[var(--forge-accent-orange)] px-4 py-3 text-base font-semibold text-white disabled:opacity-50"
          disabled={submitting}
          type="submit"
        >
          {copy.transaction.confirm}
        </button>
      </form>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-[var(--forge-border)] bg-[var(--forge-surface)] p-5 shadow-xl">
            <h3 className="text-lg font-bold">{copy.transaction.confirmTitle}</h3>
            <p className="mt-2 text-sm text-[var(--forge-text-secondary)]">{confirmSummary}</p>
            <div className="mt-4 flex gap-2">
              <button
                className="min-h-11 flex-1 rounded-lg border border-[var(--forge-border)] px-3 py-2 text-sm font-semibold"
                disabled={submitting}
                onClick={() => setConfirmOpen(false)}
                type="button"
              >
                {copy.transaction.cancel}
              </button>
              <button
                className="min-h-11 flex-1 rounded-lg bg-[var(--forge-accent-orange)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                data-testid="confirm-stock-transaction"
                disabled={submitting}
                onClick={() => void handleConfirm()}
                type="button"
              >
                {submitting ? copy.transaction.submitting : copy.transaction.confirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        className="min-h-11 w-full rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-4 py-2 text-sm font-semibold"
        onClick={onRescan}
        type="button"
      >
        {copy.scanner.controls.rescan}
      </button>

      <section>
        <h3 className="mb-2 text-sm font-semibold">{copy.item.recentMovements}</h3>
        <InventoryMovementHistory copy={copy} locale={locale} movements={movements} />
      </section>
    </div>
  );
}

function transactionTypeLabel(copy: InventoryMobileCopy, type: StockTransactionType): string {
  switch (type) {
    case "receipt":
      return copy.transaction.typeReceipt;
    case "consumption":
      return copy.transaction.typeConsumption;
    case "adjustment":
      return copy.transaction.typeAdjustment;
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

function buildConfirmSummary(
  copy: InventoryMobileCopy,
  type: StockTransactionType,
  quantity: number,
  unit: string,
  adjustmentMode: AdjustmentMode
): string {
  const qtyLabel = `${quantity} ${unit}`;
  switch (type) {
    case "receipt":
      return `${copy.transaction.confirmReceipt} ${qtyLabel}`;
    case "consumption":
      return `${copy.transaction.confirmConsumption} ${qtyLabel}`;
    case "adjustment":
      return adjustmentMode === "target"
        ? `${copy.transaction.confirmAdjustment}: ${copy.transaction.targetBalance} ${qtyLabel}`
        : `${copy.transaction.confirmAdjustment}: ${qtyLabel}`;
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}
