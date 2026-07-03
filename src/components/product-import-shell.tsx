"use client";

import { ChangeEvent, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { AppFrame } from "@/components/app-frame";
import {
  EmptyState,
  LoadingState,
  PageHeader,
  PrimaryActionButton,
  inputClassName
} from "@/components/crud";
import type { ProductImportBatch, ProductImportRow } from "@/domain/product-import-types";
import { commitApprovedRows, paginateRows, rowsByFilter } from "@/features/product-import/commit";
import { getProductImportCopy } from "@/features/product-import/copy";
import { suggestFieldMapping } from "@/features/product-import/field-mapping";
import {
  buildSuggestedProfile,
  createBatchFromSpreadsheet,
  processAndStageRows
} from "@/features/product-import/pipeline";
import { parseSpreadsheet, type ParsedSpreadsheet } from "@/features/product-import/parse-spreadsheet";
import { useProducts } from "@/persistence/hooks";
import { usePersistence, usePersistenceLoading } from "@/persistence/provider";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

type ProductImportShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

type WizardStep = "file" | "worksheet" | "mapping" | "preview" | "history";

const PAGE_SIZE = 25;

export function ProductImportShell({ dictionary, locale }: ProductImportShellProps) {
  const copy = getProductImportCopy(locale);
  const { tenantId, state, notifyDataChanged } = usePersistence();
  const persistenceLoading = usePersistenceLoading();
  const { products, reload: reloadProducts } = useProducts();

  const [step, setStep] = useState<WizardStep>("file");
  const [busy, setBusy] = useState(false);
  const [parsed, setParsed] = useState<ParsedSpreadsheet | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [worksheetName, setWorksheetName] = useState("");
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [batch, setBatch] = useState<ProductImportBatch | null>(null);
  const [rows, setRows] = useState<ProductImportRow[]>([]);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [batches, setBatches] = useState<ProductImportBatch[]>([]);

  const reloadBatches = useCallback(async () => {
    if (state.status !== "ready") return;
    const list = await state.repos.productImport.batches.list(tenantId);
    setBatches(list);
  }, [state, tenantId]);

  const reloadRows = useCallback(async () => {
    if (state.status !== "ready" || !batch) return;
    const list = await state.repos.productImport.rows.listByBatch(tenantId, batch.id);
    setRows(list);
  }, [state, tenantId, batch]);

  const filteredRows = useMemo(() => {
    const base = filter === "all" ? rows : rowsByFilter(rows, filter);
    return base;
  }, [rows, filter]);

  const pagedRows = useMemo(
    () => paginateRows(filteredRows, page, PAGE_SIZE),
    [filteredRows, page]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || state.status !== "ready") return;
    setBusy(true);
    setMessage(null);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseSpreadsheet({ data: buffer, filename: file.name });
      setParsed(result);
      setFileBuffer(buffer);
      setWorksheetName(result.worksheets.find((ws) => !ws.hidden)?.name ?? result.worksheets[0]?.name ?? "");
      const ws = result.worksheets[0];
      if (ws) {
        setColumnMappings(suggestFieldMapping(ws.headers) as Record<string, string>);
      }
      setStep("worksheet");
    } finally {
      setBusy(false);
    }
  };

  const onRunStaging = async () => {
    if (!parsed || !fileBuffer || !worksheetName || state.status !== "ready" || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const createdBatch = await createBatchFromSpreadsheet(
        tenantId,
        parsed,
        worksheetName,
        fileBuffer,
        state.repos.productImport,
        null
      );
      const profile = buildSuggestedProfile(tenantId, parsed, worksheetName);
      const savedProfile = await state.repos.productImport.mappingProfiles.create(tenantId, profile);
      await state.repos.productImport.batches.update(tenantId, createdBatch.id, {
        mappingProfileId: savedProfile.id
      });
      const updatedBatch = await processAndStageRows(
        tenantId,
        { ...createdBatch, mappingProfileId: savedProfile.id },
        parsed,
        columnMappings as Record<string, import("@/domain/product-import-types").ProductImportFieldKey>,
        products,
        state.repos.productImport
      );
      setBatch(updatedBatch);
      const stagedRows = await state.repos.productImport.rows.listByBatch(tenantId, updatedBatch.id);
      setRows(stagedRows);
      setStep("preview");
      await reloadBatches();
    } finally {
      setBusy(false);
    }
  };

  const onCommit = async () => {
    if (!batch || state.status !== "ready" || busy || selectedRowIds.size === 0) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await commitApprovedRows(
        tenantId,
        batch.id,
        Array.from(selectedRowIds),
        state.repos.products,
        state.repos.productImport,
        null
      );
      setMessage(`${copy.commitSuccess} (${result.committed} ${copy.committed}, ${result.skipped} skipped)`);
      await reloadRows();
      await reloadProducts();
      await reloadBatches();
      notifyDataChanged();
    } finally {
      setBusy(false);
    }
  };

  const toggleRow = (rowId: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  if (persistenceLoading || state.status !== "ready") {
    return (
      <AppFrame activeModule="products" dictionary={dictionary} locale={locale}>
        <LoadingState message="Loading…" />
      </AppFrame>
    );
  }

  return (
    <AppFrame activeModule="products" dictionary={dictionary} locale={locale}>
      <PageHeader
        actions={
          <Link className="text-sm text-forge-accent hover:underline" href={`/${locale}/products`}>
            {copy.backToCatalog}
          </Link>
        }
        description={copy.subtitle}
        title={copy.title}
      />

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {(["file", "worksheet", "mapping", "preview", "history"] as WizardStep[]).map((key) => (
          <button
            key={key}
            className={`rounded-full px-3 py-1 ${step === key ? "bg-forge-accent text-white" : "bg-forge-surface-muted"}`}
            onClick={() => {
              setStep(key);
              if (key === "history") void reloadBatches();
            }}
            type="button"
          >
            {copy.steps[key === "preview" ? "preview" : key === "history" ? "history" : key]}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm text-forge-muted">{copy.noInventory}</p>
      {message ? <p className="mb-4 text-sm text-green-600 dark:text-green-400">{message}</p> : null}

      {step === "file" ? (
        <section className="rounded-lg border border-forge-border p-4">
          <label className="block text-sm font-medium">{copy.selectFile}</label>
          <input
            accept=".xls,.xlsx,.csv"
            className={`${inputClassName} mt-2`}
            data-testid="product-import-file"
            disabled={busy}
            onChange={onFileChange}
            type="file"
          />
        </section>
      ) : null}

      {step === "worksheet" && parsed ? (
        <section className="space-y-4 rounded-lg border border-forge-border p-4">
          <label className="block text-sm font-medium">{copy.selectWorksheet}</label>
          <select
            className={inputClassName}
            data-testid="product-import-worksheet"
            onChange={(e) => {
              setWorksheetName(e.target.value);
              const ws = parsed.worksheets.find((w) => w.name === e.target.value);
              if (ws) setColumnMappings(suggestFieldMapping(ws.headers) as Record<string, string>);
            }}
            value={worksheetName}
          >
            {parsed.worksheets.map((ws) => (
              <option key={ws.name} value={ws.name}>
                {ws.name} ({ws.rows.length} {copy.rows}){ws.hidden ? " [hidden]" : ""}
              </option>
            ))}
          </select>
          <PrimaryActionButton
            data-testid="product-import-continue-mapping"
            disabled={busy}
            onClick={() => setStep("mapping")}
            type="button"
          >
            {copy.steps.mapping}
          </PrimaryActionButton>
        </section>
      ) : null}

      {step === "mapping" && parsed ? (
        <section className="space-y-4 rounded-lg border border-forge-border p-4">
          <p className="text-sm text-forge-muted">{copy.formulaWarning}</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="p-2 text-left">Source column</th>
                  <th className="p-2 text-left">Maps to</th>
                </tr>
              </thead>
              <tbody>
                {(parsed.worksheets.find((w) => w.name === worksheetName)?.headers ?? []).map((header) => (
                  <tr key={header}>
                    <td className="p-2">{header}</td>
                    <td className="p-2">
                      <select
                        className={inputClassName}
                        data-testid={`mapping-${header}`}
                        onChange={(e) =>
                          setColumnMappings((prev) => {
                            const next = { ...prev };
                            if (e.target.value) next[header] = e.target.value;
                            else delete next[header];
                            return next;
                          })
                        }
                        value={columnMappings[header] ?? ""}
                      >
                        <option value="">—</option>
                        {Object.keys(columnMappings).length > 0
                          ? Array.from(new Set(Object.values(columnMappings))).map((field) => (
                              <option key={field} value={field}>
                                {field}
                              </option>
                            ))
                          : null}
                        {["internalReference", "description", "salePrice", "barcode", "category", "baseUnit"].map(
                          (field) => (
                            <option key={field} value={field}>
                              {field}
                            </option>
                          )
                        )}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PrimaryActionButton
            data-testid="product-import-stage"
            disabled={busy}
            onClick={() => void onRunStaging()}
            type="button"
          >
            {busy ? copy.doubleSubmit : copy.runStaging}
          </PrimaryActionButton>
        </section>
      ) : null}

      {step === "preview" && batch ? (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              ["all", copy.filterAll],
              ["valid", copy.filterValid],
              ["warnings", copy.filterWarnings],
              ["invalid", copy.filterInvalid],
              ["duplicates", copy.filterDuplicates],
              ["conflicts", copy.filterConflicts],
              ["missing_reference", copy.filterMissingReference],
              ["missing_price", copy.filterMissingPrice],
              ["missing_barcode", copy.filterMissingBarcode]
            ].map(([id, label]) => (
              <button
                key={id}
                className={`rounded-full px-3 py-1 text-sm ${filter === id ? "bg-forge-accent text-white" : "bg-forge-surface-muted"}`}
                onClick={() => {
                  setFilter(id);
                  setPage(1);
                }}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-sm">
            {copy.selected}: {selectedRowIds.size} · Batch {batch.filename} / {batch.worksheet} · {batch.validRows}{" "}
            valid · {batch.conflictRows} conflicts
          </p>
          <div className="overflow-x-auto rounded-lg border border-forge-border">
            <table className="min-w-full text-sm" data-testid="product-import-preview-table">
              <thead>
                <tr className="bg-forge-surface-muted">
                  <th className="p-2" />
                  <th className="p-2 text-left">{copy.row}</th>
                  <th className="p-2 text-left">{copy.reference}</th>
                  <th className="p-2 text-left">{copy.description}</th>
                  <th className="p-2 text-left">{copy.status}</th>
                  <th className="p-2 text-left">{copy.action}</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row) => (
                  <tr key={row.id} className="border-t border-forge-border">
                    <td className="p-2">
                      <input
                        checked={selectedRowIds.has(row.id)}
                        data-testid={`select-row-${row.sourceRowNumber}`}
                        onChange={() => toggleRow(row.id)}
                        type="checkbox"
                      />
                    </td>
                    <td className="p-2">{row.sourceRowNumber}</td>
                    <td className="p-2">{row.normalizedValues.internalReference ?? "—"}</td>
                    <td className="p-2 max-w-xs truncate">{row.normalizedValues.description ?? "—"}</td>
                    <td className="p-2">{row.status}</td>
                    <td className="p-2">{row.proposedAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">
              ←
            </button>
            <span>
              {copy.page} {page} {copy.of} {totalPages}
            </span>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} type="button">
              →
            </button>
          </div>
          <PrimaryActionButton
            data-testid="product-import-commit"
            disabled={busy || selectedRowIds.size === 0}
            onClick={() => void onCommit()}
            type="button"
          >
            {busy ? copy.doubleSubmit : copy.commitSelected}
          </PrimaryActionButton>
        </section>
      ) : null}

      {step === "history" ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{copy.importHistory}</h2>
          {batches.length === 0 ? (
            <EmptyState description="No imports yet." title={copy.importHistory} />
          ) : (
            batches.map((item) => (
              <article
                key={item.id}
                className="rounded-lg border border-forge-border p-3 text-sm"
                data-testid="import-history-item"
              >
                <p className="font-medium">{item.sourceLabel}</p>
                <p className="text-forge-muted">
                  {item.totalRows} {copy.rows} · {item.committedRows} {copy.committed} · {item.stagedRows}{" "}
                  {copy.staged} · {item.status}
                </p>
              </article>
            ))
          )}
        </section>
      ) : null}
    </AppFrame>
  );
}
