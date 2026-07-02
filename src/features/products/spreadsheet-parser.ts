import { normalizeHeader } from "@/features/products/locale";

export type SpreadsheetMatrix = string[][];

const htmlRowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
const htmlCellPattern = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
const tagPattern = /<[^>]+>/g;

export async function readSpreadsheetFile(file: File): Promise<SpreadsheetMatrix> {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();

  if (extension === ".csv" || extension === ".tsv") {
    const text = await file.text();
    const delimiter = extension === ".tsv" ? "\t" : detectDelimiter(text);
    return parseDelimitedText(text, delimiter);
  }

  if (extension === ".html" || extension === ".htm") {
    const text = await file.text();
    return parseHtmlTable(text);
  }

  if (extension === ".xlsx" || extension === ".xls") {
    return parseExcelFile(file);
  }

  throw new Error("Unsupported file type.");
}

export function detectDelimiter(text: string): ";" | "," | "\t" {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const counts = {
    ";": (firstLine.match(/;/g) ?? []).length,
    ",": (firstLine.match(/,/g) ?? []).length,
    "\t": (firstLine.match(/\t/g) ?? []).length
  };

  if (counts[";"] >= counts[","] && counts[";"] >= counts["\t"]) {
    return ";";
  }

  if (counts["\t"] >= counts[","]) {
    return "\t";
  }

  return ",";
}

export function parseDelimitedText(text: string, delimiter: ";" | "," | "\t"): SpreadsheetMatrix {
  return parseCsvRows(text, delimiter).filter((row) => row.some((cell) => cell.trim().length > 0));
}

export function parseHtmlTable(html: string): SpreadsheetMatrix {
  const rows: SpreadsheetMatrix = [];

  for (const rowMatch of html.matchAll(htmlRowPattern)) {
    const cells: string[] = [];
    for (const cellMatch of rowMatch[1].matchAll(htmlCellPattern)) {
      const text = cellMatch[1]
        .replace(tagPattern, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      cells.push(text);
    }

    if (cells.some((cell) => cell.length > 0)) {
      rows.push(cells);
    }
  }

  return rows;
}

async function parseExcelFile(file: File): Promise<SpreadsheetMatrix> {
  const buffer = await file.arrayBuffer();

  if (file.name.toLowerCase().endsWith(".xlsx")) {
    return parseXlsxBuffer(buffer);
  }

  if (file.name.toLowerCase().endsWith(".xls")) {
    throw new Error("Legacy .xls files require the Python data-preparation pipeline.");
  }

  throw new Error("Unsupported Excel file type.");
}

async function parseXlsxBuffer(buffer: ArrayBuffer): Promise<SpreadsheetMatrix> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    raw: false,
    defval: ""
  });

  return rows.map((row) => row.map((cell) => String(cell ?? "").trim()));
}

function parseCsvRows(text: string, delimiter: string): SpreadsheetMatrix {
  const rows: SpreadsheetMatrix = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      row.push(current);
      current = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows;
}

export function matrixToRecords(matrix: SpreadsheetMatrix): Array<Record<string, string>> {
  if (matrix.length === 0) {
    return [];
  }

  const headers = matrix[0].map(normalizeHeader);
  return matrix.slice(1).map((row, rowIndex) => {
    const record: Record<string, string> = { __row: String(rowIndex + 2) };
    headers.forEach((header, index) => {
      record[header] = (row[index] ?? "").trim();
    });
    return record;
  });
}
