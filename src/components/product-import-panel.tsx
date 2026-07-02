"use client";

import { useMemo, useState } from "react";
import { panelClass } from "@/components/app-frame";
import { parseProductSpreadsheet, validateImportFile, type ProductImportResult } from "@/features/products/import";
import { readSpreadsheetFile } from "@/features/products/spreadsheet-parser";
import type { Dictionary } from "@/i18n/dictionaries";

type ProductImportPanelProps = {
  dictionary: Dictionary;
};

export function ProductImportPanel({ dictionary }: ProductImportPanelProps) {
  const copy = dictionary.productCatalog.import;
  const [importResult, setImportResult] = useState<ProductImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const previewRows = useMemo(() => {
    if (!importResult) {
      return [];
    }

    return [...importResult.validRows, ...importResult.reviewRows, ...importResult.invalidRows].slice(0, 25);
  }, [importResult]);

  const selectedRow = previewRows.find((row) => `${row.sourceFile}:${row.rowNumber}` === selectedRowId) ?? null;

  async function handleFileImport(file: File | null) {
    setImportResult(null);
    setErrorMessage(null);
    setSelectedRowId(null);

    if (!file) {
      return;
    }

    const validationError = validateImportFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setLoading(true);
    try {
      const matrix = await readSpreadsheetFile(file);
      setImportResult(parseProductSpreadsheet(matrix, file.name));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : copy.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={`${panelClass} mb-4 p-5`}>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">{copy.eyebrow}</p>
        <h2 className="text-lg font-semibold text-slate-100">{copy.title}</h2>
        <p className="max-w-3xl text-sm text-slate-400">{copy.description}</p>
        <p className="text-xs text-amber-200">{copy.stagingOnlyNotice}</p>
      </div>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="max-w-2xl text-sm text-slate-400">{copy.supportedFormats}</p>
        <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-800">
          {loading ? copy.loading : copy.chooseFile}
          <input
            accept=".csv,.tsv,.xlsx,.html,.htm,text/csv,text/tab-separated-values,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/html"
            className="sr-only"
            onChange={(event) => void handleFileImport(event.target.files?.[0] ?? null)}
            type="file"
          />
        </label>
      </div>

      {errorMessage ? <p className="mt-4 text-sm text-rose-300">{errorMessage}</p> : null}

      {importResult ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ImportMetric label={copy.metrics.validRows} value={importResult.metrics.validCount} />
            <ImportMetric label={copy.metrics.reviewRows} value={importResult.metrics.reviewCount} />
            <ImportMetric label={copy.metrics.invalidRows} value={importResult.metrics.invalidCount} />
            <ImportMetric label={copy.metrics.duplicateCodes} value={importResult.metrics.duplicateCodeCount} />
            <ImportMetric label={copy.metrics.missingBarcode} value={importResult.metrics.missingBarcodeCount} />
            <ImportMetric label={copy.metrics.zeroPurchasePrice} value={importResult.metrics.zeroPurchasePriceCount} />
            <ImportMetric label={copy.metrics.zeroSalePrice} value={importResult.metrics.zeroSalePriceCount} />
            <ImportMetric label={copy.metrics.packagingHints} value={importResult.metrics.packagingHintCount} />
          </div>

          {importResult.excludedInventoryFields.length > 0 ? (
            <p className="text-xs text-slate-400">
              {copy.excludedInventoryFields}: {importResult.excludedInventoryFields.join(", ")}
            </p>
          ) : null}

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-3 py-2">{copy.preview.row}</th>
                  <th className="px-3 py-2">{copy.preview.code}</th>
                  <th className="px-3 py-2">{copy.preview.designation}</th>
                  <th className="px-3 py-2">{copy.preview.salePrice}</th>
                  <th className="px-3 py-2">{copy.preview.status}</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => {
                  const rowId = `${row.sourceFile}:${row.rowNumber}`;
                  return (
                    <tr
                      className="cursor-pointer border-t border-slate-800 hover:bg-slate-900/60"
                      key={rowId}
                      onClick={() => setSelectedRowId(rowId)}
                    >
                      <td className="px-3 py-2">{row.rowNumber}</td>
                      <td className="px-3 py-2 font-mono text-xs">{row.code}</td>
                      <td className="px-3 py-2">{row.designation}</td>
                      <td className="px-3 py-2">{row.salePriceExVat || "—"}</td>
                      <td className="px-3 py-2 capitalize">{row.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selectedRow ? (
            <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
              <h3 className="text-sm font-semibold text-slate-100">{copy.preview.validationTitle}</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {selectedRow.validationMessages.length > 0 ? (
                  selectedRow.validationMessages.map((message) => <li key={message}>{message}</li>)
                ) : (
                  <li>{copy.preview.noValidationIssues}</li>
                )}
              </ul>
            </div>
          ) : null}

          <p className="text-sm text-slate-400">{copy.noPersistNotice}</p>
        </div>
      ) : null}
    </section>
  );
}

function ImportMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-100">{value}</div>
    </div>
  );
}
