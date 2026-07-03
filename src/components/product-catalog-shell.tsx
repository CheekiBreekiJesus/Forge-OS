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
  inputClassName
} from "@/components/crud";
import type { Product } from "@/domain/product-types";
import { filterBySearch, isArchivedRecord, useHashAction } from "@/features/crud/ui-utils";
import { useProducts } from "@/persistence/hooks";
import { usePersistence, usePersistenceLoading } from "@/persistence/provider";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getInventoryProductCopy } from "@/features/inventory-product/copy";

type ProductCatalogShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

type ProductForm = {
  name: string;
  sku: string;
  category: string;
  basePrice: number;
  productPageUrl: string;
  emailTitle: string;
  isEmailPromotable: boolean;
};

const emptyForm: ProductForm = {
  name: "",
  sku: "",
  category: "personalized-cups",
  basePrice: 0,
  productPageUrl: "",
  emailTitle: "",
  isEmailPromotable: true
};

function defaultProductInput(form: ProductForm): Omit<Product, "id" | "tenantId" | "createdAt" | "updatedAt"> {
  return {
    active: true,
    archivedAt: null,
    archivedBy: null,
    archiveReason: null,
    name: form.name,
    sku: form.sku,
    category: form.category as Product["category"],
    image: "",
    material: "PP",
    capacity: "330ml",
    color: "white",
    unitsPerBox: 1000,
    stacksPerBox: 10,
    unitsPerStack: 100,
    compatibleLidsAccessories: [],
    basePrice: form.basePrice,
    personalizationAvailable: true,
    printArea: "wrap",
    setupCost: 0,
    screenCost: 0,
    leadTimeDays: 14,
    sourceUrl: null,
    productPageUrl: form.productPageUrl,
    imageUrl: "",
    thumbnailUrl: "",
    customizerUrl: "",
    defaultCtaLabel: "Ver produto",
    emailTitle: form.emailTitle || form.name,
    emailDescription: "",
    isEmailPromotable: form.isEmailPromotable
  };
}

