# Lead import UI operations report

**Date:** 2026-07-02  
**Scope:** Import wizard + lead management panel

## Wizard

| Feature | Status |
|---------|--------|
| CSV upload | Pass (synthetic fixtures) |
| XLSX upload | Pass (unit + private acceptance) |
| Sheet selector | Pass (5 sheets listed; `Municipalidades` selected) |
| Mapping profile selector | Pass (`Municipalities` profile) |
| Automatic header mapping | Pass after profile re-apply on sheet change |
| Manual mapping correction | Available (not required for acceptance sheet) |
| Status filters incl. warnings | Pass |
| Invalid email visibility | Pass (0 invalid rows on acceptance sheet) |
| Duplicate review actions | Pass (none on acceptance sheet) |
| Normalized vs original toggle | Implemented |
| Error report download | Implemented (formula-safe) |
| Double-submit guard | Implemented (`confirming` flag) |
| PT / EN copy | Updated |

## Lead table

| Feature | Status |
|---------|--------|
| Search + category + region | Existing |
| Email validity + suppression | Pass (filter applied) |
| Language + sendability filters | Pass |
| Source import filter | Pass (`Municipalities` source) |
| Sendability reason column | Added |
| Import history summary | Enhanced |
| Pagination 25/page | Pass (271 imported; 25 visible per page) |
| Filter persistence | Existing |
| Reload persistence | Pass |

## Campaign segment (private acceptance)

| Feature | Status |
|---------|--------|
| Create from filters | Pass |
| Recipient / exclusion preview | Displayed (stopped before draft generation) |
| Draft generation | Not executed (by design) |
| External compose | Not executed (by design) |

## Viewports

- Desktop 1440×900 — default Playwright
- Mobile 390×844 — covered in `lead-import-wizard.spec.ts`

## Defects

| ID | Summary | Resolution |
|----|---------|------------|
| FORGE-QA-IMPORT-001 | Stale mapping after XLSX sheet switch caused all rows invalid | Fixed in wizard; regression test added |

## Privacy

No private screenshots committed. E2E uses `e2e/fixtures/*.csv` synthetic data only. Private acceptance metrics stored locally in gitignored `qa/outreach/.private-acceptance-metrics.json`.
