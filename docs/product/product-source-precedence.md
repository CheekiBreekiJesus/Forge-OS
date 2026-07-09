# Product Source Precedence

Configurable policy in `DEFAULT_SOURCE_PRECEDENCE` (`src/domain/product-import-types.ts`).

## Default order

1. **forgeos_approved** — existing Product Master value after manual approval
2. **curated_workbook** — ForgeOS curated XLSX (`Products_Import`)
3. **invoice_export** — legacy invoice CSV/XLS (`artigos`)
4. **inferred_default** — normalization defaults

## Field overrides

- `salePrice` — curated workbook preferred over invoice export for current pricing
- `internalReference` — invoice export may carry legacy references

Every conflict remains visible in the review UI before commit. Field-level resolution: preserve existing, use incoming, or manual review.
