import type { ImportFieldMapping } from "@/domain/import-types";
import { applyFieldMapping, detectFieldMapping } from "@/features/leadops/import-mapping";
import {
  appendAdditionalEmailsToNotes,
  collapseWhitespace,
  decodeTextBuffer,
  extractPrimaryEmail,
  isPlaceholderValue,
  normalizeEmail,
  normalizePhone,
  normalizeWebsite,
  trimValue
} from "@/features/leadops/import-normalization";
import type { ParsedImportRowInput } from "@/features/leadops/import-deduplication";
import {
  assertSpreadsheetByteLimit,
  extractSheetMatrix,
  listSpreadsheetSheetNames,
  loadSpreadsheetWorkbook,
  MAX_SPREADSHEET_ROWS,
  pickDefaultSpreadsheetSheet,
  SpreadsheetParseError
} from "@/features/shared/spreadsheet/spreadsheet-parser";

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_ROWS = MAX_SPREADSHEET_ROWS;

const CSV_MIME = ["text/csv", "application/csv", "text/plain"];
const XLSX_MIME = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
];
const LEGACY_XLS_EXTENSION = ".xls";

export type SupportedImportFileType = "csv" | "xlsx";

export type ParsedSpreadsheet = {
  headers: string[];
  rows: string[][];
  fileType: SupportedImportFileType;
  detectedMapping: ImportFieldMapping;
  availableSheets: string[];
  selectedSheet: string | null;
  csvDelimiter: "," | ";" | "\t" | null;
  encoding: "utf-8" | "windows-1252" | "binary";
};

export type ParseImportFileOptions = {
  mappingOverride?: ImportFieldMapping;
  sheetName?: string;
  delimiter?: "," | ";" | "\t";
};

export function validateImportFile(file: File): string | null {
  if (file.size > MAX_IMPORT_BYTES) {
    return "File exceeds 5 MB limit.";
  }
  const name = file.name.toLowerCase();
  if (name.endsWith(LEGACY_XLS_EXTENSION)) {
    return "Legacy XLS workbooks are not supported. Export to XLSX or CSV.";
  }
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

export async function listXlsxSheetNames(buffer: ArrayBuffer): Promise<string[]> {
  assertSpreadsheetByteLimit(buffer.byteLength);
  const workbook = await loadSpreadsheetWorkbook(buffer);
  return listSpreadsheetSheetNames(workbook);
}

export async function parseImportFile(
  file: File,
  options: ParseImportFileOptions = {}
): Promise<ParsedSpreadsheet> {
  const fileType = detectFileType(file);
  const buffer = await file.arrayBuffer();
  assertSpreadsheetByteLimit(buffer.byteLength);

  if (fileType === "xlsx") {
    const workbook = await loadSpreadsheetWorkbook(buffer);
    const availableSheets = listSpreadsheetSheetNames(workbook);
    const selectedSheet =
      options.sheetName && availableSheets.includes(options.sheetName)
        ? options.sheetName
        : pickDefaultSpreadsheetSheet(workbook, availableSheets);
    const spreadsheet = parseXlsxBuffer(workbook, selectedSheet);
    const detectedMapping = options.mappingOverride
      ? { ...detectFieldMapping(spreadsheet.headers), ...options.mappingOverride }
      : detectFieldMapping(spreadsheet.headers);
    return {
      ...spreadsheet,
      fileType,
      detectedMapping,
      availableSheets,
      selectedSheet,
      csvDelimiter: null,
      encoding: "binary"
    };
  }

  const { text, encoding } = decodeTextBuffer(buffer);
  const delimiter = options.delimiter ?? detectCsvDelimiter(text);
  const spreadsheet = parseCsvText(text, delimiter);
  const detectedMapping = options.mappingOverride
    ? { ...detectFieldMapping(spreadsheet.headers), ...options.mappingOverride }
    : detectFieldMapping(spreadsheet.headers);
  return {
    ...spreadsheet,
    fileType,
    detectedMapping,
    availableSheets: [],
    selectedSheet: null,
    csvDelimiter: delimiter,
    encoding
  };
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

export function mapRowsWithOriginal(
  headers: string[],
  rows: string[][],
  mapping: ImportFieldMapping
): Array<{ original: ParsedImportRowInput; normalized: ParsedImportRowInput }> {
  return rows.map((row) => {
    const mapped = applyFieldMapping(headers, row, mapping);
    const original = toRowSnapshot(mapped);
    const normalized = normalizeRowInput({
      ...mapped,
      country: mapped.country || "Portugal",
      language: mapped.language || "pt-PT"
    });
    return { original, normalized };
  });
}

function toRowSnapshot(mapped: Record<string, string>): ParsedImportRowInput {
  return {
    companyName: trimValue(mapped.companyName),
    contactName: trimValue(mapped.contactName),
    email: trimValue(mapped.email),
    phone: trimValue(mapped.phone),
    website: trimValue(mapped.website),
    region: trimValue(mapped.region),
    country: trimValue(mapped.country),
    industry: trimValue(mapped.industry),
    notes: trimValue(mapped.notes),
    sourceDatabase: trimValue(mapped.sourceDatabase),
    status: trimValue(mapped.status),
    language: trimValue(mapped.language)
  };
}

export function normalizeRowInput(row: ParsedImportRowInput): ParsedImportRowInput {
  const { primary, additional } = extractPrimaryEmail(row.email);
  const phone = normalizePhone(row.phone);
  const website = normalizeWebsite(row.website);
  const notes = appendAdditionalEmailsToNotes(trimValue(row.notes), additional);

  return {
    companyName: collapseWhitespace(row.companyName),
    contactName: collapseWhitespace(row.contactName),
    email: normalizeEmail(primary),
    phone: phone.display,
    website: website.display ?? "",
    region: collapseWhitespace(row.region),
    country: isPlaceholderValue(row.country) ? "Portugal" : collapseWhitespace(row.country),
    industry: collapseWhitespace(row.industry),
    notes,
    sourceDatabase: collapseWhitespace(row.sourceDatabase),
    status: collapseWhitespace(row.status),
    language: collapseWhitespace(row.language) || "pt-PT"
  };
}

export function detectCsvDelimiter(text: string): "," | ";" | "\t" {
  const sampleLines = text.split(/\r?\n/).filter((line) => line.trim().length > 0).slice(0, 5);
  if (sampleLines.length === 0) return ",";

  let commaScore = 0;
  let semicolonScore = 0;
  let tabScore = 0;

  for (const line of sampleLines) {
    commaScore += countDelimiterOutsideQuotes(line, ",");
    semicolonScore += countDelimiterOutsideQuotes(line, ";");
    tabScore += countDelimiterOutsideQuotes(line, "\t");
  }

  if (semicolonScore > commaScore && semicolonScore >= tabScore) return ";";
  if (tabScore > commaScore && tabScore > semicolonScore) return "\t";
  return ",";
}

function countDelimiterOutsideQuotes(line: string, delimiter: string): number {
  let count = 0;
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && char === delimiter) count += 1;
  }
  return count;
}

