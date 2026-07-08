"use client";

import Link from "next/link";
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
  textareaClassName
} from "@/components/crud";
import type { Customer } from "@/domain/types";
import { isValidEmail } from "@/features/crud/validation";
import { filterBySearch, isArchivedRecord, useHashAction } from "@/features/crud/ui-utils";
import { useCustomers } from "@/persistence/hooks";
import { usePersistence, usePersistenceLoading } from "@/persistence/provider";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getLocalizedModuleHref } from "@/modules/config";

type CustomersShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

type CustomerForm = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  notes: string;
};

const emptyForm: CustomerForm = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  notes: ""
};

export function CustomersShell({ dictionary, locale }: CustomersShellProps) {
  const copy = dictionary.customersModule;
  const shared = dictionary.crudModule;
  const loading = usePersistenceLoading();
  const { state, tenantId, notifyDataChanged } = usePersistence();
  const [showArchived, setShowArchived] = useState(false);
  const { customers, loading: customersLoading, reload } = useCustomers(showArchived);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Customer | null>(null);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setDrawerOpen(true);
  }, []);

  useHashAction("create", openCreate);

  const filtered = useMemo(
    () =>
      filterBySearch(
        customers,
        search,
        (c) => `${c.companyName} ${c.contactName} ${c.email} ${c.tradingName}`
      ),
    [customers, search]
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (state.status !== "ready") return;
    if (!form.companyName.trim() || !form.contactName.trim()) {
      setFormError(copy.form.required);
      return;
    }
    if (!isValidEmail(form.email)) {
      setFormError(copy.form.invalidEmail);
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await state.repos.customers.update(tenantId, editing.id, {
          companyName: form.companyName,
          tradingName: form.companyName,
          legalName: form.companyName,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone,
          notes: form.notes
        });
      } else {
        await state.repos.customers.create(tenantId, {
          legalName: form.companyName,
          tradingName: form.companyName,
          companyName: form.companyName,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone,
          notes: form.notes
        });
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
        await state.repos.customers.restore(tenantId, archiveTarget.id);
      } else {
        await state.repos.customers.archive(tenantId, archiveTarget.id);
      }
      notifyDataChanged();
      await reload();
      setArchiveTarget(null);
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(customer: Customer) {
    setEditing(customer);
    setForm({
      companyName: customer.companyName || customer.tradingName,
      contactName: customer.contactName,
      email: customer.email,
      phone: customer.phone,
      notes: customer.notes
    });
    setFormError(null);
    setDrawerOpen(true);
  }

  const columns = [
    { key: "company", header: copy.table.company, render: (c: Customer) => c.companyName },
    { key: "contact", header: copy.table.contact, render: (c: Customer) => c.contactName },
    { key: "email", header: copy.table.email, render: (c: Customer) => c.email },
    {
      key: "created",
      header: copy.table.created,
      render: (c: Customer) => new Date(c.createdAt).toLocaleString(locale)
    }
  ];

  return (
    <AppFrame activeModule="customers" dictionary={dictionary} locale={locale}>
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
              href={`/${locale}/quotations/customizer`}
            >
              {dictionary.customizerModule.actions.openCustomizer}
            </Link>
            <PrimaryActionButton onClick={openCreate}>{copy.actions.create}</PrimaryActionButton>
          </div>
        }
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

      {loading || customersLoading ? (
        <LoadingState message={copy.loading} />
      ) : filtered.length === 0 ? (
        <EmptyState
          actionLabel={copy.actions.create}
          description={copy.emptyDescription}
          onAction={openCreate}
          title={copy.empty}
        />
      ) : (
        <>
          <EntityTable
            actionsColumn={(c) => (
              <RowActionMenu
                actions={[
                  { key: "edit", label: shared.actions.edit, onClick: () => openEdit(c) },
                  {
                    key: "customizer",
                    label: dictionary.customizerModule.actions.openForCustomer,
                    onClick: () => {
                      window.location.href = `/${locale}/quotations/customizer?customerId=${c.id}`;
                    }
                  },
                  {
                    key: "archive",
                    label: isArchivedRecord(c) ? shared.actions.restore : shared.actions.archive,
                    destructive: !isArchivedRecord(c),
                    onClick: () => setArchiveTarget(c)
                  }
                ]}
                triggerLabel={shared.actions.menu}
              />
            )}
            actionsHeader={shared.actions.menu}
            archivedRowClass={isArchivedRecord}
            columns={columns}
            rowKey={(c) => c.id}
            rows={filtered}
          />
          <EntityCardList
            actions={(c) => (
              <RowActionMenu
                actions={[
                  { key: "edit", label: shared.actions.edit, onClick: () => openEdit(c) },
                  {
                    key: "customizer",
                    label: dictionary.customizerModule.actions.openForCustomer,
                    onClick: () => {
                      window.location.href = `/${locale}/quotations/customizer?customerId=${c.id}`;
                    }
                  },
                  {
                    key: "archive",
                    label: isArchivedRecord(c) ? shared.actions.restore : shared.actions.archive,
                    onClick: () => setArchiveTarget(c)
                  }
                ]}
                triggerLabel={shared.actions.menu}
              />
            )}
            archivedRowClass={isArchivedRecord}
            meta={(c) => c.email}
            rowKey={(c) => c.id}
            rows={filtered}
            subtitle={(c) => c.contactName}
            title={(c) => c.companyName}
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
        <FormField label={copy.form.companyName} required>
          <input
            className={inputClassName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            value={form.companyName}
          />
        </FormField>
        <FormField label={copy.form.contactName} required>
          <input
            className={inputClassName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
            value={form.contactName}
          />
        </FormField>
        <FormField label={copy.form.email} required>
          <input
            className={inputClassName}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            type="email"
            value={form.email}
          />
        </FormField>
        <FormField label={copy.form.phone}>
          <input
            className={inputClassName}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            value={form.phone}
          />
        </FormField>
        <FormField label={copy.form.notes}>
          <textarea
            className={textareaClassName}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            value={form.notes}
          />
        </FormField>
        <FormFieldError message={formError} />
      </EntityFormDrawer>

      <ArchiveConfirmationDialog
        cancelLabel={shared.archive.cancel}
        confirmLabel={archiveTarget && isArchivedRecord(archiveTarget) ? shared.actions.restore : shared.archive.confirm}
        confirming={submitting}
        message={
          archiveTarget && isArchivedRecord(archiveTarget)
            ? shared.archive.restoreMessage
            : shared.archive.message
        }
        onCancel={() => setArchiveTarget(null)}
        onConfirm={() => void confirmArchive()}
        open={Boolean(archiveTarget)}
        title={shared.archive.title}
      />
    </AppFrame>
  );
}
