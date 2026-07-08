"use client";

import { FormEvent, useMemo, useState } from "react";
import type { InventoryTransaction } from "@/domain/inventory-product-types";
import { inputClassName } from "@/components/crud";
import {
  InventoryItemSummary,
  InventoryMovementHistory
} from "@/components/inventory-mobile/inventory-movement-history";
import type { InventoryMobileCopy } from "@/features/inventory-mobile/copy";
import type { ItemStockContext } from "@/features/inventory-mobile/item-context";
import {
  assertMobileMovementPermission,
  createMovementIdempotencyKey,
  postMobileMovement,
  validateMobileMovementInput
} from "@/features/inventory-mobile/movement-service";
import {
  enqueueMovement,
  isBrowserOnline,
  markMovementSynced
} from "@/features/inventory-mobile/offline-queue";
import { vibrateScanError, vibrateScanSuccess } from "@/features/inventory-mobile/scan-feedback";
import { readPreviewRole } from "@/features/crud/role-preview";
import type { InventoryProductRepository } from "@/persistence/interfaces";
import type { MobileMovementKind } from "@/features/inventory-mobile/offline-queue";

type InventoryItemStockPanelProps = {
  copy: InventoryMobileCopy;
  context: ItemStockContext;
  barcodeValue: string;
  locale: string;
  transactions: InventoryTransaction[];
  tenantId: string;
  operatorId: string;
  inventoryProduct: InventoryProductRepository;
  onPosted: () => void;
  onRescan: () => void;
};

type ActionKind = MobileMovementKind | "lookup";