function parseCsvText(
  csv: string,
  delimiter: "," | ";" | "\t" = ","
): { headers: string[]; rows: string[][] } {
  const parsed = parseCsv(csv, delimiter);
  const headerRowIndex = findHeaderRowIndex(parsed);
  const headers = dedupeHeaders(parsed[headerRowIndex]?.map((cell) => trimValue(cell)) ?? []);
  const rows = parsed
    .slice(headerRowIndex + 1)
    .filter((row) => row.some((cell) => trimValue(cell).length > 0))
    .map((row) => padRow(row, headers.length).map((cell) => trimValue(cell)));
  return { headers, rows };
}

function findHeaderRowIndex(rows: string[][]): number {
  for (let index = 0; index < Math.min(rows.length, 5); index += 1) {
    const row = rows[index] ?? [];
    const nonEmpty = row.filter((cell) => trimValue(cell).length > 0).length;
    if (nonEmpty >= 2) return index;
  }
  return 0;
}

function dedupeHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((header, index) => {
    const base = header || `Column ${index + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base} (${count + 1})`;
  });
}

function padRow(row: string[], length: number): string[] {
  const padded = [...row];
  while (padded.length < length) padded.push("");
  return padded.slice(0, length);
}

function parseCsv(csv: string, delimiter: "," | ";" | "\t" = ","): string[][] {
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

    if (char === delimiter && !inQuotes) {
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

function parseXlsxBuffer(
  workbook: Awaited<ReturnType<typeof loadSpreadsheetWorkbook>>,
  sheetName: string
): { headers: string[]; rows: string[][] } {
  const resolvedSheet = workbook.sheetNames.includes(sheetName)
    ? sheetName
    : workbook.sheetNames[0];
  if (!resolvedSheet) return { headers: [], rows: [] };

  const { matrix } = extractSheetMatrix(workbook, resolvedSheet);
  if (matrix.length === 0) return { headers: [], rows: [] };

  const headerRowIndex = findHeaderRowIndex(matrix.map((row) => row.map((cell) => trimValue(cell))));
  const rawHeaders = (matrix[headerRowIndex] ?? []).map((cell) => trimValue(cell));
  const headers = dedupeHeaders(rawHeaders);
  const rows = matrix
    .slice(headerRowIndex + 1)
    .filter((row) => row.some((cell) => trimValue(cell).length > 0))
    .map((row) => headers.map((_, index) => trimValue(row[index] ?? "")));
  return { headers, rows };
}

export { parseCsvText, parseCsv, SpreadsheetParseError };
