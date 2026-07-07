"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppFrame } from "@/components/app-frame";
import {
  ArchiveConfirmationDialog,
  EmptyState,
  EntityCardList,
  EntityFormDrawer,
  EntityTable,
  FormField,
  FormFieldError,
  LoadingState,
  PageHeader,
  PrimaryActionButton,
  RowActionMenu,
  SearchAndFilterBar,
  inputClassName,
  textareaClassName
} from "@/components/crud";
import { InventoryMovementHistory } from "@/components/inventory-mobile/inventory-movement-history";
import type { InventoryItem, StockMovement } from "@/domain/operations-types";
import { filterBySearch, isArchivedRecord, useHashAction } from "@/features/crud/ui-utils";
import { isLowStock } from "@/features/inventory-mobile/barcode-resolver";
import { getInventoryMobileCopy } from "@/features/inventory-mobile/copy";
import { computeInventorySummary, mergeRecentMovements } from "@/features/inventory-mobile/inventory-stats";
import {
  computeAdjustmentDelta,
  postStockTransaction,
  validateStockTransaction,
  type AdjustmentMode,
  type StockTransactionType
} from "@/features/inventory-mobile/stock-transaction";
import { getInventoryProductCopy } from "@/features/inventory-product/copy";
import { useInventory } from "@/persistence/hooks";
import { usePersistence, usePersistenceLoading } from "@/persistence/provider";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getLocalizedModuleHref } from "@/modules/config";

type InventoryShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

type InventoryForm = {
  sku: string;
  name: string;
  category: string;
  unit: string;
  reorderLevel: number;
  warehouseLocation: string;
  notes: string;
};

type StockDrawerMode = StockTransactionType | null;

const emptyForm: InventoryForm = {
  sku: "",
  name: "",
  category: "materials",
  unit: "units",
  reorderLevel: 0,
  warehouseLocation: "",
  notes: ""
};

