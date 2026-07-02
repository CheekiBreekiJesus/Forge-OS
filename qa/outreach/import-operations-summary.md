# Import operations summary

**Branch:** `feat/outreach-import-ops-hardening`  
**Date:** 2026-07-02

## Delivered

- Semicolon CSV + encoding fallback
- XLSX sheet selection
- Mapping profiles (6 built-ins + save/delete)
- Enhanced duplicate review + import history
- Lead table sendability filter + suppression consistency
- Formula-safe error export
- Backup v8 with mapping profiles
- Schema v12 IndexedDB migration

## Real-file readiness

12 JH Gomes XLSX databases profiled (aggregate only). Primary patterns: `Name`/`Nombre`, `Email`/`Contact Email`, `Tipo`, `Ciudad`/`City`. Multi-sheet selection required for `Municipios, Cafés, Eventos.xlsx` and student associations workbook.

## Private acceptance (2026-07-02)

| Step | Result |
|------|--------|
| Workbook upload + sheet list | pass (5 sheets) |
| Sheet `Municipalidades` | pass (271 rows) |
| Profile `Municipalities` | pass (6 mapped fields) |
| Preview validation | 271 valid / 0 invalid / 0 missing email |
| Duplicate review | 0 exact / 0 possible |
| Local import | 271 organizations imported |
| Reload persistence | pass |
| Lead filters | source + email validity + sendability applied |
| Draft campaign segment | campaign shell created; stopped before draft generation |
| Email send | none |

### Defect fixed during acceptance

- **Issue:** switching XLSX sheets left stale header mappings (`Nombre` vs `Name`), marking all rows invalid until manual remap.
- **Fix:** reset mapping to the selected profile (or auto-detect baseline) on sheet/profile change in `leadops-import-wizard.tsx`.
- **Regression:** integration test for multi-sheet header spellings.

## Validation

- `npm run lint` — warnings only (pre-existing)
- `npm run typecheck` — pass
- `npm test` — see post-acceptance run
- `npm run build` — see post-acceptance run
- E2E / acceptance — see post-acceptance run

## Not in scope

Provider send jobs, Brevo, production webhooks, live email.
