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
  LoadingState,
  PageHeader,
  RowActionMenu,
  SearchAndFilterBar,
  selectClassName
} from "@/components/crud";
import type { ProductionOrder, ProductionOrderStatus } from "@/domain/types";
import { filterBySearch, isArchivedRecord, useHashAction } from "@/features/crud/ui-utils";
import { useMachines, useProductionOrders } from "@/persistence/hooks";
import { usePersistence, usePersistenceLoading } from "@/persistence/provider";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getLocalizedModuleHref } from "@/modules/config";

type ProductionListShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

export function ProductionListShell({ dictionary, locale }: ProductionListShellProps) {
  const copy = dictionary.productionModule;
  const shared = dictionary.crudModule;
  const loading = usePersistenceLoading();
  const { state, tenantId, notifyDataChanged } = usePersistence();
  const [showArchived, setShowArchived] = useState(false);
  const { orders, loading: ordersLoading, reload } = useProductionOrders(showArchived);
  const { machines } = useMachines();
  const [search, setSearch] = useState("");
  const [assignTarget, setAssignTarget] = useState<ProductionOrder | null>(null);
  const [machineId, setMachineId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<ProductionOrder | null>(null);

  useHashAction("create", () => {
    window.location.href = getLocalizedModuleHref(locale, "orders");
  });

  const filtered = useMemo(
    () => filterBySearch(orders, search, (o) => `${o.orderNumber} ${o.customerName} ${o.productName}`),
    [orders, search]
  );

  async function handleAssign(event: FormEvent) {
    event.preventDefault();
    if (!assignTarget || !machineId || state.status !== "ready") return;
    const machine = machines.find((m) => m.id === machineId);
    if (!machine) return;
    setSubmitting(true);
    try {
      await state.repos.productionOrders.assignMachine(
        tenantId,
        assignTarget.id,
        machine.id,
        machine.name
      );
      notifyDataChanged();
      await reload();
      setAssignTarget(null);
      setMachineId("");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmArchive() {
    if (!archiveTarget || state.status !== "ready") return;
    setSubmitting(true);
    try {
      if (isArchivedRecord(archiveTarget)) {
        await state.repos.productionOrders.restore(tenantId, archiveTarget.id);
      } else {
        await state.repos.productionOrders.archive(tenantId, archiveTarget.id);
      }
      notifyDataChanged();
      await reload();
      setArchiveTarget(null);
    } finally {
      setSubmitting(false);
    }
  }

  const updateStatus = useCallback(
    async (order: ProductionOrder, status: ProductionOrderStatus) => {
      if (state.status !== "ready") return;
      await state.repos.productionOrders.update(tenantId, order.id, { status });
      notifyDataChanged();
      await reload();
    },
    [notifyDataChanged, reload, state, tenantId]
  );

  const columns = [
    { key: "number", header: copy.table.number, render: (o: ProductionOrder) => o.orderNumber },
    { key: "customer", header: copy.table.customer, render: (o: ProductionOrder) => o.customerName },
    { key: "product", header: copy.table.product, render: (o: ProductionOrder) => o.productName },
    { key: "quantity", header: copy.table.quantity, render: (o: ProductionOrder) => o.quantity.toLocaleString(locale) },
    { key: "machine", header: copy.table.machine, render: (o: ProductionOrder) => o.machineName || "—" },
    { key: "status", header: copy.table.status, render: (o: ProductionOrder) => copy.statuses[o.status] }
  ];

  const rowActions = (order: ProductionOrder) => (
    <RowActionMenu
      actions={[
        {
          key: "job",
          label: copy.openJobCard,
          onClick: () => {
            window.location.href = `/${locale}/jobs/${order.id}`;
          }
        },
        {
          key: "assign",
          label: copy.actions.assignMachine,
          onClick: () => {
            setAssignTarget(order);
            setMachineId(order.machineId || "");
          }
        },
        {
          key: "progress",
          label: copy.actions.start,
          disabled: order.status === "in-progress",
          onClick: () => void updateStatus(order, "in-progress")
        },
        {
          key: "complete",
          label: copy.actions.complete,
          disabled: order.status === "completed",
          onClick: () => void updateStatus(order, "completed")
        },
        {
          key: "archive",
          label: isArchivedRecord(order) ? shared.actions.restore : shared.actions.archive,
          destructive: !isArchivedRecord(order),
          onClick: () => setArchiveTarget(order)
        }
      ]}
      triggerLabel={shared.actions.menu}
    />
  );

  return (
    <AppFrame activeModule="production" dictionary={dictionary} locale={locale}>
      <PageHeader
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

      {loading || ordersLoading ? (
        <LoadingState message={copy.loading} />
      ) : filtered.length === 0 ? (
        <EmptyState title={copy.empty} />
      ) : (
        <>
          <EntityTable
            actionsColumn={rowActions}
            actionsHeader={shared.actions.menu}
            archivedRowClass={isArchivedRecord}
            columns={columns}
            rowKey={(o) => o.id}
            rows={filtered}
          />
          <EntityCardList
            actions={rowActions}
            archivedRowClass={isArchivedRecord}
            meta={(o) => copy.statuses[o.status]}
            rowKey={(o) => o.id}
            rows={filtered}
            subtitle={(o) => o.productName}
            title={(o) => o.orderNumber}
          />
        </>
      )}

      <EntityFormDrawer
        cancelLabel={shared.form.cancel}
        onClose={() => setAssignTarget(null)}
        onSubmit={handleAssign}
        open={Boolean(assignTarget)}
        submitLabel={copy.actions.assignMachine}
        submitting={submitting}
        title={copy.form.assignMachine}
      >
        <FormField label={copy.form.machine} required>
          <select className={selectClassName} onChange={(e) => setMachineId(e.target.value)} value={machineId}>
            <option value="">{copy.form.selectMachine}</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.code})
              </option>
            ))}
          </select>
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
