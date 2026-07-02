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

## Validation

- `npm run lint` — warnings only (pre-existing)
- `npm run typecheck` — pass
- `npm test` — 214 pass
- `npm run build` — pass
- E2E — see CI / local run

## Not in scope

Provider send jobs, Brevo, production webhooks, live email.
