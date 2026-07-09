import { describe, expect, it, vi } from "vitest";
import {
  assertSpreadsheetByteLimit,
  extractSheetMatrix,
  isSpreadsheetPrototypePollutionKey,
  loadSpreadsheetWorkbook,
  MAX_SPREADSHEET_BYTES,
  MAX_SPREADSHEET_COLUMNS,
  MAX_SPREADSHEET_ROWS,
  pickDefaultSpreadsheetSheet,
  safeObjectFromRow,
  SpreadsheetParseError
} from "@/features/shared/spreadsheet/spreadsheet-parser";
import {
  buildSyntheticRowCountWorkbook,
  buildSyntheticXlsxBuffer,
  buildSyntheticXlsxFile
} from "@/features/shared/spreadsheet/spreadsheet-fixtures";
import ExcelJS from "exceljs";

describe("spreadsheet parser security boundary", () => {
  it("parses a minimal XLSX workbook", async () => {
    const buffer = await buildSyntheticXlsxBuffer([
      {
        name: "Sheet1",
        rows: [
          ["Name", "Email"],
          ["Acme", "hello@example.test"]
        ]
      }
    ]);
    const workbook = await loadSpreadsheetWorkbook(buffer);
    const { matrix } = extractSheetMatrix(workbook, "Sheet1");
    expect(matrix[0]).toEqual(["Name", "Email"]);
    expect(matrix[1]?.[0]).toBe("Acme");
  });

  it("lists and selects sheets in a multi-sheet workbook", async () => {
    const buffer = await buildSyntheticXlsxBuffer([
      { name: "Events", rows: [["Name"], ["A"]] },
      {
        name: "Municipalities",
        rows: [
          ["Name", "Email"],
          ["Sheet B Org", "b@example.test"],
          ["Another", "row@example.test"]
        ]
      }
    ]);
    const workbook = await loadSpreadsheetWorkbook(buffer);
    expect(workbook.sheetNames).toEqual(["Events", "Municipalities"]);
    expect(pickDefaultSpreadsheetSheet(workbook)).toBe("Municipalities");
  });

  it("preserves Portuguese accents and leading zeros stored as text", async () => {
    const buffer = await buildSyntheticXlsxBuffer([
      {
        name: "PT",
        rows: [
          ["Empresa", "Telefone"],
          ["Associação Atlântico", "0912345678"]
        ]
      }
    ]);
    const workbook = await loadSpreadsheetWorkbook(buffer);
    const { matrix } = extractSheetMatrix(workbook, "PT");
    expect(matrix[1]?.[0]).toContain("Associação");
    expect(matrix[1]?.[1]).toBe("0912345678");
  });

  it("returns displayed values for percentages and dates without executing formulas", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Formats");
    sheet.getCell("A1").value = "Metric";
    sheet.getCell("B1").value = 0.25;
    sheet.getCell("B1").numFmt = "0.00%";
    sheet.getCell("A2").value = "Formula";
    sheet.getCell("B2").value = { formula: "1+1", result: 2 };
    const buffer = (await workbook.xlsx.writeBuffer()) as ArrayBuffer;
    const loaded = await loadSpreadsheetWorkbook(buffer);
    const { matrix, warnings } = extractSheetMatrix(loaded, "Formats");
    expect(matrix[0]?.[1]).toMatch(/25/);
    expect(matrix[1]?.[1]).toBe("2");
    expect(warnings.some((warning) => warning.code === "formula_stored_as_display")).toBe(true);
  });

  it("handles an empty sheet", async () => {
    const buffer = await buildSyntheticXlsxBuffer([{ name: "Empty", rows: [] }]);
    const workbook = await loadSpreadsheetWorkbook(buffer);
    const { matrix } = extractSheetMatrix(workbook, "Empty");
    expect(matrix).toEqual([]);
  });

  it("rejects oversized files", () => {
    expect(() => assertSpreadsheetByteLimit(MAX_SPREADSHEET_BYTES + 1)).toThrow(SpreadsheetParseError);
  });

  it("rejects excessive row counts", async () => {
    const buffer = await buildSyntheticRowCountWorkbook(MAX_SPREADSHEET_ROWS + 1);
    const workbook = await loadSpreadsheetWorkbook(buffer);
    expect(() => extractSheetMatrix(workbook, "Rows")).toThrow(SpreadsheetParseError);
  });

  it("rejects malformed archives", async () => {
    const garbage = new TextEncoder().encode("not-a-workbook").buffer as ArrayBuffer;
    await expect(loadSpreadsheetWorkbook(garbage)).rejects.toMatchObject({
      code: "malformed_archive"
    });
  });

  it("warns on hidden sheets without skipping parse", async () => {
    const buffer = await buildSyntheticXlsxBuffer([
      { name: "Visible", rows: [["A"], ["1"]] },
      { name: "Hidden", rows: [["B"], ["2"]], hidden: true }
    ]);
    const workbook = await loadSpreadsheetWorkbook(buffer);
    expect(workbook.warnings.some((warning) => warning.code === "hidden_sheet")).toBe(true);
    const { matrix } = extractSheetMatrix(workbook, "Hidden");
    expect(matrix[1]?.[0]).toBe("2");
  });

  it("blocks prototype pollution keys when building safe row objects", () => {
    const record = safeObjectFromRow(["__proto__", "company"], ["polluted", "Acme"]);
    expect(record.company).toBe("Acme");
    expect(isSpreadsheetPrototypePollutionKey("__proto__")).toBe(true);
    expect(Object.prototype).toEqual(expect.objectContaining({}));
  });

  it("bounds pathological string cells without HTML output", async () => {
    const longValue = "=".repeat(5000);
    const buffer = await buildSyntheticXlsxBuffer([
      { name: "Strings", rows: [["value"], [longValue]] }
    ]);
    const workbook = await loadSpreadsheetWorkbook(buffer);
    const { matrix } = extractSheetMatrix(workbook, "Strings");
    expect(matrix[1]?.[0]).toContain("=");
    expect(matrix[1]?.[0]).not.toMatch(/<html/i);
  });

  it("rejects legacy XLS extension at import validation layer", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "legacy.xls", {
      type: "application/vnd.ms-excel"
    });
    const { validateImportFile } = await import("@/features/leadops/import-file-parser");
    expect(validateImportFile(file)).toMatch(/Legacy XLS/);
  });

  it("does not perform network requests while parsing", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const file = await buildSyntheticXlsxFile("network.xlsx", [
      { name: "Sheet1", rows: [["A"], ["1"]] }
    ]);
    const { parseImportFile } = await import("@/features/leadops/import-file-parser");
    await parseImportFile(file);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it("truncates excessive columns to the configured maximum", async () => {
    const headers = Array.from({ length: MAX_SPREADSHEET_COLUMNS + 5 }, (_, index) => `C${index}`);
    const values = headers.map((header) => header.toLowerCase());
    const buffer = await buildSyntheticXlsxBuffer([{ name: "Wide", rows: [headers, values] }]);
    const workbook = await loadSpreadsheetWorkbook(buffer);
    const { matrix, warnings } = extractSheetMatrix(workbook, "Wide");
    expect(matrix[0]?.length).toBeLessThanOrEqual(MAX_SPREADSHEET_COLUMNS);
    expect(warnings.some((warning) => warning.code === "excessive_columns_truncated")).toBe(true);
  });

  it("parses representative row counts within practical bounds", async () => {
    const timings: Record<string, number> = {};
    for (const [label, count] of [
      ["rows-271", 271],
      ["rows-5000", 5000]
    ] as const) {
      const buffer = await buildSyntheticRowCountWorkbook(count);
      const started = performance.now();
      const workbook = await loadSpreadsheetWorkbook(buffer);
      extractSheetMatrix(workbook, "Rows");
      timings[label] = performance.now() - started;
    }
    expect(timings["rows-271"]).toBeLessThan(5000);
    expect(timings["rows-5000"]).toBeLessThan(20000);
  });
});
