# Lead Import

## Private file handling

- Import files stay in the browser; they are **not** committed to Git.
- Place real customer CSV/XLSX files under ignored local paths only (see `scripts/data-preparation/local/`).
- Fixtures in `e2e/fixtures/` use synthetic `.example.invalid` addresses only.

## Steps

1. Open `/pt-PT/leadops` or `/en/leadops`.
2. Upload CSV or XLSX (max 5 MB).
3. Review header mapping and validation counts.
4. Confirm import; verify organizations appear in the lead list.
5. Use import history to audit batches.

## Validation

- Valid, review, invalid, duplicate, and missing-email rows are classified.
- Duplicate emails are flagged; strong organization matches can attach to existing records.
- Repeat imports of the same file fingerprint warn unless explicitly allowed.

## Backup

Import batches, rows, leads, and contacts are included in JSON backup v5 (`emailSuppressions` included).

## Limitations

- No automatic provider bounce handling on import.
- Enrichment and external website lookups are not performed.
