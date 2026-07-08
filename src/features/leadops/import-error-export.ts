import type { ImportRow, ImportRowStatus } from "@/domain/import-types";
import { sanitizeFormulaInjection } from "@/features/leadops/import-normalization";

export type ImportErrorExportRow = {
  rowIndex: number;
  status: ImportRowStatus;
  companyName: string;
  email: string;
  validationErrors: string;
  warnings: string;
  originalEmail: string;
  normalizedEmail: string;
};

export function buildImportErrorExportRows(rows: ImportRow[]): ImportErrorExportRow[] {
  return rows.map((row) => ({
    rowIndex: row.rowIndex + 1,
    status: row.status,
    companyName: sanitizeFormulaInjection(row.normalizedValues.companyName),
    email: sanitizeFormulaInjection(row.normalizedValues.email),
    validationErrors: row.validationErrors.join("; "),
    warnings: row.warnings.join("; "),
    originalEmail: sanitizeFormulaInjection(row.originalValues.email),
    normalizedEmail: sanitizeFormulaInjection(row.normalizedValues.email)
  }));
}

export function importErrorExportToCsv(rows: ImportErrorExportRow[]): string {
  const headers = [
    "row_index",
    "status",
    "company_name",
    "email",
    "validation_errors",
    "warnings",
    "original_email",
    "normalized_email"
  ];
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.rowIndex,
        row.status,
        row.companyName,
        row.email,
        row.validationErrors,
        row.warnings,
        row.originalEmail,
        row.normalizedEmail
      ]
        .map(csvEscape)
        .join(",")
    );
  }
  return lines.join("\n");
}

function csvEscape(value: string | number): string {
  const text = String(value ?? "");
  const safe = sanitizeFormulaInjection(text);
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function filterImportRowsByView(
  rows: ImportRow[],
  view: ImportRowStatus | "all" | "warnings"
): ImportRow[] {
  if (view === "all") return rows;
  if (view === "warnings") {
    return rows.filter((row) => row.warnings.length > 0);
  }
  return rows.filter((row) => row.status === view);
}
