import type ExcelJS from "exceljs";

export const MAX_SPREADSHEET_BYTES = 5 * 1024 * 1024;
export const MAX_SPREADSHEET_ROWS = 5000;
export const MAX_SPREADSHEET_SHEETS = 100;
export const MAX_SPREADSHEET_COLUMNS = 256;

export type SpreadsheetFormat = "xlsx";

export type SpreadsheetWarningCode =
  | "hidden_sheet"
  | "formula_stored_as_display"
  | "unsupported_macro_workbook"
  | "excessive_columns_truncated";

export type SpreadsheetWarning = {
  code: SpreadsheetWarningCode;
  message: string;
  sheetName?: string;
};

type ExcelJSModule = typeof import("exceljs");

export type LoadedSpreadsheetWorkbook = {
  format: SpreadsheetFormat;
  sheetNames: string[];
  warnings: SpreadsheetWarning[];
  _workbook: ExcelJS.Workbook;
  _excelJs: ExcelJSModule;
};

export type SpreadsheetSheetMatrix = {
  sheetName: string;
  matrix: string[][];
  warnings: SpreadsheetWarning[];
};

export class SpreadsheetParseError extends Error {
  readonly code:
    | "file_too_large"
    | "malformed_archive"
    | "encrypted_workbook"
    | "unsupported_format"
    | "too_many_sheets"
    | "too_many_rows"
    | "too_many_columns"
    | "sheet_not_found"
    | "empty_workbook";

  constructor(
    code: SpreadsheetParseError["code"],
    message: string
  ) {
    super(message);
    this.name = "SpreadsheetParseError";
    this.code = code;
  }
}

let excelJsModulePromise: Promise<ExcelJSModule> | null = null;

export async function loadExcelJsModule(): Promise<ExcelJSModule> {
  if (!excelJsModulePromise) {
    excelJsModulePromise = import("exceljs").catch((error: unknown) => {
      excelJsModulePromise = null;
      throw error instanceof Error ? error : new Error("Failed to load spreadsheet parser.");
    });
  }
  return excelJsModulePromise;
}

export function assertSpreadsheetByteLimit(byteLength: number): void {
  if (byteLength > MAX_SPREADSHEET_BYTES) {
    throw new SpreadsheetParseError("file_too_large", "File exceeds 5 MB limit.");
  }
}

export async function loadSpreadsheetWorkbook(
  buffer: ArrayBuffer,
  format: SpreadsheetFormat = "xlsx"
): Promise<LoadedSpreadsheetWorkbook> {
  assertSpreadsheetByteLimit(buffer.byteLength);
  if (format !== "xlsx") {
    throw new SpreadsheetParseError("unsupported_format", "Only XLSX workbooks are supported.");
  }

  const ExcelJSImport = await loadExcelJsModule();
  const workbook = new ExcelJSImport.Workbook();
  const warnings: SpreadsheetWarning[] = [];

  try {
    // ExcelJS typings target Node Buffer; Uint8Array is supported at runtime in browser and Node.
    await workbook.xlsx.load(new Uint8Array(buffer) as never);
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("password") || message.includes("encrypt")) {
      throw new SpreadsheetParseError(
        "encrypted_workbook",
        "Encrypted workbooks are not supported."
      );
    }
    throw new SpreadsheetParseError(
      "malformed_archive",
      "The workbook could not be parsed."
    );
  }

  if (workbook.worksheets.length === 0) {
    throw new SpreadsheetParseError("empty_workbook", "The workbook contains no worksheets.");
  }

  if (workbook.worksheets.length > MAX_SPREADSHEET_SHEETS) {
    throw new SpreadsheetParseError(
      "too_many_sheets",
      `Workbook exceeds ${MAX_SPREADSHEET_SHEETS} worksheets.`
    );
  }

  const sheetNames: string[] = [];
  for (const worksheet of workbook.worksheets) {
    const name = worksheet.name?.trim();
    if (!name) continue;
    sheetNames.push(name);
    if (worksheet.state === "hidden" || worksheet.state === "veryHidden") {
      warnings.push({
        code: "hidden_sheet",
        message: `Worksheet "${name}" is hidden.`,
        sheetName: name
      });
    }
  }

  if (sheetNames.length === 0) {
    throw new SpreadsheetParseError("empty_workbook", "The workbook contains no named worksheets.");
  }

  return {
    format,
    sheetNames,
    warnings,
    _workbook: workbook,
    _excelJs: ExcelJSImport
  };
}

export function listSpreadsheetSheetNames(workbook: LoadedSpreadsheetWorkbook): string[] {
  return [...workbook.sheetNames];
}

export function pickDefaultSpreadsheetSheet(
  workbook: LoadedSpreadsheetWorkbook,
  sheetNames: string[] = workbook.sheetNames
): string {
  let bestName = sheetNames[0] ?? "";
  let bestRows = -1;
  for (const name of sheetNames) {
    const matrix = extractSheetMatrix(workbook, name, { rowLimit: MAX_SPREADSHEET_ROWS }).matrix;
    const rowCount = matrix
      .slice(1)
      .filter((row) => row.some((cell) => cell.trim().length > 0)).length;
    if (rowCount > bestRows) {
      bestRows = rowCount;
      bestName = name;
    }
  }
  return bestName;
}

