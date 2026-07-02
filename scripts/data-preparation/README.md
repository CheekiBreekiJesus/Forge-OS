# Lead Database Preparation Pipeline

Reusable local tooling for inspecting, standardizing, deduplicating, and validating lead databases before importing them into ForgeOS or a LeadOps workflow.

## Privacy Boundary

Do not commit customer source files or generated workbooks. Real customer data must remain in local customer folders or private storage. This directory may contain only reusable code, generic configuration, documentation, and synthetic fixtures.

The pipeline accepts runtime paths:

```powershell
python scripts\data-preparation\standardize_leads.py `
  --input "C:\path\to\private\lead-databases" `
  --output "C:\path\to\private\lead-databases\prepared-output" `
  --workbook-name "Lead_Database_Standardized.xlsx"
```

## Scripts

### Leads

- `inspect_sources.py`: inspects Excel, CSV, and TSV files and writes inspection reports.
- `standardize_leads.py`: runs the complete workflow and builds the standardized workbook.
- `deduplicate_leads.py`: writes a duplicate report.
- `build_workbook.py`: builds the workbook from detected sources.
- `validate_output.py`: reopens and validates a generated workbook.
- `lead_pipeline.py`: shared implementation.
- `lead_schema.py`: standard schema, field definitions, aliases, and lookup values.

### Products (staging-only)

- `inspect_product_sources.py`: inspects CSV, TSV, XLSX, and HTML product exports.
- `standardize_products.py`: builds `Product_Database_Standardized.xlsx` for review.
- `product_pipeline.py`: shared implementation (no inventory quantities, no ledger writes).
- `product_schema.py`: canonical field mapping, precedence rules, and exclusions.
- `product_locale.py`: Portuguese decimal/date normalization helpers.

Product profile docs: `docs/data-import/products-import-profile.md`

## Output Workbook

The default workbook name is:

`Lead_Database_Standardized.xlsx`

The workbook includes:

- `SUMMARY`
- `MASTER_LEADS`
- `SOURCE_INDEX`
- one `SOURCE_*` sheet per source sheet/database
- `FIELD_MAPPING`
- `DUPLICATES`
- `IMPORT_ERRORS`
- `LOOKUPS`
- `DATA_DICTIONARY`
- `CHANGE_LOG`

## Normalization Rules

The pipeline normalizes conservatively:

- company names are trimmed and normalized for matching while raw names are preserved;
- emails are lowercased and syntax-flagged without live verification;
- phones are cleaned only when the number length is plausible;
- websites are normalized without network requests;
- all original row data is preserved in `raw_source_data`;
- ambiguous or invalid rows are flagged for review rather than deleted.

## Deduplication

Exact duplicates use confident keys such as email, phone, tax ID, website, or normalized company plus location.

Possible duplicates are grouped separately and marked for manual review. The pipeline does not automatically merge uncertain matches.

## Validation

Validation reopens the generated workbook and checks:

- required sheets exist;
- `MASTER_LEADS` has unique `lead_id` values;
- every master row has source references;
- no formula error strings are present;
- no unintended blank default sheet remains;
- source file modified timestamps are unchanged during a full run.

## Synthetic Tests

Run from the repository root:

```powershell
python -m unittest discover -s scripts\data-preparation\tests
```

The committed fixture uses `.invalid` addresses and does not contain customer data.
