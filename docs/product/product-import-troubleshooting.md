# Product Import Troubleshooting

| Issue | Cause | Action |
| --- | --- | --- |
| Garbled Portuguese characters | Wrong encoding in CSV | Prefer XLSX or UTF-8 CSV; parser uses displayed values |
| Missing leading zeroes in barcodes | Numeric cell format | Verify normalized barcode warning; adjust source column to text |
| All rows invalid | Mapping not applied | Map `internalReference` and `description` |
| Conflicts on every row | Re-importing same SKUs | Choose update-missing-only or preserve-existing per row |
| Stock columns ignored | By design | Inventory import is out of scope |
| Duplicate batch fingerprint | Same file re-uploaded | Review import history; prior batch retained |

Isolated acceptance DB: set `FORGEOS_LOCAL_DB_NAME=forgeos:jhgomes:product-import-acceptance` in `.env.local`.
