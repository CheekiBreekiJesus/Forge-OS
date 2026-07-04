# Dependency Cursor Convergence — Result

**Branch:** `integration/dependency-security-cursor`  
**Base:** `213dc3e` on `origin/integration/jh-gomes-outreach-supabase-7d2`  
**Recorded:** 2026-07-05

## Summary

Dependency-only remediation completed on the Supabase integration base without OAuth, login, auth callback, tenant membership, or proxy changes.

| Item | Before | After |
|------|--------|-------|
| `@playwright/test` | 1.53.1 | **1.61.1** |
| `playwright` / `playwright-core` | (transitive, below advisory) | **1.61.1** |
| `xlsx` | 0.18.5 (direct) | **removed** |
| `exceljs` | absent | **4.4.0** (behind adapter) |
| High npm audit findings | 1 (xlsx) | **0** |
| Moderate npm audit findings | 0 | **2** (uuid via exceljs) |

## Commits cherry-picked

1. `fcc5e85` — `ca12ac3` Playwright upgrade  
2. `b8707ce` — `9b06528` spreadsheet adapter  
3. `516487b` — `5925f78` remove xlsx / add exceljs  
4. `2427ec7` — `d0fd63e` parser security tests  

## Changes recreated manually

- `loadExcelJsModule()` dynamic import in `spreadsheet-parser.ts` (lazy-load ExcelJS)  
- Lazy-load isolation unit test in `spreadsheet-parser.test.ts`  
- Fresh QA/security documentation (this file set)

## Documentation commits not cherry-picked

`5ef6630`, `ee2cc2f`, `73a897b` — replaced with integration-base-compatible docs to avoid missing triage file dependencies and OAuth-branch doc drift.

## Validation

| Check | Result |
|-------|--------|
| `npm run lint` | Pass (10 pre-existing warnings) |
| `npm run typecheck` | Pass |
| `npm test` | 293 passed, 3 skipped |
| `npm run build` | Pass |
| `npm run validate` | Pass |
| Lead import E2E | 2/2 pass |
| Acceptance import outreach | 5/5 pass |
| Full acceptance | 50/51 pass (1 live-ai skipped) |
| Full E2E | 40/44 pass — 4 campaign tests fail with 401 (pre-existing Supabase integration base; unrelated to dependency changes) |

## Parser security boundaries (verified by tests)

- Max 5 MB, 5,000 rows, 256 columns, 100 sheets  
- No formula execution (display values only)  
- No HTML rendering, no network loading during parse  
- Malformed archives rejected  
- Prototype-pollution keys filtered (`__proto__`, `prototype`, `constructor`)  
- Legacy `.xls` rejected at validation layer (UI accepts `.csv,.xlsx` only)

## Approval

**APPROVED WITH CONDITIONS** — see `dependency-cursor-convergence-audit.md`.
