# Product Import — Spreadsheet Parser

Date: 2026-07-04

## Current state

ForgeOS does **not** ship a production product-catalog spreadsheet import wired to `xlsx` or `exceljs` in this repository.

The product catalog UI exposes an `imports` section placeholder, but there is no shared production parser beyond the LeadOps contact import path.

## Spreadsheet remediation scope

The `fix/xlsx-security-remediation` branch migrates **LeadOps lead import** only:

- `src/features/leadops/import-file-parser.ts` → `src/features/shared/spreadsheet/spreadsheet-parser.ts`

When product import is implemented, it **must reuse** the same ForgeOS spreadsheet adapter — do not add a second spreadsheet engine or direct `exceljs` imports in feature modules.

## Dev tooling

`scripts/data-preparation/profile-lead-files.ts` profiles local CSV/XLSX files for data-prep workflows. Legacy `.xls` files are skipped with an explicit reason.

## Reference

- `docs/security/spreadsheet-parser-decision.md`
- `docs/email-outreach/lead-import.md`
