# Lead import troubleshooting

## File rejected

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Only CSV and XLSX" | `.xls` or wrong MIME | Save as `.xlsx` or export CSV |
| "Exceeds 5 MB" | File too large | Split by sheet or category |
| "Exceeds maximum row count" | >5000 rows | Split file or use data-prep pipeline |

## Wrong columns mapped

1. Open mapping section in import wizard.
2. Select correct mapping profile (Municipalities, Hospitality, etc.).
3. Adjust manual overrides → **Apply mapping changes**.
4. Save profile for next time.

## Semicolon CSV misread (legacy)

Fixed in this branch: delimiter auto-detection. Re-export as UTF-8 CSV if issues persist.

## XLSX empty preview

- Choose the populated worksheet (e.g. `Municipalidades`, `Lisboa`).
- Empty placeholder sheets are skipped by default auto-select.

## Duplicate warnings on first import

Expected when:

- Same email appears twice in file
- Email already exists from prior import
- Strong org match (name + domain/phone)

Use checkboxes: attach strong matches, approve possible duplicates.

## Repeat import blocked

Same file fingerprint as a completed batch. Check **Allow re-import anyway** or change file content.

## Sendability differs from segment count

Ensure suppression list is current. Lead table and segments now share suppression-table evaluation.

## Backup missing profiles

Upgrade to backup v8+. Restore via Settings → Import JSON backup.

## Privacy reminder

Do not commit real lead files. Use `scripts/data-preparation/profile-lead-files.mjs` for aggregate inspection only.
