"use client";

import React, { FormEvent, useCallback, useMemo, useState } from "react";
import { convertDemoLead } from "@/application/demo-workflow-service";
import { persistImportedLeads, validateCsvFile } from "@/application/csv-import-service";
import { AppFrame, panelClass } from "@/components/app-frame";
import {
  ArchiveConfirmationDialog,
  EntityFormDrawer,
  FormField,
  FormFieldError,
  PrimaryActionButton,
  RowActionMenu,
  inputClassName
} from "@/components/crud";
import { toLeadOpsLead } from "@/domain/mappers";
import { isValidEmail } from "@/features/crud/validation";
import { isArchivedRecord, useHashAction } from "@/features/crud/ui-utils";
import { clearLeadOpsFilters, hasActiveFilters } from "@/features/leadops/filters";
import { parseLeadCsv, type LeadImportResult } from "@/features/leadops/import";
import { calculateLeadOpsKpis, getCampaignProgress } from "@/features/leadops/kpis";
import { getLocalizedLeadDetailHref } from "@/features/leadops/lookup";
import { getFilterOptions } from "@/features/leadops/seed";
import {
  areAllVisibleSelected,
  isLeadSelected,
  toggleLeadSelection,
  toggleSelectAllVisible
} from "@/features/leadops/selection";
import {
  EMPTY_LEADOPS_FILTERS,
  type LeadOpsFilters,
  type LeadOpsLead
} from "@/features/leadops/types";
import { buildLeadListViewModel } from "@/features/leadops/view-models";
import { useActivities, useTenantLeads } from "@/persistence/hooks";
import { usePersistence, usePersistenceLoading } from "@/persistence/provider";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { toLeadOpsCampaign } from "@/domain/mappers";
import { useEffect } from "react";
import type { LeadOpsActivityKind, LeadOpsCampaign } from "@/features/leadops/types";
import type { ActivityAction } from "@/domain/types";

type LeadOpsDashboardShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

const kpiKeys = [
  "totalLeads",
  "ready",
  "queued",
  "contactedSent",
  "replies",
  "positiveReplies",
  "bounceRate",
  "activeCampaigns"
] as const;

