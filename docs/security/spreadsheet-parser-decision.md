# Spreadsheet Parser Decision

Date: 2026-07-04  
Branch: `fix/xlsx-security-remediation`  
Status: Review candidate — do not merge without Codex security review

## Problem

Production lead import uses direct dependency `xlsx@0.18.5` with no npm fix:

| Advisory | Issue | Fixed in SheetJS |
|----------|-------|------------------|
| GHSA-4r6h-8v6p-xvw6 | Prototype pollution | ≥ 0.19.3 |
| GHSA-5pgg-2g8v-p4x9 | ReDoS | ≥ 0.20.2 |

Parsing runs in the **browser** (`leadops-import-wizard.tsx` → `import-file-parser.ts`).

## Candidates evaluated

### Option A — `@e965/xlsx@0.20.3`

| Criterion | Assessment |
|-----------|------------|
| License | Apache-2.0 |
| Origin | Community npm mirror (`github.com/e965/sheetjs-npm-publisher`) |
| Maintainer | Single publisher (`e965`) |
| Release history | 0.20.0 – 0.20.3 (2023–2024); last publish July 2024 |
| Transitive deps | **0** |
| Browser | Same SheetJS bundle profile as `xlsx` — works client-side |
| XLS | Yes (SheetJS BIFF reader) |
| XLSX | Yes |
| Multi-sheet | Yes |
| API compatibility | Drop-in with `xlsx` |
| Bundle impact | Similar to incumbent `xlsx` |
| npm audit | Clears `xlsx` advisories when replacing package |
| TypeScript | Ships types (SheetJS) |
| Code changes | Smallest — mostly import path |
| Supply-chain | **Concern** — republication of SheetJS artifacts outside official SheetJS distribution; single maintainer; homepage still points to sheetjs.com |

### Option B — `exceljs@4.4.0`

| Criterion | Assessment |
|-----------|------------|
| License | MIT |
| Origin | `github.com/exceljs/exceljs` (established since 2014) |
| Maintainers | Multiple (`guyonroche`, `siemienik`) |
| Release history | Active through Dec 2024 (4.4.0 stable; 4.4.1 prerelease) |
| Transitive deps | **9** (`jszip`, `archiver`, `fast-csv`, `unzipper`, `readable-stream`, …) |
| Browser | Supported via bundling; heavier than SheetJS |
| XLS | **No** (XLSX/CSV only) |
| XLSX | Yes |
| Multi-sheet | Yes |
| API compatibility | Different — requires ForgeOS adapter |
| Bundle impact | Larger client chunk; acceptable for 5 MB / 5k row bounded parse |
| npm audit | No GHSA-4r6h / GHSA-5pgg-2g8v findings on install probe |
| TypeScript | Built-in types |
| Code changes | Adapter + cell formatting layer |
| Supply-chain | **Stronger** — well-known OSS project, auditable Git history |

## Decision

**Selected: `exceljs@4.4.0`** behind ForgeOS adapter `src/features/shared/spreadsheet/spreadsheet-parser.ts`.

### Rationale

1. **Provenance rule** — when origin is uncertain, prefer the more established alternative even if an adapter is required. `@e965/xlsx` is a third-party republication with unclear chain-of-custody to patched SheetJS sources.
2. **Auditable maintenance** — `exceljs` has a long public history, multiple maintainers, and MIT license suitable for production SaaS.
3. **Security boundary** — adapter enforces byte/row/column/sheet limits, rejects encrypted workbooks, never executes formulas, never renders HTML, returns neutral `string[][]` structures.
4. **Production scope** — lead import wizard accepts `.csv` and `.xlsx` only; legacy `.xls` was never in the wizard `accept` list. Dev profiler `.xls` support is downgraded with explicit skip + documented limitation.

### Rejected alternative

**`@e965/xlsx@0.20.3`** — rejected for merge candidacy default because:

- Republication provenance is insufficient for a production parser handling untrusted uploads without explicit security sign-off.
- Would be the smaller diff, but optimizes audit score over supply-chain clarity.
- Reserved as documented fallback if `exceljs` browser bundle or compatibility blocks release after Codex review.

## Architecture

```
Application (LeadOps import-file-parser)
        ↓
spreadsheet-parser.ts  (ForgeOS-owned API)
        ↓
exceljs (sole spreadsheet engine — not imported elsewhere)
```

Test fixture helper `spreadsheet-fixtures.ts` uses `exceljs` only for synthetic workbook generation in tests.

## Codex review gates before merge

1. Confirm `exceljs` client bundle size and Turbopack compatibility on `/leadops`.
2. Verify cell formatting parity (leading zeros, PT characters, percentages, dates).
3. Sign off on `.xls` deprecation in dev profiler vs production scope.
4. Re-run `npm audit` and penetration-style malformed workbook tests.
5. Confirm no `xlsx` remains in `dependencies` or client bundle graph.
