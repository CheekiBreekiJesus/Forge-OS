import { describe, expect, it } from "vitest";
import {
  detectCsvDelimiter,
  mapRowsToInput,
  parseCsvText,
  parseImportFile
} from "@/features/leadops/import-file-parser";
import { detectFieldMapping } from "@/features/leadops/import-mapping";
import {
  extractPrimaryEmail,
  isPlaceholderValue,
  sanitizeFormulaInjection
} from "@/features/leadops/import-normalization";
import { buildSyntheticXlsxFile } from "@/features/shared/spreadsheet/spreadsheet-fixtures";

describe("import file parser hardening", () => {
  it("detects semicolon delimiters for Portuguese CSV exports", () => {
    const csv = "Empresa;Email;Telefone\nAcme;hello@example.test;912345678";
    expect(detectCsvDelimiter(csv)).toBe(";");
    const parsed = parseCsvText(csv, ";");
    expect(parsed.headers).toEqual(["Empresa", "Email", "Telefone"]);
    expect(parsed.rows[0]?.[0]).toBe("Acme");
  });

  it("preserves Portuguese characters in CSV rows", () => {
    const csv = "company,email\nAssociação Atlântico,contacto@example.test";
    const mapped = mapRowsToInput(parseCsvText(csv).headers, parseCsvText(csv).rows, detectFieldMapping(["company", "email"]));
    expect(mapped[0]?.companyName).toContain("Associação");
  });

  it("parses multiple emails and keeps the first candidate for validation", () => {
    const result = extractPrimaryEmail("hello@example.test; backup@example.test");
    expect(result.primary).toBe("hello@example.test");
    expect(result.additional).toContain("backup@example.test");
  });

  it("keeps invalid email tokens for downstream validation", () => {
    const result = extractPrimaryEmail("not-an-email");
    expect(result.primary).toBe("not-an-email");
  });

  it("reads a selected XLSX worksheet", async () => {
    const file = await buildSyntheticXlsxFile("multi-sheet.xlsx", [
      {
        name: "Events",
        rows: [
          ["Name", "Email"],
          ["Sheet A Org", "a@example.test"]
        ]
      },
      {
        name: "Municipalities",
        rows: [
          ["Name", "Email"],
          ["Sheet B Org", "b@example.test"]
        ]
      }
    ]);
    const parsed = await parseImportFile(file, { sheetName: "Municipalities" });
    expect(parsed.selectedSheet).toBe("Municipalities");
    expect(parsed.rows[0]?.[0]).toBe("Sheet B Org");
  });

  it("sanitizes formula injection in export values", () => {
    expect(sanitizeFormulaInjection("=1+1")).toBe("'=1+1");
    expect(isPlaceholderValue("sem informação")).toBe(true);
  });
});
