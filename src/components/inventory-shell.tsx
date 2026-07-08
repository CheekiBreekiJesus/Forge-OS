"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
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
import type { InventoryItem } from "@/domain/operations-types";
import { filterBySearch, isArchivedRecord, useHashAction } from "@/features/crud/ui-utils";
import { useInventory } from "@/persistence/hooks";
import { usePersistence, usePersistenceLoading } from "@/persistence/provider";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getLocalizedModuleHref } from "@/modules/config";
import { getInventoryProductCopy } from "@/features/inventory-product/copy";

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
  const workspaceCopy = getInventoryProductCopy(locale);
  const shared = dictionary.crudModule;
  const loading = usePersistenceLoading();
  const { state, tenantId, notifyDataChanged } = usePersistence();
  const [showArchived, setShowArchived] = useState(false);
  const { items, loading: dataLoading, reload } = useInventory(showArchived);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stockDrawer, setStockDrawer] = useState<InventoryItem | null>(null);
  const [stockQty, setStockQty] = useState(0);
  const [stockReason, setStockReason] = useState("");
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<InventoryForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<InventoryItem | null>(null);

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
    if (!stockDrawer || state.status !== "ready" || stockQty <= 0) return;
    setSubmitting(true);
    try {
      await state.repos.inventory.recordReceipt(tenantId, stockDrawer.id, {
        quantity: stockQty,
        reason: stockReason || copy.stock.defaultReason
      });
      notifyDataChanged();
      await reload();
      setStockDrawer(null);
      setStockQty(0);
      setStockReason("");
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

  const columns = [
    { key: "sku", header: copy.table.sku, render: (i: InventoryItem) => i.sku },
    { key: "name", header: copy.table.name, render: (i: InventoryItem) => i.name },
    { key: "qty", header: copy.table.quantity, render: (i: InventoryItem) => i.currentQuantity.toLocaleString(locale) },
    { key: "unit", header: copy.table.unit, render: (i: InventoryItem) => i.unit },
    { key: "location", header: copy.table.location, render: (i: InventoryItem) => i.warehouseLocation }
  ];

  return (
    <AppFrame activeModule="inventory" dictionary={dictionary} locale={locale}>
      <PageHeader
        actions={<PrimaryActionButton onClick={openCreate}>{copy.actions.create}</PrimaryActionButton>}
        backHref={getLocalizedModuleHref(locale, "dashboard")}
        backLabel={dictionary.modulePage.backToDashboard}
        description={copy.description}
        title={copy.title}
      />

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
              <RowActionMenu
                actions={[
                  {
                    key: "stock",
                    label: copy.actions.receiveStock,
                    onClick: () => {
                      setStockDrawer(i);
                      setStockQty(0);
                      setStockReason("");
                    }
                  },
                  {
                    key: "archive",
                    label: isArchivedRecord(i) ? shared.actions.restore : shared.actions.archive,
                    destructive: !isArchivedRecord(i),
                    onClick: () => setArchiveTarget(i)
                  }
                ]}
                triggerLabel={shared.actions.menu}
              />
            )}
            actionsHeader={shared.actions.menu}
            archivedRowClass={isArchivedRecord}
            columns={columns}
            rowKey={(i) => i.id}
            rows={filtered}
          />
          <EntityCardList
            actions={(i) => (
              <RowActionMenu
                actions={[
                  { key: "stock", label: copy.actions.receiveStock, onClick: () => setStockDrawer(i) },
                  {
                    key: "archive",
                    label: isArchivedRecord(i) ? shared.actions.restore : shared.actions.archive,
                    onClick: () => setArchiveTarget(i)
                  }
                ]}
                triggerLabel={shared.actions.menu}
              />
            )}
            archivedRowClass={isArchivedRecord}
            meta={(i) => `${i.currentQuantity} ${i.unit}`}
            rowKey={(i) => i.id}
            rows={filtered}
            subtitle={(i) => i.sku}
            title={(i) => i.name}
          />
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
        onClose={() => setStockDrawer(null)}
        onSubmit={handleStockSubmit}
        open={Boolean(stockDrawer)}
        submitLabel={copy.stock.submit}
        submitting={submitting}
        title={copy.stock.title}
      >
        <FormField label={copy.stock.quantity} required>
          <input className={inputClassName} min={1} onChange={(e) => setStockQty(Number(e.target.value))} type="number" value={stockQty || ""} />
        </FormField>
        <FormField label={copy.stock.reason}>
          <input className={inputClassName} onChange={(e) => setStockReason(e.target.value)} value={stockReason} />
        </FormField>
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
