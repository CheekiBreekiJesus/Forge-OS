# Product Import

## Supported formats

- **XLS** — legacy invoice software exports (`artigos xls.xls`)
- **XLSX** — curated ForgeOS workbooks
- **CSV** — semicolon or comma delimited (`artigos csv.csv`)

Formulas are not executed; displayed cell text is used. Macros and external links are disabled.

## Workflow

1. Open `/{locale}/products/import`
2. Select file and worksheet
3. Apply or adjust field mapping (save reusable profiles)
4. Preview normalized rows with filters
5. Review duplicates and conflicts
6. Stage rows
7. Commit selected safe records to Product Master
8. Verify in product catalog and import history

## Privacy

Private JH Gomes files stay on disk under `JH Gomes/Databases/Products`. Never commit real files, rows, prices, or barcodes.

## Commit boundary

Writes to Dexie `products` and `productSourceReferences` only. Does **not** write inventory quantities, stock movements, or ledger entries.

## Known limitations

- Canonical `ProductMaster` / variants / barcodes not persisted — staged in import rows
- No destructive rollback when committed products are referenced elsewhere
- Customer-specific pricing sheets remain staged only

See also: [product-field-mapping.md](./product-field-mapping.md), [product-source-precedence.md](./product-source-precedence.md)