export function ProductCatalogShell({ dictionary, locale }: ProductCatalogShellProps) {
  const copy = dictionary.productCatalog;
  const workspaceCopy = getInventoryProductCopy(locale);
  const shared = dictionary.crudModule;
  const loading = usePersistenceLoading();
  const { state, tenantId, notifyDataChanged } = usePersistence();
  const [showArchived, setShowArchived] = useState(false);
  const { products, loading: dataLoading, reload } = useProducts(showArchived);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Product | null>(null);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setDrawerOpen(true);
  }, []);

  useHashAction("create", openCreate);

  const filtered = useMemo(
    () => filterBySearch(products, search, (p) => `${p.name} ${p.sku} ${p.category}`),
    [products, search]
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (state.status !== "ready") return;
    if (!form.name.trim() || !form.sku.trim()) {
      setFormError(copy.form.required);
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await state.repos.products.update(tenantId, editing.id, {
          name: form.name,
          sku: form.sku,
          category: form.category as Product["category"],
          basePrice: form.basePrice,
          productPageUrl: form.productPageUrl,
          emailTitle: form.emailTitle,
          isEmailPromotable: form.isEmailPromotable
        });
      } else {
        await state.repos.products.create(tenantId, defaultProductInput(form));
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

  async function confirmArchive() {
    if (!archiveTarget || state.status !== "ready") return;
    setSubmitting(true);
    try {
      if (isArchivedRecord(archiveTarget)) {
        await state.repos.products.restore(tenantId, archiveTarget.id);
      } else {
        await state.repos.products.archive(tenantId, archiveTarget.id);
      }
      notifyDataChanged();
      await reload();
      setArchiveTarget(null);
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      basePrice: product.basePrice,
      productPageUrl: product.productPageUrl,
      emailTitle: product.emailTitle,
      isEmailPromotable: product.isEmailPromotable
    });
    setDrawerOpen(true);
  }

  const columns = [
    { key: "sku", header: copy.table.sku, render: (p: Product) => p.sku },
    { key: "name", header: copy.table.name, render: (p: Product) => p.name },
    { key: "category", header: copy.table.category, render: (p: Product) => p.category },
    {
      key: "price",
      header: copy.table.price,
      render: (p: Product) =>
        new Intl.NumberFormat(locale, { currency: "EUR", style: "currency" }).format(p.basePrice)
    }
  ];

  return (
    <AppFrame activeModule="products" dictionary={dictionary} locale={locale}>
      <PageHeader
        actions={<PrimaryActionButton onClick={openCreate}>{copy.actions.create}</PrimaryActionButton>}
        description={copy.description}
        eyebrow={copy.eyebrow}
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
        {(["products", "items", "variants", "packaging", "barcodes", "labels", "imports"] as const).map(
          (section) => (
            <Link
              className="shrink-0 rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-3 py-2 text-sm font-semibold text-[var(--forge-text-secondary)] hover:bg-[var(--forge-hover-bg)]"
              href={`/${locale}/products/${section}`}
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
            actionsColumn={(p) => (
              <RowActionMenu
                actions={[
                  { key: "edit", label: shared.actions.edit, onClick: () => openEdit(p) },
                  ...(p.personalizationAvailable || p.category.includes("cup")
                    ? [
                        {
                          key: "customize",
                          label: dictionary.customizerModule.actions.customize,
                          onClick: () => {
                            window.location.href = `/${locale}/quotations/customizer?productId=${p.id}`;
                          }
                        }
                      ]
                    : []),
                  {
                    key: "dup",
                    label: shared.actions.duplicate,
                    onClick: async () => {
                      if (state.status !== "ready") return;
                      await state.repos.products.duplicate(tenantId, p.id);
                      notifyDataChanged();
                      await reload();
                    }
                  },
                  {
                    key: "archive",
                    label: isArchivedRecord(p) ? shared.actions.restore : shared.actions.archive,
                    destructive: !isArchivedRecord(p),
                    onClick: () => setArchiveTarget(p)
                  }
                ]}
                triggerLabel={shared.actions.menu}
              />
            )}
            actionsHeader={shared.actions.menu}
            archivedRowClass={isArchivedRecord}
            columns={columns}
            rowKey={(p) => p.id}
            locale={locale}
            rows={filtered}
          />
          <EntityCardList
            actions={(p) => (
              <RowActionMenu
                actions={[
                  { key: "edit", label: shared.actions.edit, onClick: () => openEdit(p) },
                  {
                    key: "archive",
                    label: isArchivedRecord(p) ? shared.actions.restore : shared.actions.archive,
                    onClick: () => setArchiveTarget(p)
                  }
                ]}
                triggerLabel={shared.actions.menu}
              />
            )}
            archivedRowClass={isArchivedRecord}
            meta={(p) => p.sku}
            rowKey={(p) => p.id}
            locale={locale}
            rows={filtered}
            title={(p) => p.name}
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
        wide
      >
        <FormField label={copy.form.name} required>
          <input className={inputClassName} onChange={(e) => setForm({ ...form, name: e.target.value })} value={form.name} />
        </FormField>
        <FormField label={copy.form.sku} required>
          <input className={inputClassName} disabled={Boolean(editing)} onChange={(e) => setForm({ ...form, sku: e.target.value })} value={form.sku} />
        </FormField>
        <FormField label={copy.form.category}>
          <input className={inputClassName} onChange={(e) => setForm({ ...form, category: e.target.value })} value={form.category} />
        </FormField>
        <FormField label={copy.form.basePrice}>
          <input className={inputClassName} min={0} onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })} step="0.01" type="number" value={form.basePrice} />
        </FormField>
        <FormField label={copy.form.productPageUrl}>
          <input className={inputClassName} onChange={(e) => setForm({ ...form, productPageUrl: e.target.value })} value={form.productPageUrl} />
        </FormField>
        <FormField label={copy.form.emailTitle}>
          <input className={inputClassName} onChange={(e) => setForm({ ...form, emailTitle: e.target.value })} value={form.emailTitle} />
        </FormField>
        <label className="flex items-center gap-2 text-sm">
          <input checked={form.isEmailPromotable} onChange={(e) => setForm({ ...form, isEmailPromotable: e.target.checked })} type="checkbox" />
          {copy.form.emailPromotable}
        </label>
        <FormFieldError message={formError} />
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
