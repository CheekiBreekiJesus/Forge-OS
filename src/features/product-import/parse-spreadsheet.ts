import * as XLSX from "xlsx";
import type { ProductImportSourceType } from "@/domain/product-import-types";

export type ParsedWorksheet = {
  name: string;
  headers: string[];
  rows: string[][];
  hidden: boolean;
  formulaWarnings: number;
};

export type ParsedSpreadsheet = {
  format: "xls" | "xlsx" | "csv";
  worksheets: ParsedWorksheet[];
  filename: string;
};

export type ParseSpreadsheetOptions = {
  filename: string;
  data: ArrayBuffer | string;
};

function cellToDisplayString(cell: XLSX.CellObject | undefined): string {
  if (!cell) return "";
  if (cell.w != null && cell.w !== "") return String(cell.w);
  if (cell.v == null) return "";
  if (cell.t === "n" && typeof cell.v === "number") {
    return Number.isInteger(cell.v) ? String(cell.v) : String(cell.v);
  }
  return String(cell.v);
}

function sheetToRows(sheet: XLSX.WorkSheet): { headers: string[]; rows: string[][]; formulaWarnings: number } {
  const ref = sheet["!ref"];
  if (!ref) return { headers: [], rows: [], formulaWarnings: 0 };

  let formulaWarnings = 0;
  const range = XLSX.utils.decode_range(ref);
  const matrix: string[][] = [];

  for (let r = range.s.r; r <= range.e.r; r++) {
    const row: string[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const address = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[address] as XLSX.CellObject | undefined;
      if (cell?.f) formulaWarnings += 1;
      row.push(cellToDisplayString(cell));
    }
    matrix.push(row);
  }

  if (matrix.length === 0) return { headers: [], rows: [], formulaWarnings: 0 };

  const headerRowIndex = findHeaderRowIndex(matrix);
  const headers = matrix[headerRowIndex].map((cell) => cell.trim());
  const rows = matrix
    .slice(headerRowIndex + 1)
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row) => headers.map((_, index) => row[index] ?? ""));

  return { headers, rows, formulaWarnings };
}

function findHeaderRowIndex(matrix: string[][]): number {
  for (let i = 0; i < Math.min(matrix.length, 10); i++) {
    const nonEmpty = matrix[i].filter((cell) => cell.trim().length > 0).length;
    if (nonEmpty >= 2) return i;
  }
  return 0;
}

function detectFormat(filename: string): "xls" | "xlsx" | "csv" {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".xls") && !lower.endsWith(".xlsx")) return "xls";
  return "xlsx";
}

function parseCsvString(content: string, delimiter?: string): ParsedWorksheet {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const sep = delimiter ?? detectCsvDelimiter(lines[0] ?? "");
  const matrix = lines.map((line) => parseCsvLine(line, sep));
  const headerRowIndex = findHeaderRowIndex(matrix);
  const headers = matrix[headerRowIndex].map((cell) => cell.trim());
  const rows = matrix
    .slice(headerRowIndex + 1)
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row) => headers.map((_, index) => row[index] ?? ""));

  return { formulaWarnings: 0, headers, hidden: false, name: "Sheet1", rows };
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

export function parseSpreadsheet(options: ParseSpreadsheetOptions): ParsedSpreadsheet {
  const format = detectFormat(options.filename);

  if (format === "csv") {
    const content = typeof options.data === "string" ? options.data : new TextDecoder("utf-8").decode(options.data);
    return {
      filename: options.filename,
      format,
      worksheets: [parseCsvString(content)]
    };
  }

  const workbook = XLSX.read(options.data, {
    type: typeof options.data === "string" ? "string" : "array",
    cellDates: false,
    cellFormula: false,
    cellNF: true,
    cellText: true,
    bookVBA: false,
    bookSheets: false,
    password: "",
    WTF: false
  });

  const worksheets: ParsedWorksheet[] = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const hidden = Boolean(sheet?.["!hidden"]);
    const { headers, rows, formulaWarnings } = sheetToRows(sheet);
    return { formulaWarnings, headers, hidden, name, rows };
  });

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
