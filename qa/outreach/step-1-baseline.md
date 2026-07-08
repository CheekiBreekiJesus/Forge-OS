# Step 1 Baseline — Lead Import

**Worktree:** `Forge-OS-outreach`  
**Branch:** `feat/email-outreach-live-mvp`  
**Starting commit:** `f02471c`  
**Date:** 2026-07-01

## Preflight

| Check | Result |
|-------|--------|
| Correct worktree | Yes |
| Correct branch | `feat/email-outreach-live-mvp` |
| Clean working tree | Yes |
| Private lead DBs tracked | No |

## Existing structures reused

- **Lead** (`src/domain/types.ts`) — organization/lead canonical record
- **LeadRepository** — CRUD, duplicate email guard, demo reset preservation
- **CustomerContact** — unchanged; import uses new `LeadContact` for outreach contacts
- **Dexie v4** — leads, customers, activities, campaigns, outreach messages
- **CSV import (partial)** — `import.ts`, `csv-import-service.ts`, dashboard metrics UI
- **i18n** — `leadops.import.*` keys (EN + PT-PT)
- **E2E** — `e2e/acceptance/03-leads-import-outreach.spec.ts` (CSV only, valid rows)
- **Backup v2** — leads, customers, campaigns; missing import history

## Gaps addressed in Step 1

1. XLSX browser import
2. Manual header mapping UI
3. Row-level preview with filters
4. Normalization utilities with tests
5. Strong/possible duplicate analysis
6. Import batch + row persistence
7. LeadContact entity
8. Missing-email organization import
9. Repeat-import fingerprint warning
10. Backup/restore for import data
11. Full wizard UI with PT/EN, themes, mobile

## Dependencies added

- `xlsx` — XLSX parsing (raw cell values, no formula execution)
