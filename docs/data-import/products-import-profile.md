# Product import profile — JH Gomes artigos

Reusable staging profile for product master imports. This document is sanitized and safe to commit.

## Profile

- **ID:** `jh-gomes-artigos-v1`
- **Version:** 1
- **Scope:** Product codes, designations, families, barcodes, units, packaging hints, ex-VAT prices
- **Out of scope:** Inventory quantities, stock ledger writes, production persistence

## Canonical field mapping

| Source header (PT) | Canonical field | ForgeOS target | Notes |
| --- | --- | --- | --- |
| Referência | `code` | `products.sku` / `products.product_code` | Required, unique per tenant |
| Descrição | `designation` | `products.name` / `products.designation` | Required |
| Nome curto 1 | `short_name` | future column | ERP short label |
| Família | `family` | `products.family` | Map to controlled vocabulary |
| Tipo de Artigo | `article_type` | routing / lifecycle | Exclude `Portes de envio` |
| Cód. Barras | `barcode` | `products.barcode` | Optional EAN/GTIN |
| Preço de Compra s/Imposto | `purchase_price_ex_vat` | `products.purchase_price` | Portuguese decimal |
| Preço de Compra c/Imposto | `purchase_price_inc_vat` | audit only | Not canonical |
| Preço s/Imposto | `sale_price_ex_vat` | `products.sale_price` | Canonical sale price |
| Preço c/Imposto | `sale_price_inc_vat` | audit only | Not canonical |
| Unidade de Venda | `sales_unit` | `products.sales_unit` | Normalize synonyms |
| Unidade de Capacidade | `capacity_unit` | `products.purchase_unit` | Often identical to sales unit |
| Descrição Extra | `extra_description` | notes / future column | Optional |
| Stock Atual | `stock_atual` | **excluded** | Never imported in this profile |
| Fornecedor | `supplier_reference` | `products.supplier_id` | Not in current artigos export |
| Cliente | `customer_reference` | future customer mapping | Not in current artigos export |

Derived fields:

| Derived field | Rule |
| --- | --- |
| `packaging_quantity_hint` | Regex `\((\d+)\s*UN\)` on designation |

## Source precedence

1. `Product_Database_Standardized.xlsx` → `MASTER_PRODUCTS`
2. Native semicolon CSV export
3. Native `.xlsx` workbook
4. HTML table export (fallback; truncated cells require review)
5. Manual `FIELD_MAPPING` overrides
6. Dedicated barcode column beats inferred EAN-shaped codes
7. Ex-VAT prices beat inc-VAT prices
8. Supplier/customer master files override inline references when available

## Runtime locations

| Layer | Path |
| --- | --- |
| Import profile (TS) | `src/features/products/import-profile.ts` |
| Staging parser + validation | `src/features/products/import.ts` |
| Locale normalization | `src/features/products/locale.ts` |
| Spreadsheet readers | `src/features/products/spreadsheet-parser.ts` |
| Staging UI | `src/components/product-import-panel.tsx` |
| Python pipeline | `scripts/data-preparation/product_pipeline.py` |
| Python schema | `scripts/data-preparation/product_schema.py` |
| Synthetic fixture | `scripts/data-preparation/fixtures/products/synthetic_products.csv` |

## Offline commands

```powershell
python scripts\data-preparation\inspect_product_sources.py `
  --input "C:\path\to\private\Products" `
  --output "C:\path\to\private\Products\staging-reports"

python scripts\data-preparation\standardize_products.py `
  --input "C:\path\to\private\Products" `
  --output "C:\path\to\private\Products\staging-output"
```

Private inputs and generated workbooks must stay outside Git.

## Tests

```powershell
python -m unittest discover -s scripts\data-preparation\tests
npm test -- src/features/products/import.test.ts
```
