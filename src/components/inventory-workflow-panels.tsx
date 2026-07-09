"use client";

import { FormEvent, useMemo, useState } from "react";
import { inputClassName } from "@/components/crud";
import type { Locale } from "@/i18n/config";
import { getInventoryProductCopy } from "@/features/inventory-product/copy";
import {
  assertInventoryPermission,
  getLowStockItems,
  getStockBalances,
  listMovementHistory,
  mapPreviewRoleToInventoryRole
} from "@/features/inventory-product/operations";
import {
  readPreviewRole,
  type PreviewRole
} from "@/features/crud/role-preview";
import type { InventoryProductSnapshot } from "@/persistence/interfaces";
import type { DesktopWorkflowHandlers } from "@/lib/inventory/desktop-workflows";

type WorkflowKind = "receipt" | "issue" | "transfer" | "adjustment";

type Props = {
  locale: Locale;
  section: "stock" | "receipts" | "transfers" | "adjustments" | "reservations";
  snapshot: InventoryProductSnapshot;
  onSnapshotChange: () => Promise<unknown>;
  workflows: DesktopWorkflowHandlers;
};

export function InventoryWorkflowPanels({ locale, onSnapshotChange, section, snapshot, workflows }: Props) {
  const copy = getInventoryProductCopy(locale);
  const [previewRole, setPreviewRole] = useState<PreviewRole>(() => readPreviewRole());
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const defaultItem = snapshot.items[0];
  const defaultLocation = snapshot.locations.find((row) => row.locationType === "shelf") ?? snapshot.locations[0];
  const defaultLot = snapshot.lots[0];
  const defaultUnit = snapshot.unitOfMeasures.find((row) => row.code === "unit") ?? snapshot.unitOfMeasures[0];

  const [itemId, setItemId] = useState(defaultItem?.id ?? "");
  const [locationId, setLocationId] = useState(defaultLocation?.id ?? "");
  const [destinationLocationId, setDestinationLocationId] = useState(
    snapshot.locations.find((row) => row.locationType === "quarantine")?.id ?? ""
  );
  const [lotId, setLotId] = useState(defaultLot?.id ?? "");
  const [quantity, setQuantity] = useState(100);
  const [reasonCode, setReasonCode] = useState("operator_entry");
  const [notes, setNotes] = useState("");
  const [reservationQty, setReservationQty] = useState(50);
  const [reservationDoc, setReservationDoc] = useState("SO-DEMO-001");

  const inventoryRole = mapPreviewRoleToInventoryRole(previewRole);
  const balances = useMemo(() => getStockBalances(snapshot), [snapshot]);
  const lowStock = useMemo(() => getLowStockItems(snapshot), [snapshot]);
  const history = useMemo(() => listMovementHistory(snapshot), [snapshot]);

  async function runWorkflow(kind: WorkflowKind, direction?: "increase" | "decrease") {
    setSubmitting(true);
    setError(null);
    try {
      const action =
        kind === "receipt"
          ? "receive"
          : kind === "transfer"
            ? "transfer"
            : kind === "adjustment"
              ? "adjust"
              : "adjust";
      assertInventoryPermission(inventoryRole, action);
      const request = {
        destinationLocationId: kind === "transfer" ? destinationLocationId : undefined,
        idempotencyKey: `ui:${kind}:${Date.now()}`,
        itemId,
        locationId,
        lotId: lotId || null,
        notes,
        operatorId: `preview:${previewRole}`,
        quantity,
        reasonCode,
        unitOfMeasureId: defaultUnit?.id ?? "uom_unit",
        warehouseId: defaultLocation?.warehouseId ?? snapshot.warehouses[0]?.id ?? "wh_main"
      };
      if (kind === "issue") {
        await workflows.runWorkflow("issue", request);
      } else {
        await workflows.runWorkflow(kind, request, direction);
      }
      await onSnapshotChange();
      setMessage(
        kind === "receipt"
          ? copy.messages.receiptPosted
          : kind === "transfer"
            ? copy.messages.transferPosted
            : copy.messages.receiptPosted
      );
    } catch (workflowError) {
      setError(workflowError instanceof Error ? workflowError.message : "Workflow failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReservation(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      assertInventoryPermission(inventoryRole, "receive");
      await workflows.createReservation({
        itemId,
        locationId,
        lotId: lotId || null,
        quantity: reservationQty,
        sourceDocumentId: reservationDoc,
        sourceDocumentType: "sales_order",
        unitOfMeasureId: defaultUnit?.id ?? "uom_unit",
        warehouseId: defaultLocation?.warehouseId ?? snapshot.warehouses[0]?.id ?? "wh_main"
      });
      await onSnapshotChange();
      setMessage("Reservation created.");
    } catch (reservationError) {
      setError(reservationError instanceof Error ? reservationError.message : "Reservation failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] p-3 text-sm">
        <label className="font-semibold" htmlFor="preview-role">
          Preview role
        </label>
        <select
          className={inputClassName}
          id="preview-role"
          onChange={(event) => setPreviewRole(event.target.value as PreviewRole)}
          value={previewRole}
        >
          <option value="owner">Owner</option>
          <option value="warehouse_manager">Warehouse manager</option>
          <option value="production_manager">Production manager</option>
          <option value="sales">Sales (read-only)</option>
        </select>
        <span className="text-xs text-[var(--forge-text-muted)]">{copy.messages.previewAuthorization}</span>
      </div>

      {message ? (
        <p className="rounded-lg bg-[var(--forge-success-soft)] px-3 py-2 text-sm text-[var(--forge-success)]">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-[var(--forge-danger-soft)] px-3 py-2 text-sm text-[var(--forge-danger)]">
          {error}
        </p>
      ) : null}

      {section === "stock" ? (
        <>
          {lowStock.length > 0 ? (
            <div className="rounded-lg border border-[var(--forge-warning)]/40 bg-[var(--forge-warning-soft)] p-3 text-sm">
              <p className="font-semibold text-[var(--forge-warning)]">Low stock</p>
              <ul className="mt-2 space-y-1">
                {lowStock.map((row) => (
                  <li key={row.item.id}>
                    {row.item.internalReference}: {row.available.toLocaleString(locale)} / min{" "}
                    {row.item.minimumStock.toLocaleString(locale)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="overflow-x-auto rounded-lg border border-[var(--forge-border)]">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-[var(--forge-surface-muted)] text-xs uppercase text-[var(--forge-text-muted)]">
                <tr>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Location</th>
                  <th className="px-3 py-2">Condition</th>
                  <th className="px-3 py-2">Physical</th>
                  <th className="px-3 py-2">Available</th>
                  <th className="px-3 py-2">Reserved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--forge-border)]">
                {balances.map((balance) => (
                  <tr key={`${balance.itemId}:${balance.locationId}:${balance.stockCondition}`}>
                    <td className="px-3 py-2 font-mono text-xs">
                      {snapshot.items.find((item) => item.id === balance.itemId)?.internalReference ??
                        balance.itemId}
                    </td>
                    <td className="px-3 py-2">
                      {snapshot.locations.find((location) => location.id === balance.locationId)?.code ??
                        balance.locationId}
                    </td>
                    <td className="px-3 py-2">{balance.stockCondition}</td>
                    <td className="px-3 py-2">{balance.physicalStock.toLocaleString(locale)}</td>
                    <td className="px-3 py-2">{balance.availableStock.toLocaleString(locale)}</td>
                    <td className="px-3 py-2">{balance.reservedStock.toLocaleString(locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="overflow-x-auto rounded-lg border border-[var(--forge-border)]">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-[var(--forge-surface-muted)] text-xs uppercase text-[var(--forge-text-muted)]">
                <tr>
                  <th className="px-3 py-2">{copy.labels.transaction}</th>
                  <th className="px-3 py-2">{copy.labels.status}</th>
                  <th className="px-3 py-2">When</th>
                  <th className="px-3 py-2">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--forge-border)]">
                {history.slice(0, 12).map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-3 py-2">{transaction.transactionType}</td>
                    <td className="px-3 py-2">{transaction.status}</td>
                    <td className="px-3 py-2">{new Date(transaction.occurredAt).toLocaleString(locale)}</td>
                    <td className="px-3 py-2">{transaction.reasonCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {section === "reservations" ? (
        <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => void handleReservation(event)}>
          <Field label={copy.labels.item}>
            <select className={inputClassName} onChange={(e) => setItemId(e.target.value)} value={itemId}>
              {snapshot.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.internalReference} — {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={copy.labels.quantity}>
            <input
              className={inputClassName}
              min={1}
              onChange={(e) => setReservationQty(Number(e.target.value))}
              type="number"
              value={reservationQty}
            />
          </Field>
          <Field label="Source document">
            <input
              className={inputClassName}
              onChange={(e) => setReservationDoc(e.target.value)}
              value={reservationDoc}
            />
          </Field>
          <div className="md:col-span-2">
            <button
              className="rounded-lg bg-[var(--forge-accent-orange)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={submitting}
              type="submit"
            >
              Create reservation
            </button>
          </div>
          <div className="md:col-span-2 space-y-2">
            {snapshot.reservations
              .filter((row) => row.status === "active")
              .map((reservation) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--forge-border)] px-3 py-2 text-sm"
                  key={reservation.id}
                >
                  <span>
                    {reservation.itemId} — {reservation.quantity.toLocaleString(locale)}
                  </span>
                  <button
                    className="text-xs font-semibold text-[var(--forge-accent-orange)]"
                    disabled={submitting}
                    onClick={() =>
                      void (async () => {
                        await workflows.releaseReservation(reservation.id);
                        await onSnapshotChange();
                      })()
                    }
                    type="button"
                  >
                    Release
                  </button>
                </div>
              ))}
          </div>
        </form>
      ) : null}

      {section === "receipts" || section === "transfers" || section === "adjustments" ? (
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const kind =
              section === "receipts" ? "receipt" : section === "transfers" ? "transfer" : "adjustment";
            void runWorkflow(kind, "increase");
          }}
        >
          <Field label={copy.labels.item}>
            <select className={inputClassName} onChange={(e) => setItemId(e.target.value)} value={itemId}>
              {snapshot.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.internalReference} — {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={copy.labels.location}>
            <select
              className={inputClassName}
              onChange={(e) => setLocationId(e.target.value)}
              value={locationId}
            >
              {snapshot.locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.code} — {location.name}
                </option>
              ))}
            </select>
          </Field>
          {section === "transfers" ? (
            <Field label="Destination">
              <select
                className={inputClassName}
                onChange={(e) => setDestinationLocationId(e.target.value)}
                value={destinationLocationId}
              >
                {snapshot.locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.code} — {location.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          <Field label={copy.labels.lot}>
            <select className={inputClassName} onChange={(e) => setLotId(e.target.value)} value={lotId}>
              {snapshot.lots.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.internalLotNumber}
                </option>
              ))}
            </select>
          </Field>
          <Field label={copy.labels.quantity}>
            <input
              className={inputClassName}
              min={1}
              onChange={(e) => setQuantity(Number(e.target.value))}
              type="number"
              value={quantity}
            />
          </Field>
          <Field label="Reason">
            <input
              className={inputClassName}
              onChange={(e) => setReasonCode(e.target.value)}
              value={reasonCode}
            />
          </Field>
          <Field label="Notes">
            <input className={inputClassName} onChange={(e) => setNotes(e.target.value)} value={notes} />
          </Field>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            {section === "receipts" ? (
              <ActionButton disabled={submitting} label={copy.actions.postReceipt} type="submit" />
            ) : null}
            {section === "transfers" ? (
              <ActionButton disabled={submitting} label={copy.actions.postTransfer} type="submit" />
            ) : null}
            {section === "adjustments" ? (
              <>
                <ActionButton disabled={submitting} label="Increase stock" type="submit" />
                <button
                  className="rounded-lg border border-[var(--forge-border)] px-4 py-2 text-sm font-semibold"
                  disabled={submitting}
                  onClick={() => void runWorkflow("adjustment", "decrease")}
                  type="button"
                >
                  Decrease stock
                </button>
                <button
                  className="rounded-lg border border-[var(--forge-border)] px-4 py-2 text-sm font-semibold"
                  disabled={submitting}
                  onClick={() => void runWorkflow("issue")}
                  type="button"
                >
                  Issue stock
                </button>
              </>
            ) : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}

function Field({ children, label }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-semibold text-[var(--forge-text-secondary)]">{label}</span>
      {children}
    </label>
  );
}

function ActionButton({
  disabled,
  label,
  type
}: {
  label: string;
  disabled: boolean;
  type: "submit" | "button";
}) {
  return (
    <button
      className="rounded-lg bg-[var(--forge-accent-orange)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      disabled={disabled}
      type={type}
    >
      {label}
    </button>
  );
}
