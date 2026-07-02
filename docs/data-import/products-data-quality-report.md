# Product data quality report (sanitized)

Generated from private JH Gomes artigos sources on 2026-07-02. This report contains **aggregate metrics only**. No product names, codes, prices, barcodes, or inventory quantities are reproduced here.

## Source inventory

| Source | Format | Encoding | Data rows | Columns | Status |
| --- | --- | --- | ---: | ---: | --- |
| artigos csv.csv | Semicolon CSV | Windows-1252 (`cp1252`) | 791 | 18 | **Primary source** |
| artigos html.html | HTML table export | UTF-8 | 791 | 18 (truncated headers) | Superseded by CSV |
| artigos xls.xls | Legacy Excel binary | n/a | n/a | n/a | Ignored — use Python profile or re-export as CSV/XLSX |
| ForgeOS draft workbook (.xlsx) | Multi-sheet workbook | n/a | mixed | mixed | Superseded when artigos CSV is present |

No additional native ERP `.xlsx` export was used for the primary staging run.

## Structural quality

| Metric | Value | Assessment |
| --- | ---: | --- |
| Rows with missing product code | 0 | Good |
| Duplicate product codes | 0 | Good |
| Rows with explicit barcode | 11 (1.4%) | Review — most articles lack barcodes |
| Duplicate barcodes among populated values | 0 | Good |
| Distinct sales units | 2 (`Unidade`, `Milheiro`) | Good |
| Distinct families | 14 | Map to controlled vocabulary |
| Article types | 2 (`Normal`, `Portes de envio`) | Exclude shipping row from product master |
| Packaging hint extractable from designation | 313 (39.6%) | Use regex hint only; confirm with JH Gomes |
| Distinct packaging hint values | 33 | Review outliers |

## Price quality (counts only)

| Metric | Rows | Share |
| --- | ---: | ---: |
| Zero purchase price ex-VAT | 788 | 99.6% |
| Zero sale price ex-VAT | 494 | 62.5% |
| Non-zero sale price ex-VAT | 297 | 37.5% |

Interpretation: the export appears optimized for sales price lists, not purchase costing. Purchase price import requires a separate supplier price source or ERP confirmation.

## Inventory boundary

| Check | Result |
| --- | --- |
| `Stock Atual` column present | Yes |
| Non-zero stock values observed | 0 in inspected snapshot |
| Inventory quantities included in this report | **No** |
| Inventory quantities eligible for staging import | **No** |
| Immutable ledger modified by pipeline | **No** |

## Encoding and locale

- CSV headers use Portuguese labels with `cp1252` encoding.
- Monetary values use Portuguese decimal commas and `€` suffix (e.g. `104,000 €`).
- Dates were not present in the inspected export columns.

## Duplicate analysis

| Key | Exact duplicates | Possible duplicates (designation prefix) |
| --- | ---: | ---: |
| Product code | 0 | n/a |
| Barcode | 0 | n/a |
| Designation prefix (pipeline heuristic) | n/a | 165 groups flagged for manual review |

The Python pipeline groups possible duplicates when normalized designation prefixes match. No automatic merges are performed.

## Row-level validation summary (expected staging distribution)

Based on synthetic fixture calibration and aggregate source metrics:

| Status | Expected driver |
| --- | --- |
| `valid` | Code, designation, sale ex-VAT, and barcode rules pass |
| `review` | Missing barcode, zero purchase price, inferred EAN-from-code, duplicate designation families |
| `invalid` | Missing code or designation |

## Excluded columns

The following source headers are detected and **dropped** by the import profile:

- `Stock Atual`
- `Controlo Remoto 5`

## Related documents

- Field mapping and precedence: `docs/data-import/products-import-profile.md`
- Confirmation questions: `docs/data-import/products-confirmation-questions.md`
