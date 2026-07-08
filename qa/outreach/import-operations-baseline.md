# Lead import operations baseline

**Worktree:** `Forge-OS-outreach-ops`  
**Branch:** `feat/outreach-import-ops-hardening`  
**Starting commit:** `9cf9936`  
**Date:** 2026-07-02

## Preflight

| Check | Result |
|-------|--------|
| Worktree | `Forge-OS-outreach-ops` |
| Branch | `feat/outreach-import-ops-hardening` |
| Working tree | Clean at start |
| Real lead files tracked | None |
| Credentials in repo | None |

## Existing pipeline (pre-hardening)

- Parser: `src/features/leadops/import-file-parser.ts` (CSV comma-only, XLSX first sheet)
- Mapping: `src/features/leadops/import-mapping.ts` (PT/EN aliases, session-only)
- Staging: `src/application/lead-import-service.ts` + IndexedDB `importBatches` / `importRows`
- Dedup: `src/features/leadops/import-deduplication.ts`
- Lead table: `src/components/leadops-lead-management-panel.tsx` (9 filters, 25/page)
- Sendability: `src/features/leadops/sendability.ts` (suppression table not wired to lead list)
- Backup v7: includes import batches/rows; demo reset preserves operational imports

## Gaps addressed in this branch

1. Semicolon CSV + Windows-1252 fallback decoding
2. XLSX sheet selection + non-empty sheet auto-pick
3. Saved mapping profiles (IndexedDB, built-in PT templates)
4. Original vs normalized preview + formula-safe error export
5. Import history summary panel
6. Lead-table sendability filter + suppression-table consistency
7. Duplicate review queue via persisted `possible_duplicate` import rows

## Out of scope

- Provider send jobs, Brevo batch, webhooks, unsubscribe production routes
