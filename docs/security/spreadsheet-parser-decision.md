# Spreadsheet Parser Decision

**Status:** Accepted  
**Branch:** `integration/dependency-security-cursor`  
**Recorded:** 2026-07-05

## Problem

`xlsx@0.18.5` (SheetJS community build on npm) carried **high** severity advisories with no patched release:

- GHSA-4r6h-8v6p-xvw6 — prototype pollution  
- GHSA-5pgg-2g8v-p4x9 — ReDoS  

ForgeOS used xlsx for LeadOps CSV/XLSX import and the data-preparation profiler script.

## Options considered

| Option | Verdict |
|--------|---------|
| Stay on `xlsx@0.18.5` | Rejected — no fix, high severity |
| `@e965/xlsx` republication | Rejected — stale fork, unclear maintenance |
| `exceljs@4.4.0` behind ForgeOS adapter | **Selected** |
| `read-excel-file` / other minimal parsers | Deferred — less control over security boundaries |

## Decision

Replace direct `xlsx` usage with **`exceljs@4.4.0`** hidden behind a package-neutral adapter at `src/features/shared/spreadsheet/spreadsheet-parser.ts`.

### Adapter contract

- `loadSpreadsheetWorkbook(buffer)` — async, lazy-loads ExcelJS  
- `extractSheetMatrix(workbook, sheetName)` — string matrix only  
- `listSpreadsheetSheetNames`, `pickDefaultSpreadsheetSheet`  
- `safeObjectFromRow` — prototype-pollution-safe row mapping  
- Limits: 5 MB, 5,000 rows, 256 columns, 100 sheets  

### Security posture

- Formulas read as **display values** only (no execution)  
- No HTML rendering, no network I/O during parse  
- Malformed/encrypted workbooks rejected  
- Legacy `.xls` rejected at `validateImportFile` (UI never offered `.xls`)  

### Residual risk

`exceljs@4.4.0` depends on `uuid@8.3.2` with a **moderate** advisory (GHSA-w5hq-g745-h8pq). Accepted — not browser-reachable, no user buffer input to uuid APIs. See `qa/security/dependency-cursor-convergence-audit.md`.

## Consumers

- `src/features/leadops/import-file-parser.ts` — LeadOps import wizard  
- `scripts/data-preparation/profile-lead-files.ts` — local profiler  
- Tests via `spreadsheet-fixtures.ts` (synthetic workbooks only)

CSV parsing remains native in `import-file-parser.ts` — independent of ExcelJS.
