# ExcelJS Bundle Review

**Branch:** `integration/dependency-security-cursor`  
**Recorded:** 2026-07-05  
**Build:** `npm run build` (Next.js 16.2.9 Turbopack)

## Objective

Confirm ExcelJS is not loaded on login, dashboard, or unrelated routes; only deferred when spreadsheet parsing is requested.

## Implementation

`src/features/shared/spreadsheet/spreadsheet-parser.ts` uses `import type` for ExcelJS typings and loads the runtime module via `loadExcelJsModule()` → `import("exceljs")` inside `loadSpreadsheetWorkbook()`.

## Production build evidence

| Artifact | Size | Contains ExcelJS |
|----------|------|------------------|
| `.next/static/chunks/26r8v7woircwv.js` | 930,899 bytes (~909 KiB) | Yes — sole ExcelJS chunk |
| Login route chunks | — | No `exceljs` string match |
| Dashboard route chunks | — | No `exceljs` string match |

`rg exceljs .next/static/chunks` matches **one** chunk file only. LeadOps client code references this chunk asynchronously via the dynamic import boundary in the spreadsheet adapter.

## Unit test

`spreadsheet-parser.test.ts` → **lazy-loads ExcelJS only when workbook parsing is requested** verifies the adapter module can be imported without loading ExcelJS; loading occurs only after `loadSpreadsheetWorkbook()` is called.

## Conclusion

ExcelJS is **not** in the initial application shell bundle. It is split into a dedicated async chunk loaded on first XLSX parse request (LeadOps import wizard or equivalent call path).
