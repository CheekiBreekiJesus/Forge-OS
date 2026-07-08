"use client";

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
import type { Machine, MachineStatus } from "@/domain/operations-types";
import { filterBySearch, isArchivedRecord, useHashAction } from "@/features/crud/ui-utils";
import { useMachines } from "@/persistence/hooks";
import { usePersistence, usePersistenceLoading } from "@/persistence/provider";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getLocalizedModuleHref } from "@/modules/config";

type MachinesShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

type MachineForm = {
  code: string;
  name: string;
  machineType: string;
  status: MachineStatus;
  capacityPerHour: number;
  location: string;
  notes: string;
};

const emptyForm: MachineForm = {
  code: "",
  name: "",
  machineType: "screen_print",
  status: "operational",
  capacityPerHour: 1000,
  location: "",
  notes: ""
};

export function MachinesShell({ dictionary, locale }: MachinesShellProps) {
  const copy = dictionary.machinesModule;
  const shared = dictionary.crudModule;
  const loading = usePersistenceLoading();
  const { state, tenantId, notifyDataChanged } = usePersistence();
  const [showArchived, setShowArchived] = useState(false);
  const { machines, loading: dataLoading, reload } = useMachines(showArchived);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Machine | null>(null);
  const [form, setForm] = useState<MachineForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Machine | null>(null);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setDrawerOpen(true);
  }, []);

  useHashAction("create", openCreate);

  const filtered = useMemo(
    () => filterBySearch(machines, search, (m) => `${m.name} ${m.code} ${m.machineType}`),
    [machines, search]
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (state.status !== "ready") return;
    if (!form.code.trim() || !form.name.trim()) {
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
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        machineType: form.machineType,
        status: form.status,
        capacityPerHour: form.capacityPerHour,
        supportedProductIds: editing?.supportedProductIds ?? [],
        location: form.location,
        notes: form.notes,
        setupNotes: editing?.setupNotes ?? "",
        maintenanceNotes: editing?.maintenanceNotes ?? ""
      };
      if (editing) {
        await state.repos.machines.update(tenantId, editing.id, payload);
      } else {
        await state.repos.machines.create(tenantId, payload);
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
        await state.repos.machines.restore(tenantId, archiveTarget.id);
      } else {
        await state.repos.machines.archive(tenantId, archiveTarget.id);
      }
      notifyDataChanged();
      await reload();
      setArchiveTarget(null);
    } finally {
      setSubmitting(false);
    }
  }

  function openEdit(machine: Machine) {
    setEditing(machine);
    setForm({
      code: machine.code,
      name: machine.name,
      machineType: machine.machineType,
      status: machine.status,
      capacityPerHour: machine.capacityPerHour,
      location: machine.location,
      notes: machine.notes
    });
    setFormError(null);
    setDrawerOpen(true);
  }

  const columns = [
    { key: "code", header: copy.table.code, render: (m: Machine) => m.code },
    { key: "name", header: copy.table.name, render: (m: Machine) => m.name },
    { key: "type", header: copy.table.type, render: (m: Machine) => m.machineType },
    { key: "status", header: copy.table.status, render: (m: Machine) => copy.statuses[m.status] },
    { key: "capacity", header: copy.table.capacity, render: (m: Machine) => m.capacityPerHour.toLocaleString(locale) }
  ];

  return (
    <AppFrame activeModule="machines" dictionary={dictionary} locale={locale}>
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

      {loading || dataLoading ? (
        <LoadingState message={copy.loading} />
      ) : filtered.length === 0 ? (
        <EmptyState actionLabel={copy.actions.create} onAction={openCreate} title={copy.empty} />
      ) : (
        <>
          <EntityTable
            actionsColumn={(m) => (
              <RowActionMenu
                actions={[
                  { key: "edit", label: shared.actions.edit, onClick: () => openEdit(m) },
                  {
                    key: "dup",
                    label: shared.actions.duplicate,
                    onClick: async () => {
                      if (state.status !== "ready") return;
                      await state.repos.machines.duplicate(tenantId, m.id);
                      notifyDataChanged();
                      await reload();
                    }
                  },
                  {
                    key: "archive",
                    label: isArchivedRecord(m) ? shared.actions.restore : shared.actions.archive,
                    destructive: !isArchivedRecord(m),
                    onClick: () => setArchiveTarget(m)
                  }
                ]}
                triggerLabel={shared.actions.menu}
              />
            )}
            actionsHeader={shared.actions.menu}
            archivedRowClass={isArchivedRecord}
            columns={columns}
            rowKey={(m) => m.id}
            rows={filtered}
          />
          <EntityCardList
            actions={(m) => (
              <RowActionMenu
                actions={[
                  { key: "edit", label: shared.actions.edit, onClick: () => openEdit(m) },
                  {
                    key: "archive",
                    label: isArchivedRecord(m) ? shared.actions.restore : shared.actions.archive,
                    onClick: () => setArchiveTarget(m)
                  }
                ]}
                triggerLabel={shared.actions.menu}
              />
            )}
            archivedRowClass={isArchivedRecord}
            meta={(m) => copy.statuses[m.status]}
            rowKey={(m) => m.id}
            rows={filtered}
            subtitle={(m) => m.code}
            title={(m) => m.name}
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
        <FormField label={copy.form.code} required>
          <input className={inputClassName} onChange={(e) => setForm({ ...form, code: e.target.value })} value={form.code} />
        </FormField>
        <FormField label={copy.form.name} required>
          <input className={inputClassName} onChange={(e) => setForm({ ...form, name: e.target.value })} value={form.name} />
        </FormField>
        <FormField label={copy.form.type}>
          <input className={inputClassName} onChange={(e) => setForm({ ...form, machineType: e.target.value })} value={form.machineType} />
        </FormField>
        <FormField label={copy.form.status}>
          <select className={selectClassName} onChange={(e) => setForm({ ...form, status: e.target.value as MachineStatus })} value={form.status}>
            {(Object.keys(copy.statuses) as MachineStatus[]).map((s) => (
              <option key={s} value={s}>
                {copy.statuses[s]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label={copy.form.capacity}>
          <input
            className={inputClassName}
            min={0}
            onChange={(e) => setForm({ ...form, capacityPerHour: Number(e.target.value) })}
            type="number"
            value={form.capacityPerHour}
          />
        </FormField>
        <FormField label={copy.form.location}>
          <input className={inputClassName} onChange={(e) => setForm({ ...form, location: e.target.value })} value={form.location} />
        </FormField>
        <FormField label={copy.form.notes}>
          <textarea className={textareaClassName} onChange={(e) => setForm({ ...form, notes: e.target.value })} value={form.notes} />
        </FormField>
        <FormFieldError message={formError} />
      </EntityFormDrawer>

      <ArchiveConfirmationDialog
        cancelLabel={shared.archive.cancel}
        confirmLabel={archiveTarget && isArchivedRecord(archiveTarget) ? shared.actions.restore : shared.archive.confirm}
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
