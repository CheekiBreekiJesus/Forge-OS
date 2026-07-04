# Spreadsheet Bundle Analysis

Date: 2026-07-04  
Branch: `integration/dependency-security-remediation`  
Build: Next.js 16.2.9 (Turbopack) production build

## Lazy-loading implementation

`src/features/shared/spreadsheet/spreadsheet-parser.ts` uses `import("exceljs")` on first workbook parse. Type-only imports from `exceljs` are erased at compile time.

Unit test `defers ExcelJS loading until the first workbook parse` confirms the engine promise is not created until `loadSpreadsheetWorkbook` runs.

## Production chunk layout (post-integration)

| Chunk | Approx. size (uncompressed) | Contents |
|-------|----------------------------|----------|
| LeadOps client graph (e.g. `1il7a073fjdvl.js`) | ~67.5 KB | Import wizard, `lead-import-service`, `import-file-parser`, adapter shell |
| ExcelJS async chunk (`26r8v7woircwv.js`) | ~909 KB | `exceljs` + transitive browser bundle |

Build output shows dynamic import (`e.A(85134)`) from the LeadOps chunk to the ExcelJS async chunk — ExcelJS is **not** in the initial LeadOps route synchronous bundle.

## Route impact

| Route | ExcelJS on first paint? |
|-------|-------------------------|
| `/[locale]/leadops` | **No** — loads when user selects/parses an XLSX file |
| `/[locale]/crm`, `/products`, etc. | **No** |
| CSV-only import | **No** — native CSV parser only |

## Node-only modules in browser output

No `fs`, `path`, or `crypto` Node builtins observed in the ExcelJS client chunk grep sample. ExcelJS browser bundle path used.

## Turbopack compatibility

Production `npm run build` succeeds with dynamic ExcelJS import. Local acceptance runs observed intermittent Turbopack worker panics under repeated dev-server restarts — environment instability, not a production-build blocker.

## Comparison to incumbent `xlsx`

| Metric | `xlsx@0.18.5` (removed) | `exceljs@4.4.0` (lazy) |
|--------|---------------------------|-------------------------|
| Audit high findings | 2 advisories | 0 |
| Initial `/leadops` JS | Included in route chunk | Deferred async chunk |
| Parse-path chunk | Same route chunk | ~909 KB loaded on demand |

## Conclusion

Bundle impact is **acceptable** for a bounded 5 MB / 5k-row parse path. Lazy loading keeps ExcelJS off the LeadOps first paint; operators pay the chunk cost only when importing XLSX.