export function InventoryShell({ dictionary, locale }: InventoryShellProps) {
  const copy = dictionary.inventoryModule;
  const mobileCopy = getInventoryMobileCopy(locale);
  const workspaceCopy = getInventoryProductCopy(locale);
  const shared = dictionary.crudModule;
  const loading = usePersistenceLoading();
  const { state, tenantId, notifyDataChanged } = usePersistence();
  const [showArchived, setShowArchived] = useState(false);
  const { items, loading: dataLoading, reload } = useInventory(showArchived);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stockDrawer, setStockDrawer] = useState<InventoryItem | null>(null);
  const [stockMode, setStockMode] = useState<StockDrawerMode>(null);
  const [stockQty, setStockQty] = useState(0);
  const [stockReason, setStockReason] = useState("");
  const [adjustmentMode, setAdjustmentMode] = useState<AdjustmentMode>("delta");
  const [stockError, setStockError] = useState<string | null>(null);
  const [movementsDrawer, setMovementsDrawer] = useState<InventoryItem | null>(null);
  const [itemMovements, setItemMovements] = useState<StockMovement[]>([]);
  const [recentMovements, setRecentMovements] = useState<
    Array<{ movement: StockMovement; item: InventoryItem }>
  >([]);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<InventoryForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<InventoryItem | null>(null);

  const summary = useMemo(() => computeInventorySummary(items), [items]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setDrawerOpen(true);
  }, []);

  useHashAction("create", openCreate);

  const filtered = useMemo(
    () => filterBySearch(items, search, (i) => `${i.name} ${i.sku} ${i.category}`),
    [items, search]
  );

  useEffect(() => {
    if (state.status !== "ready") return;
    const activeItems = items.filter((item) => item.active).slice(0, 12);
    void (async () => {
      const bundles = await Promise.all(
        activeItems.map(async (item) => ({
          item,
          movements: await state.repos.inventory.listMovements(tenantId, item.id)
        }))
      );
      setRecentMovements(mergeRecentMovements(bundles, 10));
    })();
  }, [items, state, tenantId]);

  function openStockDrawer(item: InventoryItem, mode: StockTransactionType) {
    setStockDrawer(item);
    setStockMode(mode);
    setStockQty(0);
    setStockReason("");
    setStockError(null);
    setAdjustmentMode("delta");
  }

  async function openMovementsDrawer(item: InventoryItem) {
    if (state.status !== "ready") return;
    setMovementsDrawer(item);
    const rows = await state.repos.inventory.listMovements(tenantId, item.id);
    setItemMovements(rows);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (state.status !== "ready") return;
    if (!form.sku.trim() || !form.name.trim()) {
      setFormError(copy.form.required);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        active: true,
        archivedAt: null,
        archivedBy: null,
        archiveReason: null,
        sku: form.sku.trim().toUpperCase(),
        name: form.name.trim(),
        category: form.category,
        unit: form.unit,
        productId: editing?.productId ?? null,
        reorderLevel: form.reorderLevel,
        warehouseLocation: form.warehouseLocation,
        batch: editing?.batch ?? null,
        notes: form.notes
      };
      if (editing) {
        await state.repos.inventory.update(tenantId, editing.id, payload);
      } else {
        await state.repos.inventory.create(tenantId, payload);
      }
      notifyDataChanged();
      await reload();
      setDrawerOpen(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : shared.error.generic);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStockSubmit(event: FormEvent) {
    event.preventDefault();
    if (!stockDrawer || !stockMode || state.status !== "ready") return;

    const validation = validateStockTransaction(
      {
        type: stockMode,
        quantity: stockQty,
        reason: stockReason,
        adjustmentMode
      },
      stockDrawer
    );
    if (validation === "reason_required") {
      setStockError(mobileCopy.transaction.reasonRequired);
      return;
    }
    if (validation === "quantity_required") {
      setStockError(mobileCopy.transaction.quantityRequired);
      return;
    }
    if (validation === "negative_stock") {
      setStockError(mobileCopy.transaction.negativeStockBlocked);
      return;
    }

    setSubmitting(true);
    setStockError(null);
    try {
      await postStockTransaction(
        state.repos.inventory,
        tenantId,
        stockDrawer.id,
        {
          type: stockMode,
          quantity: stockQty,
          reason: stockReason,
          adjustmentMode
        },
        stockDrawer
      );
      notifyDataChanged();
      await reload();
      setStockDrawer(null);
      setStockMode(null);
      setStockQty(0);
      setStockReason("");
    } catch {
      setStockError(mobileCopy.transaction.failure);
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmArchive() {
    if (!archiveTarget || state.status !== "ready") return;
    setSubmitting(true);
    try {
      if (isArchivedRecord(archiveTarget)) {
        await state.repos.inventory.restore(tenantId, archiveTarget.id);
      } else {
        await state.repos.inventory.archive(tenantId, archiveTarget.id);
      }
      notifyDataChanged();
      await reload();
      setArchiveTarget(null);
    } finally {
      setSubmitting(false);
    }
  }

  const rowActions = (item: InventoryItem) => [
    {
      key: "receipt",
      label: copy.actions.receiveStock,
      onClick: () => openStockDrawer(item, "receipt")
    },
    {
      key: "consumption",
      label: mobileCopy.desktop.consumeStock,
      onClick: () => openStockDrawer(item, "consumption")
    },
    {
      key: "adjustment",
      label: mobileCopy.desktop.adjustStock,
      onClick: () => openStockDrawer(item, "adjustment")
    },
    {
      key: "movements",
      label: mobileCopy.desktop.viewMovements,
      onClick: () => void openMovementsDrawer(item)
    },
    {
      key: "archive",
      label: isArchivedRecord(item) ? shared.actions.restore : shared.actions.archive,
      destructive: !isArchivedRecord(item),
      onClick: () => setArchiveTarget(item)
    }
  ];

  const columns = [
    { key: "sku", header: copy.table.sku, render: (i: InventoryItem) => i.sku },
    { key: "name", header: copy.table.name, render: (i: InventoryItem) => i.name },
    {
      key: "qty",
      header: copy.table.quantity,
      render: (i: InventoryItem) => i.currentQuantity.toLocaleString(locale)
    },
    { key: "unit", header: copy.table.unit, render: (i: InventoryItem) => i.unit },
    { key: "location", header: copy.table.location, render: (i: InventoryItem) => i.warehouseLocation },
    {
      key: "reorder",
      header: mobileCopy.desktop.reorderStatus,
      render: (i: InventoryItem) => i.reorderLevel.toLocaleString(locale)
    },
    {
      key: "status",
      header: mobileCopy.desktop.statusColumn,
      render: (i: InventoryItem) =>
        isLowStock(i) ? mobileCopy.desktop.lowStockBadge : mobileCopy.desktop.stockOkBadge
    }
  ];

  const stockDrawerTitle =
    stockMode === "consumption"
      ? mobileCopy.desktop.consumeStock
      : stockMode === "adjustment"
        ? mobileCopy.desktop.adjustStock
        : copy.stock.title;

  const adjustmentPreview =
    stockDrawer && stockMode === "adjustment"
      ? computeAdjustmentDelta(adjustmentMode, stockQty, stockDrawer.currentQuantity)
      : null;

  return (
    <AppFrame activeModule="inventory" dictionary={dictionary} locale={locale}>
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex min-h-10 items-center rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-4 text-sm font-semibold"
              href={`/${locale}/inventory/scan`}
            >
              {mobileCopy.desktop.openScanner}
            </Link>
            <PrimaryActionButton onClick={openCreate}>{copy.actions.create}</PrimaryActionButton>
          </div>
        }
        backHref={getLocalizedModuleHref(locale, "dashboard")}
        backLabel={dictionary.modulePage.backToDashboard}
        description={copy.description}
        title={copy.title}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-[var(--forge-border)] bg-[var(--forge-surface)] p-4">
          <div className="text-sm text-[var(--forge-text-muted)]">{mobileCopy.desktop.totalActive}</div>
          <div className="text-2xl font-bold">{summary.totalActive}</div>
        </div>
        <div className="rounded-xl border border-[var(--forge-border)] bg-[var(--forge-surface)] p-4">
          <div className="text-sm text-[var(--forge-text-muted)]">{mobileCopy.desktop.lowStockCount}</div>
          <div className="text-2xl font-bold">{summary.lowStockCount}</div>
        </div>
        <Link
          className="rounded-xl border border-[var(--forge-accent-orange)] bg-[var(--forge-accent-orange-soft)] p-4 lg:hidden"
          href={`/${locale}/inventory/scan`}
        >
          <div className="text-sm font-semibold text-[var(--forge-accent-orange)]">
            {mobileCopy.desktop.openScanner}
          </div>
          <div className="mt-1 text-xs text-[var(--forge-text-secondary)]">{mobileCopy.scanner.description}</div>
        </Link>
      </div>

      <SearchAndFilterBar
        onSearchChange={setSearch}
        onShowArchivedChange={setShowArchived}
        searchPlaceholder={shared.searchPlaceholder}
        searchValue={search}
        showArchived={showArchived}
        showArchivedLabel={shared.showArchived}
      />

      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {(["stock", "receipts", "transfers", "barcodes", "labels", "imports"] as const).map(
          (section) => (
            <Link
              className="shrink-0 rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-3 py-2 text-sm font-semibold text-[var(--forge-text-secondary)] hover:bg-[var(--forge-hover-bg)]"
              href={`/${locale}/inventory/${section}`}
              key={section}
            >
              {workspaceCopy.tabs[section]}
            </Link>
          )
        )}
      </div>

      {loading || dataLoading ? (
        <LoadingState message={copy.loading} />
      ) : filtered.length === 0 ? (
        <EmptyState actionLabel={copy.actions.create} onAction={openCreate} title={copy.empty} />
      ) : (
        <>
          <EntityTable
            actionsColumn={(i) => (
              <RowActionMenu actions={rowActions(i)} triggerLabel={shared.actions.menu} />
            )}
            actionsHeader={shared.actions.menu}
            archivedRowClass={isArchivedRecord}
            columns={columns}
            rowKey={(i) => i.id}
            locale={locale}
            rows={filtered}
          />
          <EntityCardList
            actions={(i) => <RowActionMenu actions={rowActions(i)} triggerLabel={shared.actions.menu} />}
            archivedRowClass={isArchivedRecord}
            meta={(i) =>
              `${i.currentQuantity} ${i.unit} · ${
                isLowStock(i) ? mobileCopy.desktop.lowStockBadge : mobileCopy.desktop.stockOkBadge
              }`
            }
            rowKey={(i) => i.id}
            locale={locale}
            rows={filtered}
            subtitle={(i) => i.sku}
            title={(i) => i.name}
          />

          {recentMovements.length > 0 ? (
            <section className="mt-8">
              <h2 className="mb-3 text-lg font-semibold">{mobileCopy.desktop.recentMovements}</h2>
              <div className="overflow-x-auto rounded-xl border border-[var(--forge-border)]">
                <table className="min-w-full text-sm">
                  <thead className="bg-[var(--forge-surface-muted)] text-left">
                    <tr>
                      <th className="px-3 py-2">{copy.table.name}</th>
                      <th className="px-3 py-2">{mobileCopy.desktop.movementQuantity}</th>
                      <th className="px-3 py-2">{mobileCopy.desktop.movementBalance}</th>
                      <th className="px-3 py-2">{mobileCopy.desktop.movementReason}</th>
                      <th className="px-3 py-2">{mobileCopy.desktop.movementWhen}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMovements.map(({ movement, item }) => (
                      <tr className="border-t border-[var(--forge-border)]" key={movement.id}>
                        <td className="px-3 py-2">{item.name}</td>
                        <td className="px-3 py-2 font-mono">{movement.quantity}</td>
                        <td className="px-3 py-2">{movement.balanceAfter}</td>
                        <td className="px-3 py-2">{movement.reason}</td>
                        <td className="px-3 py-2">
                          {new Date(movement.createdAt).toLocaleString(locale)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </>
      )}

      <EntityFormDrawer
        cancelLabel={shared.form.cancel}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleSubmit}
        open={drawerOpen}
        submitLabel={editing ? shared.form.save : shared.form.create}
        submitting={submitting}
        title={editing ? copy.form.editTitle : copy.form.createTitle}
      >
        <FormField label={copy.form.sku} required>
          <input className={inputClassName} disabled={Boolean(editing)} onChange={(e) => setForm({ ...form, sku: e.target.value })} value={form.sku} />
        </FormField>
        <FormField label={copy.form.name} required>
          <input className={inputClassName} onChange={(e) => setForm({ ...form, name: e.target.value })} value={form.name} />
        </FormField>
        <FormField label={copy.form.category}>
          <input className={inputClassName} onChange={(e) => setForm({ ...form, category: e.target.value })} value={form.category} />
        </FormField>
        <FormField label={copy.form.unit}>
          <input className={inputClassName} onChange={(e) => setForm({ ...form, unit: e.target.value })} value={form.unit} />
        </FormField>
        <FormField label={copy.form.reorderLevel}>
          <input className={inputClassName} min={0} onChange={(e) => setForm({ ...form, reorderLevel: Number(e.target.value) })} type="number" value={form.reorderLevel} />
        </FormField>
        <FormField label={copy.form.location}>
          <input className={inputClassName} onChange={(e) => setForm({ ...form, warehouseLocation: e.target.value })} value={form.warehouseLocation} />
        </FormField>
        <FormField label={copy.form.notes}>
          <textarea className={textareaClassName} onChange={(e) => setForm({ ...form, notes: e.target.value })} value={form.notes} />
        </FormField>
        <FormFieldError message={formError} />
      </EntityFormDrawer>

      <EntityFormDrawer
        cancelLabel={shared.form.cancel}
        onClose={() => {
          setStockDrawer(null);
          setStockMode(null);
          setStockError(null);
        }}
        onSubmit={handleStockSubmit}
        open={Boolean(stockDrawer && stockMode)}
        submitLabel={copy.stock.submit}
        submitting={submitting}
        title={stockDrawerTitle}
      >
        {stockMode === "adjustment" ? (
          <div className="mb-3 space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                checked={adjustmentMode === "delta"}
                name="desktopAdjustmentMode"
                onChange={() => setAdjustmentMode("delta")}
                type="radio"
              />
              {mobileCopy.transaction.adjustmentModeDelta}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                checked={adjustmentMode === "target"}
                name="desktopAdjustmentMode"
                onChange={() => setAdjustmentMode("target")}
                type="radio"
              />
              {mobileCopy.transaction.adjustmentModeTarget}
            </label>
            <p className="text-xs text-[var(--forge-text-muted)]">
              {adjustmentMode === "delta" ? mobileCopy.transaction.deltaHint : mobileCopy.transaction.targetHint}
            </p>
          </div>
        ) : null}
        <FormField
          label={
            stockMode === "adjustment" && adjustmentMode === "target"
              ? mobileCopy.transaction.targetBalance
              : copy.stock.quantity
          }
          required
        >
          <input
            className={inputClassName}
            min={stockMode === "adjustment" && adjustmentMode === "target" ? 0 : 0.0001}
            onChange={(e) => setStockQty(Number(e.target.value))}
            step="any"
            type="number"
            value={stockQty || ""}
          />
        </FormField>
        {adjustmentPreview !== null ? (
          <p className="mb-3 text-xs text-[var(--forge-text-muted)]">
            Δ {adjustmentPreview}
          </p>
        ) : null}
        <FormField label={copy.stock.reason} required={stockMode === "adjustment"}>
          <input className={inputClassName} onChange={(e) => setStockReason(e.target.value)} value={stockReason} />
        </FormField>
        <FormFieldError message={stockError} />
      </EntityFormDrawer>

      <EntityFormDrawer
        cancelLabel={shared.form.cancel}
        onClose={() => setMovementsDrawer(null)}
        onSubmit={(event) => event.preventDefault()}
        open={Boolean(movementsDrawer)}
        submitLabel={shared.form.save}
        submitting={false}
        title={`${mobileCopy.desktop.viewMovements}${movementsDrawer ? `: ${movementsDrawer.name}` : ""}`}
      >
        <InventoryMovementHistory copy={mobileCopy} locale={locale} movements={itemMovements} />
      </EntityFormDrawer>

      <ArchiveConfirmationDialog
        cancelLabel={shared.archive.cancel}
        confirmLabel={shared.archive.confirm}
        confirming={submitting}
        message={shared.archive.message}
        onCancel={() => setArchiveTarget(null)}
        onConfirm={() => void confirmArchive()}
        open={Boolean(archiveTarget)}
        title={shared.archive.title}
      />
    </AppFrame>
  );
}
