# Email Outreach Status — Import Operations Hardening

Date: 2026-07-02  
Branch: `feat/outreach-import-ops-hardening`  
Base: `origin/feat/email-outreach-provider`  
Starting commit: `9cf9936`

## Import operations (this branch)

- [x] Semicolon CSV + UTF-8 / Windows-1252 decoding
- [x] XLSX multi-sheet selection
- [x] Reusable mapping profiles (6 built-ins + save/delete)
- [x] Original vs normalized preview + formula-safe error export
- [x] Import history summary with batch drill-down
- [x] Duplicate review queue (persisted `possible_duplicate` rows)
- [x] Lead table sendability filter + suppression-table consistency
- [x] Backup v8 includes `importMappingProfiles`
- [x] IndexedDB schema v12

## Still on provider branch (out of scope here)

- [ ] Production Brevo send jobs
- [ ] Live provider cohort pilot

## Schema

- IndexedDB v12: `importMappingProfiles`, extended `importBatches` metadata
- JSON backup v8: mapping profiles table

## Operator workflow (ready)

Select local file → map columns (profile optional) → pick sheet → preview/filter → review duplicates → import → search/filter → draft campaign segment → reload confirms persistence.

No email sent by this branch.
