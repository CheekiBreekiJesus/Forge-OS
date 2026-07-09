/** Escape CSV cell values to prevent formula injection in exported error reports. */
export function escapeCsvCell(value: string): string {
  const normalized = value.replace(/\r?\n/g, " ").trim();
  const dangerousPrefix = /^[=+\-@\t\r]/;
  const safeValue = dangerousPrefix.test(normalized) ? `'${normalized}` : normalized;
  if (/[",]/.test(safeValue)) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }
  return safeValue;
}

export function buildErrorReportCsv(
  headers: string[],
  rows: Array<Record<string, string>>
): string {
  const lines = [headers.map(escapeCsvCell).join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvCell(row[header] ?? "")).join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}

export function errorReportRowsFromImport(
  issues: Array<{
    sourceRowNumber: number;
    severity: string;
    code: string;
    message: string;
    fieldKey?: string | null;
    internalReference?: string;
  }>
): Array<Record<string, string>> {
  return issues.map((issue) => ({
    row: String(issue.sourceRowNumber),
    severity: issue.severity,
    code: issue.code,
    field: issue.fieldKey ?? "",
    reference: issue.internalReference ?? "",
    message: issue.message
  }));
}
