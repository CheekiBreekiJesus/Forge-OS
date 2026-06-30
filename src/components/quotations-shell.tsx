"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useMemo, useState } from "react";
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
  selectClassName,
  textareaClassName
} from "@/components/crud";
import { QuotationsSubnav } from "@/components/quotations-subnav";
import { toQuoteSummary } from "@/domain/mappers";
import type { Quote } from "@/domain/types";
import { filterBySearch, isArchivedRecord, useHashAction } from "@/features/crud/ui-utils";
import { useCustomers, useProducts, useQuotes } from "@/persistence/hooks";
import { usePersistence, usePersistenceLoading } from "@/persistence/provider";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getLocalizedModuleHref } from "@/modules/config";

type QuotationsShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

type QuoteForm = {
  customerId: string;
  productId: string;
  quantity: number;
  printColorCount: number;
  notes: string;
};

const emptyForm: QuoteForm = {
  customerId: "",
  productId: "",
  quantity: 1000,
  printColorCount: 1,
  notes: ""
};

export function QuotationsShell({ dictionary, locale }: QuotationsShellProps) {
  const copy = dictionary.quotationsModule;
  const customizerCopy = dictionary.customizerModule;
  const shared = dictionary.crudModule;
  const router = useRouter();
  const loading = usePersistenceLoading();
  const { state, tenantId, notifyDataChanged } = usePersistence();
  const [showArchived, setShowArchived] = useState(false);
  const { quotes, loading: quotesLoading, reload } = useQuotes(showArchived);
  const { customers } = useCustomers();
  const { products } = useProducts();
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<QuoteForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Quote | null>(null);

  const openCreate = useCallback(() => {
    setForm(emptyForm);
    setFormError(null);
    setDrawerOpen(true);
  }, []);

  useHashAction("create", openCreate);

  const summaries = useMemo(
    () => quotes.map((q) => toQuoteSummary(q, customers)),
    [quotes, customers]
  );

  const filtered = useMemo(
    () =>
      filterBySearch(
        summaries,
        search,
        (q) => `${q.quoteNumber} ${q.customerName} ${q.productName}`
      ),
    [summaries, search]
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (state.status !== "ready") return;
    const product = products.find((p) => p.id === form.productId);
    const customer = customers.find((c) => c.id === form.customerId);
    if (!product || !customer) {
      setFormError(copy.form.required);
      return;
    }
    setSubmitting(true);
    try {
      const unitPrice = product.basePrice;
      const setupCost = product.setupCost + product.screenCost * form.printColorCount;
      const subtotal = unitPrice * form.quantity + setupCost;
      const vat = subtotal * 0.23;
      await state.repos.quotes.create(tenantId, {
        customerId: customer.id,
        productId: product.id,
        productName: product.name,
        quantity: form.quantity,
        printColorCount: form.printColorCount,
        unitPrice,
        setupCost,
        subtotal,
        vat,
        total: subtotal + vat,
        notes: form.notes
      });
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
        await state.repos.quotes.restore(tenantId, archiveTarget.id);
      } else {
        await state.repos.quotes.archive(tenantId, archiveTarget.id);
      }
      notifyDataChanged();
      await reload();
      setArchiveTarget(null);
    } finally {
      setSubmitting(false);
    }
  }

  const quoteById = (id: string) => quotes.find((q) => q.id === id);

  const columns = [
    { key: "number", header: copy.table.number, render: (q: (typeof filtered)[0]) => q.quoteNumber },
    { key: "customer", header: copy.table.customer, render: (q: (typeof filtered)[0]) => q.customerName },
    { key: "product", header: copy.table.product, render: (q: (typeof filtered)[0]) => q.productName },
    { key: "quantity", header: copy.table.quantity, render: (q: (typeof filtered)[0]) => q.quantity.toLocaleString(locale) },
    { key: "status", header: copy.table.status, render: (q: (typeof filtered)[0]) => copy.statuses[q.status] },
    {
      key: "source",
      header: copy.table.source,
      render: (q: (typeof filtered)[0]) => {
        const quote = quoteById(q.id);
        if (!quote) return "—";
        if (quote.simulationId) {
          return quote.isEstimate ? copy.table.fromCustomizerEstimate : copy.table.fromCustomizer;
        }
        return copy.table.manual;
      }
    },
    {
      key: "total",
      header: copy.table.total,
      render: (q: (typeof filtered)[0]) =>
        new Intl.NumberFormat(locale, { currency: "EUR", style: "currency" }).format(q.total)
    }
  ];

  return (
    <AppFrame activeModule="orders" dictionary={dictionary} locale={locale}>
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
              href={`/${locale}/quotations/customizer`}
            >
              {customizerCopy.actions.openCustomizer}
            </Link>
            <PrimaryActionButton onClick={openCreate}>{copy.actions.create}</PrimaryActionButton>
          </div>
        }
        backHref={getLocalizedModuleHref(locale, "dashboard")}
        backLabel={dictionary.modulePage.backToDashboard}
        description={copy.description}
        title={copy.title}
      />

      <QuotationsSubnav dictionary={dictionary} locale={locale} />

      <SearchAndFilterBar
        onSearchChange={setSearch}
        onShowArchivedChange={setShowArchived}
        searchPlaceholder={shared.searchPlaceholder}
        searchValue={search}
        showArchived={showArchived}
        showArchivedLabel={shared.showArchived}
      />

      {loading || quotesLoading ? (
        <LoadingState message={copy.loading} />
      ) : filtered.length === 0 ? (
        <EmptyState actionLabel={copy.actions.create} onAction={openCreate} title={copy.empty} />
      ) : (
        <>
          <EntityTable
            actionsColumn={(q) => {
              const quote = quoteById(q.id);
              return (
                <RowActionMenu
                  actions={[
                    ...(quote?.simulationId
                      ? [
                          {
                            key: "customizer",
                            label: customizerCopy.actions.openInCustomizer,
                            onClick: () =>
                              router.push(
                                `/${locale}/quotations/customizer?simulationId=${quote.simulationId}`
                              )
                          }
                        ]
                      : []),
                    {
                      key: "approve",
                      label: copy.actions.approve,
                      disabled: quote?.status === "approved",
                      onClick: async () => {
                        if (!quote || state.status !== "ready") return;
                        await state.repos.quotes.approve(tenantId, quote.id);
                        notifyDataChanged();
                        await reload();
                      }
                    },
                    {
                      key: "dup",
                      label: shared.actions.duplicate,
                      onClick: async () => {
                        if (!quote || state.status !== "ready") return;
                        await state.repos.quotes.duplicate(tenantId, quote.id);
                        notifyDataChanged();
                        await reload();
                      }
                    },
                    {
                      key: "archive",
                      label: quote && isArchivedRecord(quote) ? shared.actions.restore : shared.actions.archive,
                      destructive: !(quote && isArchivedRecord(quote)),
                      onClick: () => quote && setArchiveTarget(quote)
                    }
                  ]}
                  triggerLabel={shared.actions.menu}
                />
              );
            }}
            actionsHeader={shared.actions.menu}
            archivedRowClass={(q) => {
              const quote = quoteById(q.id);
              return quote ? isArchivedRecord(quote) : false;
            }}
            columns={columns}
            rowKey={(q) => q.id}
            rows={filtered}
          />
          <EntityCardList
            actions={(q) => {
              const quote = quoteById(q.id);
              return (
                <RowActionMenu
                  actions={[
                    {
                      key: "approve",
                      label: copy.actions.approve,
                      disabled: quote?.status === "approved",
                      onClick: async () => {
                        if (!quote || state.status !== "ready") return;
                        await state.repos.quotes.approve(tenantId, quote.id);
                        notifyDataChanged();
                        await reload();
                      }
                    },
                    {
                      key: "archive",
                      label: quote && isArchivedRecord(quote) ? shared.actions.restore : shared.actions.archive,
                      onClick: () => quote && setArchiveTarget(quote)
                    }
                  ]}
                  triggerLabel={shared.actions.menu}
                />
              );
            }}
            archivedRowClass={(q) => {
              const quote = quoteById(q.id);
              return quote ? isArchivedRecord(quote) : false;
            }}
            meta={(q) => copy.statuses[q.status]}
            rowKey={(q) => q.id}
            rows={filtered}
            subtitle={(q) => q.customerName}
            title={(q) => q.quoteNumber}
          />
        </>
      )}

      <EntityFormDrawer
        cancelLabel={shared.form.cancel}
        onClose={() => setDrawerOpen(false)}
        onSubmit={handleSubmit}
        open={drawerOpen}
        submitLabel={shared.form.create}
        submitting={submitting}
        title={copy.form.createTitle}
        wide
      >
        <FormField label={copy.form.customer} required>
          <select className={selectClassName} onChange={(e) => setForm({ ...form, customerId: e.target.value })} value={form.customerId}>
            <option value="">{copy.form.selectCustomer}</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label={copy.form.product} required>
          <select className={selectClassName} onChange={(e) => setForm({ ...form, productId: e.target.value })} value={form.productId}>
            <option value="">{copy.form.selectProduct}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label={copy.form.quantity} required>
          <input className={inputClassName} min={1} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} type="number" value={form.quantity} />
        </FormField>
        <FormField label={copy.form.printColors}>
          <input className={inputClassName} min={1} onChange={(e) => setForm({ ...form, printColorCount: Number(e.target.value) })} type="number" value={form.printColorCount} />
        </FormField>
        <FormField label={copy.form.notes}>
          <textarea className={textareaClassName} onChange={(e) => setForm({ ...form, notes: e.target.value })} value={form.notes} />
        </FormField>
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
