# Product Import — Acceptance Summary (aggregates only)

**Date:** 2026-07-03  
**DB:** isolated local profile (`forgeos:jhgomes:product-import-acceptance` recommended)

## Curated workbook (ForgeOS_Product_Catalog_Draft / Products_Import)

| Metric | Value |
| --- | ---: |
| Worksheet rows profiled | 874 |
| Columns mapped | 33 |
| Committed (sample subset) | 3 |
| Valid rows after mapping | 874 |
| Invalid | 0 |
| Source references persisted | 3 |
| Conflicts with existing | varies by SKU overlap |

## Invoice export (artigos csv / xls)

| Metric | Value |
| --- | ---: |
| Rows profiled | ~791 |
| Overlap detected vs curated/committed | yes (strong reference matches) |
| Price conflicts flagged | yes |
| Stock columns | ignored |

## Safety checks

- Inventory item count unchanged after commit
- Stock movement count unchanged
- No ledger entries created

Private values are not recorded in this report.
