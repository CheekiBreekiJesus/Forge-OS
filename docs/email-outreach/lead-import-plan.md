# Lead Import Architecture Plan

Branch: `feat/email-outreach-live-mvp`  
Baseline commit: `f02471c`

## Goal

Deliver a local-first vertical slice: CSV/XLSX → header mapping → preview → normalize/validate → deduplicate → confirm → persist organizations (leads) and contacts → survive reload, backup, and demo reset.

## Reused LeadOps foundations

| Area | Location | Reuse |
|------|----------|-------|
| Organization entity | `Lead` in `src/domain/types.ts` | Extended with normalized fields |
| Contact entity | `LeadContact` (new) | Linked via `leadId`; primary contact mirrored on `Lead` for existing UI |
| Repositories | `src/persistence/indexeddb/repositories.ts` | Extended `LeadRepository`; new import + contact repos |
| Dexie | `src/persistence/db.ts` | Schema v5 migration |
| CSV parsing | `src/features/leadops/import.ts` | Refactored into modular pipeline |
| Import UI shell | `src/components/leadops-dashboard-shell.tsx` | Replaced by `leadops-import-wizard.tsx` |
| i18n | `src/i18n/locales/{en,pt-PT}.ts` | Extended import wizard keys |
| Backup | `src/features/backup/service.ts` | v3 includes import batches, rows, lead contacts |
| Demo reset | `resetDemoRecords()` | Preserves non-seed leads and import history |
| Audit | `ActivityRepository` | Import completion events |

## New modules

- `src/domain/import-types.ts` — ImportBatch, ImportRow, LeadContact types
- `src/features/leadops/import-normalization.ts` — deterministic normalization
- `src/features/leadops/import-mapping.ts` — header alias detection + manual mapping
- `src/features/leadops/import-deduplication.ts` — strong/possible duplicate analysis
- `src/features/leadops/import-file-parser.ts` — CSV + XLSX (SheetJS, raw string cells)
- `src/application/lead-import-service.ts` — orchestration + persistence
- `src/persistence/indexeddb/import-repositories.ts` — batch/row/contact repos
- `src/components/leadops-import-wizard.tsx` — multi-step import UI

## Data model (schema v5)

### Lead extensions

- `normalizedCompanyName`, `websiteDomain`, `normalizedPhone`, `country`, `sourceImportId`

### LeadContact

Contact records scoped to a lead; `normalizedEmail` indexed for duplicate prevention.

### ImportBatch

Tracks filename, fingerprint, mapping, counts, status, timestamps.

### ImportRow

Staging row with original values, normalized values, validation, duplicate matches, proposed action, result.

## Out of scope (Step 1)

Campaigns, draft generation, provider sending, web enrichment, AI research, background jobs, webhooks, Marketing Studio.

## Privacy

- No real lead files in git; `data/imports/` and `data/exports/` gitignored
- Synthetic fixtures only in tests
- No full import contents in logs
