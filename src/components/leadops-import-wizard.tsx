"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  buildImportPreview,
  confirmLeadImport,
  type ImportPreviewResult
} from "@/application/lead-import-service";
import { panelClass } from "@/components/app-frame";
import type { ImportMappingProfile, ImportRowStatus } from "@/domain/import-types";
import {
  buildImportErrorExportRows,
  filterImportRowsByView,
  importErrorExportToCsv
} from "@/features/leadops/import-error-export";
import { IMPORT_FIELD_KEYS } from "@/features/leadops/import-mapping";
import { sanitizeFormulaInjection } from "@/features/leadops/import-normalization";
import { usePersistence } from "@/persistence/provider";
import type { Dictionary } from "@/i18n/dictionaries";

type LeadOpsImportWizardProps = {
  copy: Dictionary["leadops"];
  onImportComplete: () => Promise<void>;
};

type WizardStep = "file" | "mapping" | "preview" | "result";
type StatusFilter = ImportRowStatus | "all" | "warnings";

export function LeadOpsImportWizard({ copy, onImportComplete }: LeadOpsImportWizardProps) {
  const { state } = usePersistence();
  const [step, setStep] = useState<WizardStep>("file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [profiles, setProfiles] = useState<ImportMappingProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [selectedSheet, setSelectedSheet] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showNormalized, setShowNormalized] = useState(true);
  const [allowRepeatImport, setAllowRepeatImport] = useState(false);
  const [attachStrongDuplicates, setAttachStrongDuplicates] = useState(false);
  const [approvePossible, setApprovePossible] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<string | null>(null);
  const [saveProfileLabel, setSaveProfileLabel] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  useEffect(() => {
    if (state.status !== "ready") return;
    void state.repos.importMappingProfiles.ensureBuiltins(state.tenantId).then(async () => {
      const loaded = await state.repos.importMappingProfiles.list(state.tenantId);
      setProfiles(loaded);
    });
  }, [state]);

  const filteredRows = useMemo(() => {
    if (!preview) return [];
    return filterImportRowsByView(preview.rows, statusFilter).map((row) => ({
      ...row,
      displayIndex: row.rowIndex + 1
    }));
  }, [preview, statusFilter]);

  async function runPreview(
    file: File,
    overrides?: {
      mappingOverride?: Record<string, string>;
      sheetName?: string;
      mappingProfileId?: string;
    }
  ) {
    if (state.status !== "ready") return;
    setBusy(true);
    setError(null);
    setResultSummary(null);
    try {
      const result = await buildImportPreview(state.repos, state.tenantId, file, {
        mappingOverride: overrides?.mappingOverride ?? mapping,
        sheetName: overrides?.sheetName ?? (selectedSheet || undefined),
        mappingProfileId: overrides?.mappingProfileId ?? (selectedProfileId || undefined)
      });
      setPreview(result);
      setMapping(result.mapping as Record<string, string>);
      if (result.selectedSheet) setSelectedSheet(result.selectedSheet);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.import.failed);
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleFileSelect(file: File | null) {
    if (!file) return;
    setSelectedFile(file);
    setSelectedSheet("");
    setSelectedProfileId("");
    await runPreview(file, { mappingProfileId: "", sheetName: "" });
  }

  async function refreshPreviewWithMapping() {
    if (!selectedFile) return;
    await runPreview(selectedFile);
  }

  async function handleSheetChange(sheetName: string) {
    setSelectedSheet(sheetName);
    if (!selectedFile) return;
    const profile = profiles.find((entry) => entry.id === selectedProfileId);
    const nextMapping = profile ? ({ ...profile.headerMappings } as Record<string, string>) : {};
    setMapping(nextMapping);
    await runPreview(selectedFile, {
      sheetName,
      mappingProfileId: selectedProfileId || undefined,
      mappingOverride: nextMapping
    });
  }

  async function handleProfileChange(profileId: string) {
    setSelectedProfileId(profileId);
    if (!selectedFile) return;
    const profile = profiles.find((entry) => entry.id === profileId);
    const nextMapping = profile ? ({ ...profile.headerMappings } as Record<string, string>) : {};
    setMapping(nextMapping);
    await runPreview(selectedFile, {
      mappingProfileId: profileId || undefined,
      mappingOverride: nextMapping
    });
  }

  async function handleConfirmImport() {
    if (!preview || state.status !== "ready" || confirming) return;
    setConfirming(true);
    setBusy(true);
    setError(null);
    try {
      const result = await confirmLeadImport(state.repos, state.tenantId, preview.batchId, {
        allowRepeatImport,
        attachStrongDuplicates,
        approvePossibleDuplicates: approvePossible
      });
      setResultSummary(
        copy.import.summary
          .replace("{imported}", String(result.importedOrganizations))
          .replace("{skipped}", String(result.skippedRows))
      );
      setStep("result");
      await onImportComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.import.failed);
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  function copyErrorSummary() {
    if (!preview) return;
    const lines = buildImportErrorExportRows(preview.rows).map(
      (row) =>
        `#${row.rowIndex} ${row.companyName}: ${[row.validationErrors, row.warnings].filter(Boolean).join("; ")}`
    );
    void navigator.clipboard.writeText(lines.join("\n"));
  }

  function downloadErrorReport() {
    if (!preview) return;
    const csv = importErrorExportToCsv(buildImportErrorExportRows(preview.rows));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `import-errors-${preview.batchId}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function saveMappingProfile() {
    if (state.status !== "ready" || !saveProfileLabel.trim()) return;
    await state.repos.importMappingProfiles.create(state.tenantId, {
      label: saveProfileLabel.trim(),
      sourceLabel: saveProfileLabel.trim().toLowerCase().replace(/\s+/g, "-"),
      headerMappings: mapping,
      ignoredColumns: [],
      defaultCategory: "General",
      defaultCountry: "Portugal",
      defaultSource: saveProfileLabel.trim(),
      normalizationOptions: {
        preserveLeadingZeros: true,
        defaultCountry: "Portugal",
        defaultLanguage: "pt-PT",
        appendAdditionalEmailsToNotes: true
      }
    });
    const loaded = await state.repos.importMappingProfiles.list(state.tenantId);
    setProfiles(loaded);
    setProfileMessage(copy.import.profileSaved);
    setSaveProfileLabel("");
  }

  async function deleteMappingProfile(profileId: string, label: string) {
    if (state.status !== "ready") return;
    const confirmed = window.confirm(copy.import.deleteProfileConfirm.replace("{label}", label));
    if (!confirmed) return;
    await state.repos.importMappingProfiles.delete(state.tenantId, profileId);
    const loaded = await state.repos.importMappingProfiles.list(state.tenantId);
    setProfiles(loaded);
    if (selectedProfileId === profileId) setSelectedProfileId("");
  }

  function resetWizard() {
    setStep("file");
    setSelectedFile(null);
    setPreview(null);
    setMapping({});
    setSelectedSheet("");
    setSelectedProfileId("");
    setStatusFilter("all");
    setAllowRepeatImport(false);
    setAttachStrongDuplicates(false);
    setApprovePossible(new Set());
    setConfirming(false);
    setError(null);
    setResultSummary(null);
    setProfileMessage(null);
  }

  return (
    <section className={`${panelClass} mb-4 p-5`} data-testid="lead-import-wizard">
      <h2 className="text-lg font-semibold text-slate-100">{copy.sections.import}</h2>
      <p className="mt-2 max-w-3xl text-sm text-slate-400">{copy.import.description}</p>

      {step === "file" ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800">
            {copy.import.chooseFile}
            <input
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              data-testid="lead-import-file-input"
              disabled={busy}
              onChange={(event) => void handleFileSelect(event.target.files?.[0] ?? null)}
              type="file"
            />
          </label>
          <span className="text-xs text-slate-500">{copy.import.fileHint}</span>
        </div>
      ) : null}

      {(step === "mapping" || step === "preview") && preview ? (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-3">
            {preview.availableSheets.length > 1 ? (
              <label className="text-sm text-slate-300">
                {copy.import.selectSheet}
                <select
                  className="ml-2 rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1 text-slate-100"
                  data-testid="lead-import-sheet-select"
                  onChange={(event) => void handleSheetChange(event.target.value)}
                  value={selectedSheet || preview.selectedSheet || ""}
                >
                  {preview.availableSheets.map((sheet) => (
                    <option key={sheet} value={sheet}>
                      {sheet}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="text-sm text-slate-300">
              {copy.import.mappingProfile}
              <select
                className="ml-2 rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1 text-slate-100"
                data-testid="lead-import-profile-select"
                onChange={(event) => void handleProfileChange(event.target.value)}
                value={selectedProfileId}
              >
                <option value="">{copy.import.unmapped}</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <details className="rounded-lg border border-slate-800 p-3" open={step === "mapping"}>
            <summary className="cursor-pointer text-sm font-semibold text-slate-200">
              {copy.import.mappingTitle}
            </summary>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {IMPORT_FIELD_KEYS.map((field) => (
                <label className="flex flex-col gap-1 text-sm text-slate-300" key={field}>
                  {copy.import.fields[field]}
                  <select
                    className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-100"
                    data-testid={`lead-import-mapping-${field}`}
                    onChange={(event) =>
                      setMapping((current) => ({ ...current, [field]: event.target.value }))
                    }
                    value={mapping[field] ?? ""}
                  >
                    <option value="">{copy.import.unmapped}</option>
                    {preview.headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <button
                className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-200"
                disabled={busy}
                onClick={() => void refreshPreviewWithMapping()}
                type="button"
              >
                {copy.import.retryMapping}
              </button>
              <input
                className="rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-1 text-sm text-slate-100"
                onChange={(event) => setSaveProfileLabel(event.target.value)}
                placeholder={copy.import.saveProfilePlaceholder}
                value={saveProfileLabel}
              />
              <button
                className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-200"
                disabled={!saveProfileLabel.trim()}
                onClick={() => void saveMappingProfile()}
                type="button"
              >
                {copy.import.saveProfile}
              </button>
              {profileMessage ? <span className="text-xs text-emerald-300">{profileMessage}</span> : null}
            </div>
            {profiles.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs text-slate-400">
                {profiles.map((profile) => (
                  <li className="flex items-center gap-2" key={profile.id}>
                    <span>{profile.label}</span>
                    <button
                      className="text-red-300"
                      onClick={() => void deleteMappingProfile(profile.id, profile.label)}
                      type="button"
                    >
                      {copy.import.deleteProfile}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </details>

          {preview.repeatImportWarning ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
              {copy.import.repeatImportWarning}
              <label className="mt-2 flex items-center gap-2">
                <input
                  checked={allowRepeatImport}
                  data-testid="lead-import-repeat-confirm"
                  onChange={(event) => setAllowRepeatImport(event.target.checked)}
                  type="checkbox"
                />
                {copy.import.repeatImportConfirm}
              </label>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ImportMetric label={copy.import.totalRows} value={preview.counts.totalRows} />
            <ImportMetric label={copy.import.validRows} testId="import-metric-valid" value={preview.counts.validRows} />
            <ImportMetric label={copy.import.invalidRows} testId="import-metric-invalid" value={preview.counts.invalidRows} />
            <ImportMetric label={copy.import.duplicateRows} testId="import-metric-duplicates" value={preview.counts.duplicateRows} />
            <ImportMetric label={copy.import.possibleDuplicates} value={preview.counts.possibleDuplicateRows} />
            <ImportMetric label={copy.import.missingEmailRows} value={preview.counts.missingEmailRows} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm text-slate-300">
              {copy.import.filterStatus}
              <select
                className="ml-2 rounded-lg border border-slate-700 bg-slate-950/70 px-2 py-1 text-slate-100"
                data-testid="lead-import-status-filter"
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                value={statusFilter}
              >
                <option value="all">{copy.import.filterAll}</option>
                <option value="valid">{copy.import.validRows}</option>
                <option value="invalid">{copy.import.invalidRows}</option>
                <option value="duplicate">{copy.import.duplicateRows}</option>
                <option value="possible_duplicate">{copy.import.possibleDuplicates}</option>
                <option value="missing_email">{copy.import.missingEmailRows}</option>
                <option value="warnings">{copy.import.warningsFilter}</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input checked={showNormalized} onChange={(event) => setShowNormalized(event.target.checked)} type="checkbox" />
              {copy.import.showNormalized}
            </label>
            <button className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-200" onClick={copyErrorSummary} type="button">
              {copy.import.copyErrors}
            </button>
            <button
              className="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-200"
              data-testid="lead-import-download-errors"
              onClick={downloadErrorReport}
              type="button"
            >
              {copy.import.downloadErrors}
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input checked={attachStrongDuplicates} onChange={(event) => setAttachStrongDuplicates(event.target.checked)} type="checkbox" />
            {copy.import.attachStrongDuplicates}
          </label>

          <div className="max-h-72 overflow-auto rounded-lg border border-slate-800">
            <table className="min-w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-900 text-slate-400">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">{copy.table.company}</th>
                  <th className="px-3 py-2">{copy.table.email}</th>
                  <th className="px-3 py-2">{copy.table.status}</th>
                  <th className="px-3 py-2">{copy.import.messages}</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const values = showNormalized ? row.normalizedValues : row.originalValues;
                  return (
                    <tr className="border-t border-slate-800 text-slate-200" key={row.id}>
                      <td className="px-3 py-2">{row.displayIndex}</td>
                      <td className="px-3 py-2">{sanitizeFormulaInjection(values.companyName)}</td>
                      <td className="px-3 py-2">{values.email || "—"}</td>
                      <td className="px-3 py-2">{row.status}</td>
                      <td className="px-3 py-2 text-xs text-slate-400">
                        {[...row.validationErrors, ...row.warnings].join("; ")}
                        {row.status === "possible_duplicate" ? (
                          <label className="ml-2 inline-flex items-center gap-1">
                            <input
                              checked={approvePossible.has(row.rowIndex)}
                              onChange={(event) => {
                                setApprovePossible((current) => {
                                  const next = new Set(current);
                                  if (event.target.checked) next.add(row.rowIndex);
                                  else next.delete(row.rowIndex);
                                  return next;
                                });
                              }}
                              type="checkbox"
                            />
                            {copy.import.approvePossible}
                          </label>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100" onClick={resetWizard} type="button">
              {copy.import.cancel}
            </button>
            <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-100" onClick={() => setStep("mapping")} type="button">
              {copy.import.backToMapping}
            </button>
            <button
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              data-testid="lead-import-confirm"
              disabled={
                busy ||
                confirming ||
                (preview.repeatImportWarning && !allowRepeatImport) ||
                preview.counts.validRows + preview.counts.missingEmailRows === 0
              }
              onClick={() => void handleConfirmImport()}
              type="button"
            >
              {busy ? copy.import.importing : copy.import.confirmImport}
            </button>
          </div>
        </div>
      ) : null}

      {step === "result" && resultSummary ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-emerald-200" data-testid="lead-import-result">
            {resultSummary}
          </p>
          <button className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200" onClick={resetWizard} type="button">
            {copy.import.importAnother}
          </button>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
    </section>
  );
}

function ImportMetric({ label, testId, value }: { label: string; testId?: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3" data-testid={testId}>
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-100">{value}</div>
    </div>
  );
}