export function InventoryItemStockPanel({
  barcodeValue,
  context,
  copy,
  inventoryProduct,
  locale,
  onPosted,
  onRescan,
  operatorId,
  tenantId,
  transactions
}: InventoryItemStockPanelProps) {
  const [action, setAction] = useState<ActionKind>("lookup");
  const [quantity, setQuantity] = useState("");
  const [reasonCode, setReasonCode] = useState("mobile_scan");
  const [notes, setNotes] = useState("");
  const [locationId, setLocationId] = useState(context.defaultLocation?.id ?? "");
  const [destinationLocationId, setDestinationLocationId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const parsedQuantity = Number(quantity);
  const previewRole = useMemo(() => readPreviewRole(), []);

  const locationOptions = useMemo(
    () => context.locations.filter((row) => row.warehouseId === context.warehouseId),
    [context.locations, context.warehouseId]
  );

  function mapValidationError(code: string | null): string | null {
    if (!code) return null;
    switch (code) {
      case "quantity_required":
        return copy.transaction.quantityRequired;
      case "location_required":
        return copy.transaction.locationRequired;
      case "destination_required":
        return copy.transaction.destinationRequired;
      case "transfer_same_location":
        return copy.transaction.transferSameLocation;
      default:
        return copy.transaction.failure;
    }
  }

  function validate(): string | null {
    if (action === "lookup") return null;
    try {
      assertMobileMovementPermission(previewRole, action);
    } catch {
      return copy.transaction.permissionDenied;
    }
    return mapValidationError(
      validateMobileMovementInput({
        destinationLocationId,
        kind: action,
        locationId,
        quantity: parsedQuantity
      })
    );
  }

  function handlePrepareSubmit(event: FormEvent) {
    event.preventDefault();
    if (action === "lookup") return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      vibrateScanError();
      return;
    }
    setError(null);
    setIdempotencyKey(createMovementIdempotencyKey(action));
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    if (submitting || action === "lookup") return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      setConfirmOpen(false);
      vibrateScanError();
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const request = {
      destinationLocationId: action === "transfer" ? destinationLocationId : undefined,
      idempotencyKey: idempotencyKey || createMovementIdempotencyKey(action),
      itemId: context.item.id,
      locationId,
      lotId: null,
      notes: notes.trim(),
      operatorId,
      quantity: parsedQuantity,
      reasonCode: reasonCode.trim() || "mobile_scan",
      tenantId,
      unitOfMeasureId: context.item.baseUnitOfMeasureId,
      warehouseId: context.warehouseId
    };

    try {
      if (!isBrowserOnline()) {
        enqueueMovement(tenantId, action, request);
        setSuccess(copy.transaction.queued);
        vibrateScanSuccess();
        setConfirmOpen(false);
        onPosted();
        return;
      }

      await postMobileMovement(inventoryProduct, tenantId, action, request);
      markMovementSynced(tenantId, request.idempotencyKey);
      setSuccess(copy.transaction.success);
      vibrateScanSuccess();
      setConfirmOpen(false);
      setQuantity("");
      setNotes("");
      onPosted();
    } catch (postError) {
      const message = postError instanceof Error ? postError.message : copy.transaction.failure;
      if (/negative|insufficient|not enough/i.test(message)) {
        setError(copy.transaction.negativeStockBlocked);
      } else if (/permission|not allowed/i.test(message)) {
        setError(copy.transaction.permissionDenied);
      } else {
        setError(message);
      }
      vibrateScanError();
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  const confirmSummary = buildConfirmSummary(copy, action, parsedQuantity, context.unitSymbol);

  return (
    <div className="space-y-4" data-testid="inventory-item-stock-panel">
      <InventoryItemSummary
        barcodeValue={barcodeValue}
        context={context}
        copy={copy}
        locale={locale}
      />

      <div className="grid grid-cols-2 gap-2">
        {(["lookup", "receipt", "issue", "transfer"] as const).map((kind) => (
          <button
            className={`min-h-11 rounded-lg px-3 py-2 text-sm font-semibold ${
              action === kind
                ? "bg-[var(--forge-accent-orange)] text-white"
                : "border border-[var(--forge-border)] bg-[var(--forge-surface)]"
            }`}
            key={kind}
            onClick={() => {
              setAction(kind);
              setError(null);
              setSuccess(null);
            }}
            type="button"
          >
            {actionLabel(copy, kind)}
          </button>
        ))}
      </div>

      {action === "lookup" ? (
        <p className="rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface-muted)] px-3 py-2 text-sm">
          {copy.transaction.lookupHint}
        </p>
      ) : (
        <form
          className="space-y-3 rounded-xl border border-[var(--forge-border)] bg-[var(--forge-surface)] p-4"
          onSubmit={handlePrepareSubmit}
        >
          <label className="block text-sm font-semibold">
            {copy.transaction.quantity}
            <input
              className={`${inputClassName} mt-1 min-h-12 text-base`}
              data-testid="stock-quantity-input"
              inputMode="decimal"
              min={0.0001}
              onChange={(event) => setQuantity(event.target.value)}
              required
              step="any"
              type="number"
              value={quantity}
            />
          </label>

          <label className="block text-sm font-semibold">
            {action === "transfer" ? copy.transaction.sourceLocation : copy.item.location}
            <select
              className={`${inputClassName} mt-1 min-h-12`}
              data-testid="stock-location-select"
              onChange={(event) => setLocationId(event.target.value)}
              required
              value={locationId}
            >
              {locationOptions.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.code} · {location.name}
                </option>
              ))}
            </select>
          </label>

          {action === "transfer" ? (
            <label className="block text-sm font-semibold">
              {copy.transaction.destinationLocation}
              <select
                className={`${inputClassName} mt-1 min-h-12`}
                data-testid="stock-destination-select"
                onChange={(event) => setDestinationLocationId(event.target.value)}
                required
                value={destinationLocationId}
              >
                <option value="">—</option>
                {locationOptions.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.code} · {location.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="block text-sm font-semibold">
            {copy.transaction.reason}
            <input
              className={`${inputClassName} mt-1 min-h-12 text-base`}
              data-testid="stock-reason-input"
              onChange={(event) => setReasonCode(event.target.value)}
              required
              value={reasonCode}
            />
          </label>

          <label className="block text-sm font-semibold">
            {copy.transaction.notes}
            <input
              className={`${inputClassName} mt-1`}
              onChange={(event) => setNotes(event.target.value)}
              value={notes}
            />
          </label>

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
      )}

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
        <InventoryMovementHistory copy={copy} locale={locale} transactions={transactions} />
      </section>
    </div>
  );
}

function actionLabel(copy: InventoryMobileCopy, kind: ActionKind): string {
  switch (kind) {
    case "receipt":
      return copy.transaction.typeReceipt;
    case "issue":
      return copy.transaction.typeIssue;
    case "transfer":
      return copy.transaction.typeTransfer;
    case "lookup":
      return copy.transaction.typeLookup;
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

function buildConfirmSummary(
  copy: InventoryMobileCopy,
  kind: ActionKind,
  quantity: number,
  unit: string
): string {
  const qtyLabel = `${quantity} ${unit}`;
  switch (kind) {
    case "receipt":
      return `${copy.transaction.confirmReceipt} ${qtyLabel}`;
    case "issue":
      return `${copy.transaction.confirmIssue} ${qtyLabel}`;
    case "transfer":
      return `${copy.transaction.confirmTransfer} ${qtyLabel}`;
    case "lookup":
      return copy.transaction.lookupHint;
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}
