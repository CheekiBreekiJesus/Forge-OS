# Spreadsheet Source Branch Review

Date: 2026-07-04  
Reviewer: dependency integration agent  
Source: `origin/fix/xlsx-security-remediation` (`73a897b`)  
Diff base: `24c7f3d` (`chore/dependency-audit-triage`)

## Summary

**Approved for trial merge** into `integration/dependency-security-remediation`.

The spreadsheet remediation branch removes direct `xlsx@0.18.5`, introduces `exceljs@4.4.0` behind a ForgeOS-owned adapter, and does not touch authentication, email sending, OAuth, or LeadOps business rules.

## Commits reviewed

| Commit | Description |
|--------|-------------|
| `ee2cc2f` | docs(security): select safe spreadsheet parser replacement |
| `9b06528` | refactor(import): add package-neutral spreadsheet parser |
| `5925f78` | fix(security): remove vulnerable xlsx dependency |
| `d0fd63e` | test(import): cover spreadsheet parser security boundaries |
| `73a897b` | docs(security): record xlsx remediation result |

## Files changed (17)

| Area | Files | Assessment |
|------|-------|------------|
| Dependencies | `package.json`, `package-lock.json` | Removes `xlsx`, adds `exceljs@^4.4.0` |
| Adapter | `src/features/shared/spreadsheet/spreadsheet-parser.ts` | Single engine import point; neutral API |
| LeadOps parser | `src/features/leadops/import-file-parser.ts` | Uses adapter only; CSV logic unchanged |
| Tests | `spreadsheet-parser.test.ts`, `import-file-parser.test.ts`, integration tests | Synthetic fixtures only |
| Profiler | `scripts/data-preparation/profile-lead-files.ts` | Migrated from `.mjs`; no private spreadsheets |
| Docs | decision record, remediation results, lead-import docs | Complete |

## Supply-chain checks

| Criterion | Result |
|-----------|--------|
| Direct `xlsx` removed | Yes |
| `exceljs@4.4.0` | MIT, established project |
| `@e965/xlsx` rejected | Documented in `spreadsheet-parser-decision.md` |
| Private spreadsheets in diff | None |
| Auth / email / OAuth touched | No |
| LeadOps deduplication / mapping logic changed | No — parser output shape preserved |

## Security limits in source branch

| Control | Value |
|---------|-------|
| Max bytes | 5 MB |
| Max rows | 5,000 |
| Max sheets | 100 |
| Max columns | 256 |
| Formulas | Display values only |
| HTML / macros | Not rendered |
| Encrypted workbooks | Rejected |
| Legacy `.xls` (wizard) | Rejected with message |
| Prototype-pollution keys | Filtered |

## Integration notes

- Source branch pins Playwright `1.53.1`; integration base has `^1.61.1` — **must keep 1.61.1**.
- Documentation files overlap with Playwright remediation — resolve conflicts preserving both outcomes.
- Residual `uuid@8.3.2` moderate via ExcelJS requires separate UUID decision on integration branch.

## Verdict

Safe to trial-merge for validation. No fundamental safety blockers identified in source diff review.
