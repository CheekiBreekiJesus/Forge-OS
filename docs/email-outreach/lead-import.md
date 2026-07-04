# Lead Import (operations)

## Supported formats

| Format | Notes |
|--------|-------|
| CSV | Comma or semicolon delimiter (auto-detected); UTF-8 with Windows-1252 fallback |
| XLSX | Sheet selection when multiple worksheets exist; parsed via ForgeOS `spreadsheet-parser` adapter (`exceljs` engine); formulas not executed; HTML not rendered |
| XLS | **Not supported** in the lead import wizard — export to XLSX or CSV |

Max file size: 5 MB. Max rows: 5,000.

## Workflow

1. Open `/{locale}/leadops`.
2. Choose CSV or XLSX.
3. Select worksheet (XLSX multi-sheet books).
4. Apply or save a **mapping profile** (see `import-mapping-profiles.md`).
5. Review validation counts and row filters (valid, invalid, duplicate, missing email, warnings).
6. Toggle normalized vs original values; download a formula-safe error report if needed.
7. Confirm import; verify persistence after reload.
8. Audit via **Import history** on the lead management panel.

## Validation classes

| Status | Meaning |
|--------|---------|
| `valid` | Ready to create organization + contact |
| `missing_email` | Organization only |
| `duplicate` | Exact email or strong org match |
| `possible_duplicate` | Similar name / domain / phone — review queue |
| `invalid` | Missing organization or invalid email syntax |

## Duplicate handling

- Exact normalized email → skip (or block on re-import)
- Same org name + domain or phone → attach after confirmation
- Possible duplicates → review queue (`importRows` with `proposedAction: review`)
- Repeat file fingerprint → warning unless operator confirms re-import

## Privacy

- Files never leave the browser except explicit error-report download initiated by the operator.
- Real databases stay outside Git (`scripts/data-preparation/local/`, customer-local paths).
- Spreadsheet parsing uses `src/features/shared/spreadsheet/spreadsheet-parser.ts` — see `docs/security/spreadsheet-parser-decision.md`.

## Backup / reset

- Backup v8 includes `importBatches`, `importRows`, `importMappingProfiles`, leads, contacts.
- **Reset Demo Data** preserves operational imports.
- **Clear All Local Data** wipes everything (separate confirmation).

See also: `import-mapping-profiles.md`, `lead-operations.md`, `troubleshooting.md`.
