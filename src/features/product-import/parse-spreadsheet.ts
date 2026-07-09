import type { ProductImportSourceType } from "@/domain/product-import-types";
import {
  assertSpreadsheetByteLimit,
  extractSheetMatrix,
  listSpreadsheetSheetNames,
  loadSpreadsheetWorkbook,
  pickDefaultSpreadsheetSheet,
  SpreadsheetParseError
} from "@/features/shared/spreadsheet/spreadsheet-parser";

export type ParsedWorksheet = {
  name: string;
  headers: string[];
  rows: string[][];
  hidden: boolean;
  formulaWarnings: number;
};

export type ParsedSpreadsheet = {
  format: "xlsx" | "csv";
  worksheets: ParsedWorksheet[];
  filename: string;
};

export type ParseSpreadsheetOptions = {
  filename: string;
  data: ArrayBuffer | string;
};

function findHeaderRowIndex(matrix: string[][]): number {
  for (let i = 0; i < Math.min(matrix.length, 10); i++) {
    const nonEmpty = matrix[i].filter((cell) => cell.trim().length > 0).length;
    if (nonEmpty >= 2) return i;
  }
  return 0;
}

function matrixToWorksheet(name: string, matrix: string[][], formulaWarnings = 0): ParsedWorksheet {
  if (matrix.length === 0) {
    return { formulaWarnings, headers: [], hidden: false, name, rows: [] };
  }

  const headerRowIndex = findHeaderRowIndex(matrix);
  const headers = matrix[headerRowIndex].map((cell) => cell.trim());
  const rows = matrix
    .slice(headerRowIndex + 1)
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row) => headers.map((_, index) => row[index] ?? ""));

  return { formulaWarnings, headers, hidden: false, name, rows };
}

function detectFormat(filename: string): "xlsx" | "csv" {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".xls") && !lower.endsWith(".xlsx")) {
    throw new SpreadsheetParseError("unsupported_format", "Legacy .xls workbooks are not supported.");
  }
  return "xlsx";
}

function parseCsvString(content: string, delimiter?: string): ParsedWorksheet {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const sep = delimiter ?? detectCsvDelimiter(lines[0] ?? "");
  const matrix = lines.map((line) => parseCsvLine(line, sep));
  return matrixToWorksheet("Sheet1", matrix);
}

function detectCsvDelimiter(line: string): string {
  const semicolons = (line.match(/;/g) ?? []).length;
  const commas = (line.match(/,/g) ?? []).length;
  return semicolons >= commas ? ";" : ",";
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current);
  return cells;
}

export async function parseSpreadsheet(options: ParseSpreadsheetOptions): Promise<ParsedSpreadsheet> {
  const format = detectFormat(options.filename);

  if (format === "csv") {
    const content =
      typeof options.data === "string" ? options.data : new TextDecoder("utf-8").decode(options.data);
    return {
      filename: options.filename,
      format,
      worksheets: [parseCsvString(content)]
    };
  }

  const bytes =
    typeof options.data === "string"
      ? new TextEncoder().encode(options.data)
      : new Uint8Array(options.data);
  assertSpreadsheetByteLimit(bytes.byteLength);

  const workbook = await loadSpreadsheetWorkbook(bytes.buffer as ArrayBuffer, "xlsx");
  const sheetNames = listSpreadsheetSheetNames(workbook);
  const worksheets: ParsedWorksheet[] = [];

  for (const name of sheetNames) {
    const extracted = extractSheetMatrix(workbook, name);
    const formulaWarnings = extracted.warnings.filter((warning) =>
      warning.code === "formula_stored_as_display"
    ).length;
    const hidden = extracted.warnings.some((warning) => warning.code === "hidden_sheet");
    const worksheet = matrixToWorksheet(name, extracted.matrix, formulaWarnings);
    worksheets.push({ ...worksheet, hidden });
  }

  if (worksheets.length === 0) {
    const defaultSheet = pickDefaultSpreadsheetSheet(workbook);
    const extracted = extractSheetMatrix(workbook, defaultSheet);
    worksheets.push(matrixToWorksheet(defaultSheet, extracted.matrix));
  }

  return { filename: options.filename, format, worksheets };
}

export function inferSourceType(filename: string, worksheet: string): ProductImportSourceType {
  const combined = `${filename} ${worksheet}`.toLowerCase();
  if (combined.includes("curated") || combined.includes("catalog") || combined.includes("products_import")) {
    return "curated_workbook";
  }
  if (combined.includes("artigos") || combined.includes("invoice") || combined.includes("xd_articles")) {
    return "invoice_export";
  }
  if (combined.includes(".csv")) return "csv_export";
  return "unknown";
}

export async function fingerprintFile(data: ArrayBuffer): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  let hash = 0;
  const bytes = new Uint8Array(data);
  for (let i = 0; i < bytes.length; i++) {
    hash = (hash * 31 + bytes[i]) >>> 0;
  }
  return `fallback-${hash.toString(16)}`;
}