export function extractSheetMatrix(
  workbook: LoadedSpreadsheetWorkbook,
  sheetName: string,
  options: { rowLimit?: number } = {}
): SpreadsheetSheetMatrix {
  const rowLimit = options.rowLimit ?? MAX_SPREADSHEET_ROWS;
  const worksheet = workbook._workbook.getWorksheet(sheetName);
  if (!worksheet) {
    throw new SpreadsheetParseError("sheet_not_found", `Worksheet "${sheetName}" was not found.`);
  }

  const totalRows = worksheet.rowCount ?? 0;
  if (totalRows > rowLimit + 1) {
    throw new SpreadsheetParseError(
      "too_many_rows",
      `Worksheet exceeds ${MAX_SPREADSHEET_ROWS} rows.`
    );
  }

  const warnings = [...workbook.warnings];
  const matrix: string[][] = [];
  let formulaCount = 0;
  let maxColumnCount = 0;
  const { ValueType } = workbook._excelJs;

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber > rowLimit + 1) {
      return;
    }

    let lastColumn = 0;
    row.eachCell({ includeEmpty: false }, (_cell, columnNumber) => {
      lastColumn = Math.max(lastColumn, columnNumber);
    });
    const boundedColumns = Math.min(lastColumn, MAX_SPREADSHEET_COLUMNS);
    maxColumnCount = Math.max(maxColumnCount, lastColumn);

    const values: string[] = [];
    for (let columnIndex = 1; columnIndex <= boundedColumns; columnIndex += 1) {
      const cell = row.getCell(columnIndex);
      const display = formatCellForDisplay(cell, workbook._excelJs);
      if (cell.type === ValueType.Formula) {
        formulaCount += 1;
      }
      values.push(display);
    }

    matrix.push(values);
  });

  const dataRowCount = Math.max(0, matrix.length - 1);
  if (dataRowCount > rowLimit) {
    throw new SpreadsheetParseError(
      "too_many_rows",
      `Worksheet exceeds ${MAX_SPREADSHEET_ROWS} rows.`
    );
  }

  if (maxColumnCount > MAX_SPREADSHEET_COLUMNS) {
    warnings.push({
      code: "excessive_columns_truncated",
      message: `Worksheet columns were bounded to ${MAX_SPREADSHEET_COLUMNS}.`,
      sheetName
    });
  }

  if (formulaCount > 0) {
    warnings.push({
      code: "formula_stored_as_display",
      message: `${formulaCount} formula cell(s) were read as displayed values only.`,
      sheetName
    });
  }

  return {
    sheetName,
    matrix,
    warnings
  };
}

function formatCellForDisplay(cell: ExcelJS.Cell, excelJs: ExcelJSModule): string {
  if (cell.value === null || cell.value === undefined) {
    return "";
  }

  const { ValueType } = excelJs;

  switch (cell.type) {
    case ValueType.Null:
      return "";
    case ValueType.Merge:
      return cell.text?.trim() ?? "";
    case ValueType.Formula: {
      const displayed = cell.text?.trim();
      if (displayed && displayed.length > 0) {
        return displayed;
      }
      return formatPrimitiveValue(cell.result);
    }
    case ValueType.Hyperlink: {
      const hyperlink = cell.value as ExcelJS.CellHyperlinkValue;
      return String(hyperlink.text ?? hyperlink.hyperlink ?? "").trim();
    }
    case ValueType.RichText: {
      const richText = cell.value as ExcelJS.CellRichTextValue;
      return richText.richText.map((part) => part.text).join("").trim();
    }
    case ValueType.Date:
      return cell.text?.trim() ?? formatPrimitiveValue(cell.value);
    case ValueType.Error:
      return "";
    case ValueType.String:
    case ValueType.Number:
    case ValueType.Boolean:
    case ValueType.SharedString:
    default:
      if (cell.text && cell.text.trim().length > 0) {
        return cell.text.trim();
      }
      return formatPrimitiveValue(cell.value);
  }
}

function formatPrimitiveValue(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "object") {
    if ("formula" in value) {
      return String(value.result ?? "").trim();
    }
    if ("text" in value && typeof value.text === "string") {
      return value.text.trim();
    }
    return "";
  }
  return String(value).trim();
}

export function isSpreadsheetPrototypePollutionKey(key: string): boolean {
  return key === "__proto__" || key === "prototype" || key === "constructor";
}

export function safeObjectFromRow(headers: string[], row: string[]): Record<string, string> {
  const record: Record<string, string> = Object.create(null) as Record<string, string>;
  headers.forEach((header, index) => {
    if (isSpreadsheetPrototypePollutionKey(header)) return;
    record[header] = row[index] ?? "";
  });
  return record;
}
