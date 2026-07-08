import { describe, expect, it } from "vitest";
import { buildCsvRow, escapeCsvCell } from "@/features/export/csv-export-safety";

describe("csv export safety", () => {
  it("prefixes formula-like values", () => {
    expect(escapeCsvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(escapeCsvCell("+351910000000")).toBe("'+351910000000");
  });

  it("escapes commas and quotes", () => {
    expect(buildCsvRow(['Acme "Main"', "Lisbon, PT"])).toBe('"Acme ""Main""","Lisbon, PT"');
  });
});
