import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  cleanupBarcode,
  normalizeReferenceCase,
  parseCurrency,
  parsePercentage,
  parsePortugueseNumber,
  validateEan13
} from "@/features/product-import/normalize";
import { suggestFieldMapping } from "@/features/product-import/field-mapping";
import { parseSpreadsheet } from "@/features/product-import/parse-spreadsheet";
import {
  analyzeDuplicatesAndConflicts,
  countDuplicateBarcodes,
  countDuplicateReferences,
  resolveConflictWithPrecedence
} from "@/features/product-import/duplicate-conflict";
import type { Product } from "@/domain/product-types";

const fixturesDir = resolve(process.cwd(), "scripts/data-preparation/fixtures");

describe("product import normalize", () => {
  it("trims and uppercases references", () => {
    expect(normalizeReferenceCase("  abc-123  ")).toBe("ABC-123");
  });

  it("parses Portuguese decimals", () => {
    expect(parsePortugueseNumber("1.234,56").numeric).toBe(1234.56);
    expect(parsePortugueseNumber("12,50").numeric).toBe(12.5);
  });

  it("parses currency with euro symbol", () => {
    const result = parseCurrency("127,920 €");
    expect(result.numeric).toBeCloseTo(127.92);
    expect(result.currency).toBe("EUR");
  });

  it("parses percentage values", () => {
    expect(parsePercentage("23%").numeric).toBeCloseTo(0.23);
  });

  it("validates EAN-13 checksum", () => {
    const valid = validateEan13("5901234123457");
    expect(valid.valid).toBe(true);
  });

  it("cleans barcodes preserving digits", () => {
    expect(cleanupBarcode("560 1234 5678 90")).toBe("5601234567890");
  });
});

describe("product import parsing", () => {
  it("parses synthetic curated CSV", async () => {
    const csv = readFileSync(resolve(fixturesDir, "synthetic_curated_products.csv"), "utf8");
    const parsed = await parseSpreadsheet({ data: csv, filename: "synthetic_curated_products.csv" });
    expect(parsed.format).toBe("csv");
    expect(parsed.worksheets[0].rows.length).toBe(5);
    const mapping = suggestFieldMapping(parsed.worksheets[0].headers);
    expect(Object.values(mapping)).toContain("internalReference");
  });

  it("parses synthetic invoice CSV with semicolon delimiter", async () => {
    const csv = readFileSync(resolve(fixturesDir, "synthetic_invoice_export.csv"), "utf8");
    const parsed = await parseSpreadsheet({ data: csv, filename: "synthetic_invoice_export.csv" });
    expect(parsed.worksheets[0].rows.length).toBe(4);
  });
});

describe("product import duplicate and conflict analysis", () => {
  const existingProduct: Product = {
    id: "prod_test",
    tenantId: "tenant_jh_gomes",
    name: "Synthetic Cup Alpha 330ml",
    sku: "SYN-CUP-001",
    category: "personalized-cups",
    image: "",
    material: "PP",
    capacity: "330ml",
    color: "white",
    unitsPerBox: 1000,
    stacksPerBox: 10,
    unitsPerStack: 100,
    compatibleLidsAccessories: [],
    basePrice: 12.5,
    personalizationAvailable: false,
    printArea: "",
    setupCost: 0,
    screenCost: 0,
    leadTimeDays: 14,
    sourceUrl: null,
    productPageUrl: "",
    imageUrl: "",
    thumbnailUrl: "",
    customizerUrl: "",
    defaultCtaLabel: "",
    emailTitle: "",
    emailDescription: "",
    isEmailPromotable: false,
    active: true,
    archivedAt: null,
    archivedBy: null,
    archiveReason: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  };

  it("detects exact reference duplicates", () => {
    const result = analyzeDuplicatesAndConflicts(
      { internalReference: "SYN-CUP-001", description: "Test" },
      { existingProducts: [existingProduct], sourceLabel: "invoice", stagedRows: [] }
    );
    expect(result.duplicateMatches.some((m) => m.matchType === "exact_reference")).toBe(true);
  });

  it("flags conflicting sale prices", () => {
    const result = analyzeDuplicatesAndConflicts(
      { internalReference: "SYN-CUP-001", description: "Synthetic Cup Alpha 330ml", salePrice: "13.00" },
      { existingProducts: [existingProduct], sourceLabel: "curated workbook", stagedRows: [] }
    );
    expect(result.conflictFields.some((c) => c.field === "salePrice")).toBe(true);
    expect(result.proposedAction).toBe("manual_review");
  });

  it("applies source precedence for commercial conflicts", () => {
    const resolution = resolveConflictWithPrecedence({
      existingSource: "forgeos_approved",
      existingValue: "12.5",
      field: "salePrice",
      incomingSource: "invoice_export",
      incomingValue: "13"
    });
    expect(resolution).toBe("preserve_existing");
  });

  it("counts duplicate references in batch", () => {
    const count = countDuplicateReferences([
      { internalReference: "A" },
      { internalReference: "A" },
      { internalReference: "B" }
    ]);
    expect(count).toBe(1);
  });

  it("counts duplicate barcodes", () => {
    const count = countDuplicateBarcodes([{ barcode: "123" }, { barcode: "123" }, { ean: "456" }]);
    expect(count).toBe(1);
  });
});