export function LeadOpsDashboardShell({ dictionary, locale }: LeadOpsDashboardShellProps) {
  const copy = dictionary.leadops;
  const shared = dictionary.crudModule;
  const [showArchived, setShowArchived] = useState(false);
  const persistenceLoading = usePersistenceLoading();
  const { leads: domainLeads, loading: leadsLoading, reload: reloadLeads } = useTenantLeads(showArchived);
  const { activities: domainActivities } = useActivities();
  const { state, tenantId, notifyDataChanged } = usePersistence();
  const [campaigns, setCampaigns] = useState<LeadOpsCampaign[]>([]);
  const [importResult, setImportResult] = useState<LeadImportResult | null>(null);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const tenantLeads = useMemo(
    () => domainLeads.map(toLeadOpsLead),
    [domainLeads]
  );

  const tenantActivities = useMemo(
    () =>
      domainActivities.map((a) => ({
        id: a.id,
        tenantId: a.tenantId,
        kind: mapActivityAction(a.action),
        companyName: String(a.metadata.companyName ?? a.title),
        occurredAt: a.occurredAt
      })),
    [domainActivities]
  );

  useEffect(() => {
    if (state.status !== "ready") return;
    void state.repos.campaigns.list(state.tenantId).then((rows) => {
      setCampaigns(rows.map(toLeadOpsCampaign));
    });
  }, [state]);

  const filterOptions = useMemo(() => getFilterOptions(tenantLeads), [tenantLeads]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<LeadOpsFilters>({ ...EMPTY_LEADOPS_FILTERS });
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [leadDrawerOpen, setLeadDrawerOpen] = useState(false);
  const [leadForm, setLeadForm] = useState({ companyName: "", contactName: "", email: "" });
  const [leadFormError, setLeadFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [archiveLeadId, setArchiveLeadId] = useState<string | null>(null);

  const openCreateLead = useCallback(() => {
    setLeadForm({ companyName: "", contactName: "", email: "" });
    setLeadFormError(null);
    setLeadDrawerOpen(true);
  }, []);

  useHashAction("create-lead", openCreateLead);

  const kpis = useMemo(
    () => calculateLeadOpsKpis(tenantLeads, campaigns),
    [campaigns, tenantLeads]
  );
  const listView = useMemo(
    () => buildLeadListViewModel(tenantLeads, searchQuery, filters),
    [filters, searchQuery, tenantLeads]
  );
  const visibleLeadIds = listView.visibleLeads.map((lead) => lead.id);
  const allVisibleSelected = areAllVisibleSelected(selectedLeadIds, visibleLeadIds);

  function updateFilter<Key extends keyof LeadOpsFilters>(key: Key, value: LeadOpsFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  async function handleCreateLead(event: FormEvent) {
    event.preventDefault();
    if (state.status !== "ready") return;
    if (!leadForm.companyName.trim() || !leadForm.contactName.trim()) {
      setLeadFormError(copy.form.required);
      return;
    }
    if (!isValidEmail(leadForm.email)) {
      setLeadFormError(copy.form.invalidEmail);
      return;
    }
    setSubmitting(true);
    try {
      await state.repos.leads.create(tenantId, leadForm);
      notifyDataChanged();
      await reloadLeads();
      setLeadDrawerOpen(false);
    } catch (error) {
      setLeadFormError(error instanceof Error ? error.message : shared.error.generic);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLeadArchive(leadId: string, restore: boolean) {
    if (state.status !== "ready") return;
    setSubmitting(true);
    try {
      if (restore) {
        await state.repos.leads.restore(tenantId, leadId);
      } else {
        await state.repos.leads.archive(tenantId, leadId);
      }
      notifyDataChanged();
      await reloadLeads();
      setArchiveLeadId(null);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLeadDuplicate(leadId: string) {
    if (state.status !== "ready") return;
    await state.repos.leads.duplicate(tenantId, leadId);
    notifyDataChanged();
    await reloadLeads();
  }

  async function handleLeadConvert(leadId: string) {
    if (state.status !== "ready") return;
    await convertDemoLead(state.repos, tenantId, leadId);
    notifyDataChanged();
    await reloadLeads();
  }

  function leadRowActions(leadId: string, archived: boolean) {
    return (
      <RowActionMenu
        actions={[
          {
            key: "view",
            label: copy.table.viewLead,
            onClick: () => {
              window.location.href = getLocalizedLeadDetailHref(locale, leadId);
            }
          },
          {
            key: "dup",
            label: shared.actions.duplicate,
            onClick: () => void handleLeadDuplicate(leadId)
          },
          {
            key: "convert",
            label: copy.actions.convert,
            onClick: () => void handleLeadConvert(leadId)
          },
          {
            key: "archive",
            label: archived ? shared.actions.restore : shared.actions.archive,
            destructive: !archived,
            onClick: () => setArchiveLeadId(leadId)
          }
        ]}
        triggerLabel={shared.actions.menu}
      />
    );
  }

  function handleClearFilters() {
    setFilters(clearLeadOpsFilters());
    setSearchQuery("");
  }

  function handleCsvImport(file: File | null) {
    if (!file) return;
    const validationError = validateCsvFile(file);
    if (validationError) {
      setImportSummary(validationError);
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImportResult(parseLeadCsv(String(reader.result ?? "")));
      setImportSummary(null);
    });
    reader.readAsText(file);
  }

  async function confirmCsvImport() {
    if (!importResult || state.status !== "ready") return;
    setImporting(true);
    try {
      const result = await persistImportedLeads(
        state.repos,
        state.tenantId,
        importResult.validRows,
        "CSV Import"
      );
      setImportSummary(
        copy.import.summary
          .replace("{imported}", String(result.imported))
          .replace("{skipped}", String(result.skipped))
      );
      await reloadLeads();
      setImportResult(null);
    } catch (error) {
      setImportSummary(error instanceof Error ? error.message : copy.import.failed);
    } finally {
      setImporting(false);
    }
  }

  if (persistenceLoading || leadsLoading) {
    return (
      <AppFrame activeModule="marketing" dictionary={dictionary} locale={locale} supplementalRoute="leadops">
        <div className={`${panelClass} p-8 text-center text-slate-400`}>
          {dictionary.demoWorkflow.persistence.loading}
        </div>
      </AppFrame>
    );
  }

  function formatKpiValue(key: (typeof kpiKeys)[number]): string {
    if (key === "bounceRate") {
      return kpis.bounceRate === null
        ? copy.kpis.bounceRateUnavailable
        : `${kpis.bounceRate}%`;
    }

    return String(kpis[key]);
  }

  return (
    <AppFrame
      activeModule="marketing"
      dictionary={dictionary}
      locale={locale}
      supplementalRoute="leadops"
    >
      <section className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-orange-300">{copy.eyebrow}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{copy.title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">{copy.description}</p>
      </section>

      <section className="mb-4">
        <PanelHeading title={copy.sections.kpis} />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpiKeys.map((key) => (
            <article className={`${panelClass} p-4`} key={key}>
              <p className="text-sm text-slate-400">{copy.kpis[key]}</p>
              <p className="mt-2 text-2xl font-bold">{formatKpiValue(key)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className={`${panelClass} p-5`}>
          <PanelHeading title={copy.sections.campaigns} />
          <div className="mt-4 space-y-4">
            {campaigns.map((campaign) => {
              const progress = getCampaignProgress(campaign);

              return (
                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4" key={campaign.id}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold">{campaign.name}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {copy.campaignStatuses[campaign.status]}
                      </div>
                    </div>
                    <div className="text-sm text-slate-300">
                      {campaign.sentCount}/{campaign.totalCount}
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-800">
                    <div
                      className="campaign-progress-fill h-2 rounded-full bg-orange-400"
                      style={{ "--progress-width": `${progress}%` } as React.CSSProperties}
                    />
                  </div>
                  <div className="mt-2 text-xs text-slate-500">{progress}%</div>
                </div>
              );
            })}
          </div>
        </article>

        <article className={`${panelClass} p-5`}>
          <PanelHeading title={copy.sections.activity} />
          <div className="mt-4 space-y-3">
            {tenantActivities.map((activity) => (
              <div
                className="rounded-lg border border-slate-800 bg-slate-950/40 p-4"
                key={activity.id}
              >
                <div className="text-sm font-semibold">{copy.activities[activity.kind]}</div>
                <div className="mt-1 text-sm text-slate-300">{activity.companyName}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {new Date(activity.occurredAt).toLocaleString(locale)}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={`${panelClass} mb-4 p-5`}>
        <PanelHeading title={copy.sections.import} />
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-2xl text-sm text-slate-400">{copy.import.description}</p>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800">
            {copy.import.chooseCsv}
            <input
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(event) => handleCsvImport(event.target.files?.[0] ?? null)}
              type="file"
            />
          </label>
        </div>
        {importResult ? (
          <div className="mt-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <ImportMetric label={copy.import.validRows} value={importResult.validRows.length} />
              <ImportMetric label={copy.import.reviewRows} value={importResult.reviewRows.length} />
              <ImportMetric label={copy.import.invalidRows} value={importResult.invalidRows.length} />
              <ImportMetric label={copy.import.duplicateEmails} value={importResult.duplicateEmails.length} />
            </div>
            {importResult.validRows.length > 0 ? (
              <button
                className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                disabled={importing}
                onClick={() => void confirmCsvImport()}
                type="button"
              >
                {importing ? copy.import.importing : copy.import.confirmImport}
              </button>
            ) : null}
          </div>
        ) : null}
        {importSummary ? (
          <p className="mt-4 text-sm text-emerald-200">{importSummary}</p>
        ) : null}
      </section>

      <section className={`${panelClass} p-5`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <PanelHeading title={copy.sections.leads} />
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                type="checkbox"
              />
              {shared.showArchived}
            </label>
            <PrimaryActionButton onClick={openCreateLead}>{copy.actions.createLead}</PrimaryActionButton>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))]">
          <input
            className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-orange-400 focus:ring-1 lg:col-span-2"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={copy.searchPlaceholder}
            type="search"
            value={searchQuery}
          />
          <FilterSelect
            allLabel={copy.filters.all}
            label={copy.filters.industry}
            onChange={(value) => updateFilter("industry", value)}
            options={filterOptions.industries}
            value={filters.industry}
          />
          <FilterSelect
            allLabel={copy.filters.all}
            label={copy.filters.status}
            onChange={(value) => updateFilter("status", value)}
            options={filterOptions.statuses.map((s) => ({
              value: s,
              label: copy.statuses[s as keyof typeof copy.statuses] ?? s
            }))}
            value={filters.status}
          />
          <FilterSelect
            allLabel={copy.filters.all}
            label={copy.filters.quality}
            onChange={(value) => updateFilter("quality", value)}
            options={filterOptions.qualities.map((q) => ({
              value: q,
              label: copy.qualities[q as keyof typeof copy.qualities] ?? q
            }))}
            value={filters.quality}
          />
          <FilterSelect
            allLabel={copy.filters.all}
            label={copy.filters.sourceDatabase}
            onChange={(value) => updateFilter("sourceDatabase", value)}
            options={filterOptions.sourceDatabases}
            value={filters.sourceDatabase}
          />
          <FilterSelect
            allLabel={copy.filters.all}
            label={copy.filters.language}
            onChange={(value) => updateFilter("language", value)}
            options={filterOptions.languages}
            value={filters.language}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-400">
            {copy.resultCount.replace("{count}", String(listView.resultCount))}
          </div>
          <div className="flex flex-wrap gap-2">
            {hasActiveFilters(filters) || searchQuery ? (
              <button
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
                onClick={handleClearFilters}
                type="button"
              >
                {copy.clearFilters}
              </button>
            ) : null}
            <button
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-500"
              disabled
              title={copy.addToCampaignDisabled}
              type="button"
            >
              {copy.addToCampaign}
            </button>
          </div>
        </div>

        {listView.state === "empty" ? (
          <EmptyState description={copy.emptyDescription} title={copy.emptyTitle} />
        ) : null}

        {listView.state === "no-results" ? (
          <EmptyState description={copy.noResultsDescription} title={copy.noResultsTitle} />
        ) : null}

        {listView.state === "results" ? (
          <>
            <div className="mt-4 flex items-center gap-3 border-b border-slate-800 pb-3">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  checked={allVisibleSelected}
                  onChange={() =>
                    setSelectedLeadIds(toggleSelectAllVisible(selectedLeadIds, visibleLeadIds))
                  }
                  type="checkbox"
                />
                {copy.selectAllVisible}
              </label>
              {selectedLeadIds.length > 0 ? (
                <span className="text-xs text-slate-500">
                {copy.table.selectedCount.replace("{count}", String(selectedLeadIds.length))}
              </span>
              ) : null}
            </div>

            <div className="mt-4 hidden overflow-x-auto lg:block">
              <table className="min-w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr>
                    <th className="px-3 py-2" />
                    <th className="px-3 py-2">{copy.table.company}</th>
                    <th className="px-3 py-2">{copy.table.contact}</th>
                    <th className="px-3 py-2">{copy.table.email}</th>
                    <th className="px-3 py-2">{copy.table.location}</th>
                    <th className="px-3 py-2">{copy.table.status}</th>
                    <th className="px-3 py-2">{copy.table.quality}</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {listView.visibleLeads.map((lead) => (
                    <LeadTableRow
                      actions={leadRowActions(lead.id, isArchivedRecord(domainLeads.find((l) => l.id === lead.id) ?? { active: true }))}
                      copy={copy}
                      key={lead.id}
                      lead={lead}
                      onToggle={() =>
                        setSelectedLeadIds(toggleLeadSelection(selectedLeadIds, lead.id))
                      }
                      selected={isLeadSelected(selectedLeadIds, lead.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-3 lg:hidden">
              {listView.visibleLeads.map((lead) => (
                <LeadMobileCard
                  actions={leadRowActions(lead.id, isArchivedRecord(domainLeads.find((l) => l.id === lead.id) ?? { active: true }))}
                  copy={copy}
                  key={lead.id}
                  lead={lead}
                  onToggle={() =>
                    setSelectedLeadIds(toggleLeadSelection(selectedLeadIds, lead.id))
                  }
                  selected={isLeadSelected(selectedLeadIds, lead.id)}
                />
              ))}
            </div>
          </>
        ) : null}
      </section>

      <EntityFormDrawer
        cancelLabel={shared.form.cancel}
        onClose={() => setLeadDrawerOpen(false)}
        onSubmit={handleCreateLead}
        open={leadDrawerOpen}
        submitLabel={shared.form.create}
        submitting={submitting}
        title={copy.form.createTitle}
      >
        <FormField label={copy.form.companyName} required>
          <input
            className={inputClassName}
            onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })}
            value={leadForm.companyName}
          />
        </FormField>
        <FormField label={copy.form.contactName} required>
          <input
            className={inputClassName}
            onChange={(e) => setLeadForm({ ...leadForm, contactName: e.target.value })}
            value={leadForm.contactName}
          />
        </FormField>
        <FormField label={copy.form.email} required>
          <input
            className={inputClassName}
            onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
            type="email"
            value={leadForm.email}
          />
        </FormField>
        <FormFieldError message={leadFormError} />
      </EntityFormDrawer>

      <ArchiveConfirmationDialog
        cancelLabel={shared.archive.cancel}
        confirmLabel={shared.archive.confirm}
        confirming={submitting}
        message={shared.archive.message}
        onCancel={() => setArchiveLeadId(null)}
        onConfirm={() => {
          const lead = domainLeads.find((l) => l.id === archiveLeadId);
          if (!lead || !archiveLeadId) return;
          void handleLeadArchive(archiveLeadId, isArchivedRecord(lead));
        }}
        open={Boolean(archiveLeadId)}
        title={shared.archive.title}
      />
    </AppFrame>
  );
}

function ImportMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-bold text-slate-100">{value}</div>
    </div>
  );
}

function PanelHeading({ title }: { title: string }) {
  return <h2 className="text-lg font-bold text-slate-100">{title}</h2>;
}

type FilterOption = string | { value: string; label: string };

function FilterSelect({
  allLabel,
  label,
  options,
  value,
  onChange
}: {
  allLabel: string;
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-slate-500">{label}</span>
      <select
        className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => {
          const val = typeof option === "string" ? option : option.value;
          const displayLabel = typeof option === "string" ? option : option.label;
          return (
            <option key={val} value={val}>
              {displayLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-6 rounded-lg border border-dashed border-slate-700 bg-slate-950/30 p-8 text-center">
      <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  );
}

function LeadTableRow({
  lead,
  copy,
  selected,
  onToggle,
  actions
}: {
  lead: LeadOpsLead;
  copy: Dictionary["leadops"];
  selected: boolean;
  onToggle: () => void;
  actions: React.ReactNode;
}) {
  return (
    <tr className="border-t border-slate-800 text-slate-200">
      <td className="px-3 py-3">
        <input checked={selected} onChange={onToggle} type="checkbox" />
      </td>
      <td className="px-3 py-3 font-medium">{lead.companyName}</td>
      <td className="px-3 py-3">{lead.contactName}</td>
      <td className="px-3 py-3">{lead.email}</td>
      <td className="px-3 py-3">{lead.location}</td>
      <td className="px-3 py-3">{copy.statuses[lead.status]}</td>
      <td className="px-3 py-3">{copy.qualities[lead.quality]}</td>
      <td className="px-3 py-3">{actions}</td>
    </tr>
  );
}

function LeadMobileCard({
  lead,
  copy,
  selected,
  onToggle,
  actions
}: {
  lead: LeadOpsLead;
  copy: Dictionary["leadops"];
  selected: boolean;
  onToggle: () => void;
  actions: React.ReactNode;
}) {
  return (
    <article className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <label className="flex items-center gap-2">
          <input checked={selected} onChange={onToggle} type="checkbox" />
          <span className="font-semibold">{lead.companyName}</span>
        </label>
        {actions}
      </div>
      <div className="mt-3 grid gap-1 text-sm text-slate-400">
        <div>
          {copy.table.contact}: {lead.contactName}
        </div>
        <div>
          {copy.table.email}: {lead.email}
        </div>
        <div>
          {copy.table.location}: {lead.location}
        </div>
        <div>
          {copy.table.status}: {copy.statuses[lead.status]}
        </div>
      </div>
    </article>
  );
}

function mapActivityAction(action: ActivityAction): LeadOpsActivityKind {
  const map: Partial<Record<ActivityAction, LeadOpsActivityKind>> = {
    lead_created: "lead-imported",
    lead_qualified: "lead-qualified",
    outreach_generated: "message-generated",
    outreach_approved: "message-approved",
    outreach_queued: "message-queued",
    outreach_sent_simulated: "message-sent"
  };
  return map[action] ?? "metrics-updated";
}
