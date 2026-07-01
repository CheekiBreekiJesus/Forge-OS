"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  buildLeadManagementContext,
  previewCampaignSegment
} from "@/application/campaign-segmentation-service";
import { CampaignSegmentBuilderDialog } from "@/components/campaign-segment-builder-dialog";
import { panelClass } from "@/components/app-frame";
import { getLocalizedLeadDetailHref } from "@/features/leadops/lookup";
import {
  buildLeadManagementRows,
  loadPersistedFilters,
  matchesLeadManagementFilters,
  paginateRows,
  persistFilters,
  totalPages,
  type LeadManagementContext,
  type LeadManagementRow
} from "@/features/leadops/lead-management";
import {
  buildSegmentDefinitionFromFilters,
  buildSegmentDefinitionFromSelection
} from "@/features/leadops/segmentation";
import {
  areAllVisibleSelected,
  isLeadSelected,
  toggleLeadSelection,
  toggleSelectAllVisible
} from "@/features/leadops/selection";
import { clearLeadOpsFilters, hasActiveFilters } from "@/features/leadops/filters";
import { getFilterOptions } from "@/features/leadops/seed";
import {
  EMPTY_LEADOPS_FILTERS,
  type LeadOpsFilters
} from "@/features/leadops/types";
import type { Lead } from "@/domain/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { usePersistence } from "@/persistence/provider";

type LeadManagementPanelProps = {
  copy: Dictionary["leadops"];
  shared: Dictionary["crudModule"];
  locale: Locale;
  leads: Lead[];
  onReload: () => Promise<void>;
  rowActions: (leadId: string, archived: boolean) => React.ReactNode;
  isArchived: (lead: Lead | undefined) => boolean;
};

