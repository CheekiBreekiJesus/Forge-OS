import * as XLSX from "xlsx";
import type { ImportFieldMapping } from "@/domain/import-types";
import { applyFieldMapping, detectFieldMapping } from "@/features/leadops/import-mapping";
import {
  collapseWhitespace,
  normalizeEmail,
  normalizePhone,
  normalizeWebsite,
  trimValue
} from "@/features/leadops/import-normalization";
import type { ParsedImportRowInput } from "@/features/leadops/import-deduplication";

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 5000;

const CSV_MIME = ["text/csv", "application/csv", "text/plain"];
const XLSX_MIME = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel"
];

export type SupportedImportFileType = "csv" | "xlsx";

export type ParsedSpreadsheet = {
  headers: string[];
  rows: string[][];
  fileType: SupportedImportFileType;
  detectedMapping: ImportFieldMapping;
};

export function validateImportFile(file: File): string | null {
  if (file.size > MAX_IMPORT_BYTES) {
    return "File exceeds 5 MB limit.";
  }
  const name = file.name.toLowerCase();
  const isCsv = name.endsWith(".csv") || CSV_MIME.includes(file.type);
  const isXlsx = name.endsWith(".xlsx") || XLSX_MIME.includes(file.type);
  if (!isCsv && !isXlsx) {
    return "Only CSV and XLSX files are supported.";
  }
  return null;
}

export function detectFileType(file: File): SupportedImportFileType {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || XLSX_MIME.includes(file.type)) return "xlsx";
  return "csv";
}

export async function parseImportFile(
  file: File,
  mappingOverride?: ImportFieldMapping
): Promise<ParsedSpreadsheet> {
  const fileType = detectFileType(file);
  const buffer = await file.arrayBuffer();
  const spreadsheet =
    fileType === "xlsx" ? parseXlsxBuffer(buffer) : parseCsvText(new TextDecoder().decode(buffer));
  const detectedMapping = mappingOverride
    ? { ...detectFieldMapping(spreadsheet.headers), ...mappingOverride }
    : detectFieldMapping(spreadsheet.headers);
  return { ...spreadsheet, fileType, detectedMapping };
}

export function mapRowsToInput(
  headers: string[],
  rows: string[][],
  mapping: ImportFieldMapping
): ParsedImportRowInput[] {
  return rows.map((row) => {
    const mapped = applyFieldMapping(headers, row, mapping);
    return normalizeRowInput({
      companyName: mapped.companyName,
      contactName: mapped.contactName,
      email: mapped.email,
      phone: mapped.phone,
      website: mapped.website,
      region: mapped.region,
      country: mapped.country || "Portugal",
      industry: mapped.industry,
      notes: mapped.notes,
      sourceDatabase: mapped.sourceDatabase,
      status: mapped.status,
      language: mapped.language || "pt-PT"
    });
  });
}

export function normalizeRowInput(row: ParsedImportRowInput): ParsedImportRowInput {
  const phone = normalizePhone(row.phone);
  const website = normalizeWebsite(row.website);
  return {
    companyName: collapseWhitespace(row.companyName),
    contactName: collapseWhitespace(row.contactName),
    email: normalizeEmail(row.email),
    phone: phone.display,
    website: website.display ?? "",
    region: collapseWhitespace(row.region),
    country: collapseWhitespace(row.country) || "Portugal",
    industry: collapseWhitespace(row.industry),
    notes: trimValue(row.notes),
    sourceDatabase: collapseWhitespace(row.sourceDatabase),
    status: collapseWhitespace(row.status),
    language: collapseWhitespace(row.language) || "pt-PT"
  };
}

function parseCsvText(csv: string): { headers: string[]; rows: string[][] } {
  const parsed = parseCsv(csv);
  const headers = parsed[0]?.map((cell) => trimValue(cell)) ?? [];
  const rows = parsed
    .slice(1)
    .filter((row) => row.some((cell) => trimValue(cell).length > 0))
    .map((row) => row.map((cell) => trimValue(cell)));
  return { headers, rows };
}

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      currentCell += "\"";
      index += 1;
      continue;
    }

    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell);
  rows.push(currentRow);
  return rows;
}


function parseXlsxBuffer(buffer: ArrayBuffer): { headers: string[]; rows: string[][] } {
  const workbook = XLSX.read(buffer, { type: "array", cellFormula: false, cellHTML: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { headers: [], rows: [] };
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    raw: false,
    defval: ""
  });
  if (matrix.length === 0) return { headers: [], rows: [] };
  const headers = (matrix[0] ?? []).map((cell) => trimValue(String(cell ?? "")));
  const rows = matrix
    .slice(1)
    .filter((row) => row.some((cell) => trimValue(String(cell ?? "")).length > 0))
    .map((row) => headers.map((_, index) => trimValue(String(row[index] ?? ""))));
  return { headers, rows };
}

export { parseCsvText, parseCsv };
