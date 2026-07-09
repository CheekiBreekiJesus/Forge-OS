import { describe, expect, it } from "vitest";
import {
  buildErrorReportCsv,
  escapeCsvCell,
  errorReportRowsFromImport
} from "@/features/product-import/error-report";
import { requireProductImportPermission } from "@/features/product-import/auth";
import { ForgeOSAuthError } from "@/lib/auth/types";

describe("product import error report safety", () => {
  it("prefixes formula injection cells", () => {
    expect(escapeCsvCell("=1+1")).toBe("'=1+1");
    expect(escapeCsvCell("+cmd")).toBe("'+cmd");
  });

  it("escapes commas and quotes", () => {
    expect(escapeCsvCell('Say "hello"')).toBe('"Say ""hello"""');
  });

  it("builds downloadable CSV with headers", () => {
    const csv = buildErrorReportCsv(["row", "message"], [{ row: "1", message: "=evil" }]);
    expect(csv).toContain("row,message");
    expect(csv).toContain("'=evil");
  });

  it("maps validation issues to report rows", () => {
    const rows = errorReportRowsFromImport([
      {
        code: "missing_reference",
        message: "Missing internal reference.",
        severity: "error",
        sourceRowNumber: 2
      }
    ]);
    expect(rows[0].row).toBe("2");
  });
});

describe("product import permissions", () => {
  it("allows inventory managers", () => {
    expect(() =>
      requireProductImportPermission({
        permissions: ["inventory:manage"],
        roles: [],
        source: "test_adapter",
        tenantId: "tenant",
        userId: "user"
      })
    ).not.toThrow();
  });

  it("rejects viewers without manage permissions", () => {
    expect(() =>
      requireProductImportPermission({
        permissions: ["products:view"],
        roles: ["viewer"],
        source: "test_adapter",
        tenantId: "tenant",
        userId: "user"
      })
    ).toThrow(ForgeOSAuthError);
  });
});