export function LeadOpsLeadManagementPanel({
  copy,
  shared,
  locale,
  leads,
  onReload,
  rowActions,
  isArchived
}: LeadManagementPanelProps) {
  const { state, tenantId, notifyDataChanged } = usePersistence();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<LeadOpsFilters>(() => ({
    ...EMPTY_LEADOPS_FILTERS,
    ...loadPersistedFilters()
  }));
  const [page, setPage] = useState(1);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [context, setContext] = useState<LeadManagementContext | null>(null);
  const [rows, setRows] = useState<LeadManagementRow[]>([]);
  const [importHistoryOpen, setImportHistoryOpen] = useState(false);
  const [importBatches, setImportBatches] = useState<Array<{ id: string; filename: string; createdAt: string }>>([]);
  const [segmentOpen, setSegmentOpen] = useState(false);
  const [segmentMode, setSegmentMode] = useState<"filters" | "selection">("filters");

  useEffect(() => {
    persistFilters(filters);
  }, [filters]);

  useEffect(() => {
    if (state.status !== "ready") return;
    void buildLeadManagementContext(state.repos, tenantId).then((loaded) => {
      setContext(loaded);
      setRows(buildLeadManagementRows(loaded));
    });
  }, [state, tenantId, leads]);

  const filteredRows = useMemo(
    () => rows.filter((row) => matchesLeadManagementFilters(row, searchQuery, filters)),
    [filters, rows, searchQuery]
  );
  const pageRows = useMemo(() => paginateRows(filteredRows, page), [filteredRows, page]);
  const pages = totalPages(filteredRows.length);
  const visibleLeadIds = pageRows.map((row) => row.leadId);
  const allVisibleSelected = areAllVisibleSelected(selectedLeadIds, visibleLeadIds);
  const filterOptions = useMemo(() => getFilterOptions([], rows), [rows]);

  const segmentDefinition =
    segmentMode === "selection" && selectedLeadIds.length > 0
      ? buildSegmentDefinitionFromSelection("selected_organizations", selectedLeadIds)
      : buildSegmentDefinitionFromFilters(filters, searchQuery);

  const segmentPreview = context
    ? previewCampaignSegment(segmentDefinition, context, searchQuery)
    : null;

  function updateFilter<Key extends keyof LeadOpsFilters>(key: Key, value: LeadOpsFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  }

  async function openImportHistory() {
    if (state.status !== "ready") return;
    const batches = await state.repos.importBatches.list(tenantId);
    setImportBatches(
      batches.map((batch) => ({
        id: batch.id,
        filename: batch.filename,
        createdAt: batch.createdAt
      }))
    );
    setImportHistoryOpen(true);
  }

  function openSegmentBuilder(mode: "filters" | "selection") {
    setSegmentMode(mode);
    setSegmentOpen(true);
  }

  return (
    <section className={`${panelClass} p-5`} data-testid="lead-management-panel">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg font-bold text-slate-100">{copy.sections.leads}</h2>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
            onClick={() => void openImportHistory()}
            type="button"
          >
            {copy.management.importHistory}
          </button>
          <button
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
            data-testid="create-campaign-from-filters"
            onClick={() => openSegmentBuilder("filters")}
            type="button"
          >
            {copy.management.createCampaignFromFilters}
          </button>
          <button
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 disabled:opacity-50"
            data-testid="create-campaign-from-selection"
            disabled={selectedLeadIds.length === 0}
            onClick={() => openSegmentBuilder("selection")}
            type="button"
          >
            {copy.management.createCampaignFromSelection}
          </button>
          <a
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200"
            href={`/${locale}/leadops/campaigns`}
          >
            {copy.management.viewCampaigns}
          </a>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_repeat(6,minmax(0,1fr))]">
        <input
          className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-orange-400 focus:ring-1 lg:col-span-2"
          data-testid="lead-search-input"
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setPage(1);
          }}
          placeholder={copy.searchPlaceholder}
          type="search"
          value={searchQuery}
        />
        <FilterSelect allLabel={copy.filters.all} label={copy.filters.industry} onChange={(value) => updateFilter("industry", value)} options={filterOptions.industries} value={filters.industry} />
        <FilterSelect allLabel={copy.filters.all} label={copy.filters.region} onChange={(value) => updateFilter("region", value)} options={filterOptions.regions} value={filters.region} />
        <FilterSelect allLabel={copy.filters.all} label={copy.filters.country} onChange={(value) => updateFilter("country", value)} options={filterOptions.countries} value={filters.country} />
        <FilterSelect
          allLabel={copy.filters.all}
          label={copy.management.emailValidity}
          onChange={(value) => updateFilter("emailValidity", value as LeadOpsFilters["emailValidity"])}
          options={[
            { value: "valid", label: copy.management.emailValidityValues.valid },
            { value: "missing", label: copy.management.emailValidityValues.missing },
            { value: "invalid", label: copy.management.emailValidityValues.invalid }
          ]}
          value={filters.emailValidity}
        />
        <FilterSelect
          allLabel={copy.filters.all}
          label={copy.management.suppressionStatus}
          onChange={(value) => updateFilter("suppressionStatus", value as LeadOpsFilters["suppressionStatus"])}
          options={[
            { value: "none", label: copy.management.suppressionValues.none },
            { value: "unsubscribed", label: copy.management.suppressionValues.unsubscribed },
            { value: "bounced", label: copy.management.suppressionValues.bounced }
          ]}
          value={filters.suppressionStatus}
        />
        <FilterSelect allLabel={copy.filters.all} label={copy.filters.sourceDatabase} onChange={(value) => updateFilter("sourceDatabase", value)} options={filterOptions.sourceDatabases} value={filters.sourceDatabase} />
        <FilterSelect
          allLabel={copy.filters.all}
          label={copy.filters.status}
          onChange={(value) => updateFilter("status", value)}
          options={filterOptions.statuses.map((status) => ({
            value: status,
            label: copy.statuses[status as keyof typeof copy.statuses] ?? status
          }))}
          value={filters.status}
        />
        <FilterSelect
          allLabel={copy.filters.all}
          label={copy.management.neverContacted}
          onChange={(value) => updateFilter("neverContacted", value as LeadOpsFilters["neverContacted"])}
          options={[{ value: "true", label: copy.management.neverContactedOnly }]}
          value={filters.neverContacted}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-400">
          {copy.resultCount.replace("{count}", String(filteredRows.length))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasActiveFilters(filters) || searchQuery ? (
            <button
              className="text-sm text-orange-300"
              onClick={() => {
                setFilters(clearLeadOpsFilters());
                setSearchQuery("");
              }}
              type="button"
            >
              {copy.clearFilters}
            </button>
          ) : null}
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              checked={allVisibleSelected}
              onChange={() => setSelectedLeadIds(toggleSelectAllVisible(selectedLeadIds, visibleLeadIds))}
              type="checkbox"
            />
            {copy.selectAllVisible}
          </label>
          {selectedLeadIds.length > 0 ? (
            <button className="text-sm text-slate-300" onClick={() => setSelectedLeadIds([])} type="button">
              {copy.management.clearSelection}
            </button>
          ) : null}
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-700 p-8 text-center">
          <h3 className="text-lg font-semibold">{copy.noResultsTitle}</h3>
          <p className="mt-2 text-sm text-slate-400">{copy.noResultsDescription}</p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="px-3 py-2" />
                <th className="px-3 py-2">{copy.table.company}</th>
                <th className="px-3 py-2">{copy.table.contact}</th>
                <th className="px-3 py-2">{copy.table.email}</th>
                <th className="px-3 py-2">{copy.management.category}</th>
                <th className="px-3 py-2">{copy.management.region}</th>
                <th className="px-3 py-2">{copy.management.sourceImport}</th>
                <th className="px-3 py-2">{copy.management.emailValidity}</th>
                <th className="px-3 py-2">{copy.management.suppressionStatus}</th>
                <th className="px-3 py-2">{copy.management.lastContacted}</th>
                <th className="px-3 py-2">{copy.management.campaignCount}</th>
                <th className="px-3 py-2">{copy.table.status}</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => {
                const lead = leads.find((item) => item.id === row.leadId);
                return (
                  <tr className="border-t border-slate-800 text-slate-100" data-testid={`lead-row-${row.leadId}`} key={row.leadId}>
                    <td className="px-3 py-2">
                      <input
                        checked={isLeadSelected(selectedLeadIds, row.leadId)}
                        onChange={() => setSelectedLeadIds(toggleLeadSelection(selectedLeadIds, row.leadId))}
                        type="checkbox"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <a className="text-orange-300 hover:underline" href={getLocalizedLeadDetailHref(locale, row.leadId)}>
                        {row.companyName}
                      </a>
                    </td>
                    <td className="px-3 py-2">{row.contactName}</td>
                    <td className="px-3 py-2">{row.email || "—"}</td>
                    <td className="px-3 py-2">{row.category}</td>
                    <td className="px-3 py-2">{row.region}</td>
                    <td className="px-3 py-2">{row.sourceDatabase}</td>
                    <td className="px-3 py-2">{copy.management.emailValidityValues[row.emailValidity]}</td>
                    <td className="px-3 py-2">{copy.management.suppressionValues[row.suppressionStatus]}</td>
                    <td className="px-3 py-2">
                      {row.lastContactedAt ? new Date(row.lastContactedAt).toLocaleDateString(locale) : "—"}
                    </td>
                    <td className="px-3 py-2">{row.campaignCount}</td>
                    <td className="px-3 py-2">{copy.statuses[row.leadStatus]}</td>
                    <td className="px-3 py-2">{rowActions(row.leadId, isArchived(lead))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
        <span>{copy.management.pageLabel.replace("{page}", String(page)).replace("{pages}", String(pages))}</span>
        <div className="flex gap-2">
          <button className="rounded border border-slate-700 px-3 py-1 disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} type="button">
            {copy.management.previousPage}
          </button>
          <button className="rounded border border-slate-700 px-3 py-1 disabled:opacity-50" disabled={page >= pages} onClick={() => setPage((current) => Math.min(pages, current + 1))} type="button">
            {copy.management.nextPage}
          </button>
        </div>
      </div>

      {importHistoryOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="w-full max-w-lg rounded-lg border border-slate-700 bg-slate-900 p-4 text-slate-100">
            <h3 className="text-lg font-semibold">{copy.management.importHistory}</h3>
            <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
              {importBatches.length === 0 ? (
                <li className="text-slate-400">{copy.management.noImportHistory}</li>
              ) : (
                importBatches.map((batch) => (
                  <li key={batch.id}>
                    {batch.filename} — {new Date(batch.createdAt).toLocaleString(locale)}
                  </li>
                ))
              )}
            </ul>
            <button className="mt-4 rounded border border-slate-700 px-3 py-1" onClick={() => setImportHistoryOpen(false)} type="button">
              {shared.form.cancel}
            </button>
          </div>
        </div>
      ) : null}

      <CampaignSegmentBuilderDialog
        copy={copy}
        locale={locale}
        onClose={() => setSegmentOpen(false)}
        onCreated={async (campaignId) => {
          notifyDataChanged();
          await onReload();
          setSegmentOpen(false);
          window.location.href = `/${locale}/leadops/campaigns/${campaignId}`;
        }}
        open={segmentOpen}
        previewCounts={segmentPreview?.counts ?? null}
        segmentDefinition={segmentDefinition}
      />
    </section>
  );
}

function FilterSelect({
  allLabel,
  label,
  onChange,
  options,
  value
}: {
  allLabel: string;
  label: string;
  onChange: (value: string) => void;
  options: Array<string | { value: string; label: string }>;
  value: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-400">
      {label}
      <select
        className="rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-2 text-sm text-slate-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">{allLabel}</option>
        {options.map((option) => {
          const optionValue = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.label;
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}
