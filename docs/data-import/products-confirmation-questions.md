# JH Gomes confirmation questions — product import

Exact questions requiring customer confirmation before any production import or ledger-adjacent writes.

## Product identity

1. Is **Referência** the canonical tenant-wide product code ForgeOS should persist as `sku` / `product_code`, including alphanumeric prefixes such as `M120` and numeric-only references?
2. When **Referência** is a 13-digit EAN (7 observed cases), should ForgeOS treat it as both code and barcode, or keep code and barcode separate?
3. Should **Nome curto 1** be imported, or is **Descrição** sufficient for operational documents?

## Families and article types

4. Provide the approved mapping from **Família** (`Plástico`, `Papel`, `Bio`, `Embalagem`, `Filme`, …) to ForgeOS `ProductCategory` and/or `family`.
5. Confirm that `Portes de envio` rows must be excluded from the product master and handled as a service/fee article instead.
6. What is the business meaning of **Id máscara atributo** and **Taxa** — are they required for quoting or production?

## Barcodes

7. Only ~1.4% of rows contain **Cód. Barras**. Should ForgeOS allow products without barcodes, or is barcode mandatory for warehouse scanning?
8. For articles sold by **Milheiro**, is the barcode per unit, per thousand, or per sales pack?

## Units and packaging

9. Confirm the canonical mapping for **Unidade de Venda** (`Unidade` vs `Milheiro`) and whether **Unidade de Capacidade** should always mirror sales unit.
10. When designation contains `(N UN)`, is `N` the commercial pack size ForgeOS should store as `quantity_per_package` / `units_per_box`?
11. Are there pack sizes not expressed in the `(N UN)` pattern that require a separate packaging master?

## Prices and tax

12. Confirm that **Preço s/Imposto** is the canonical sale price for ForgeOS, not **Preço c/Imposto**.
13. Purchase prices are zero for ~99.6% of rows. Should ForgeOS import purchase price as optional, or wait for a supplier price list?
14. Which VAT rate should ForgeOS assume when validating ex-VAT vs inc-VAT pairs (23% standard, reduced rates, or article-specific)?
15. Are list prices tax-inclusive for end customers but stored ex-VAT internally?

## Supplier and customer references

16. The current artigos export has **no supplier column**. Where is the authoritative supplier reference file, and which key joins to products?
17. Do any products require **customer-specific references** (private labels, customer SKU overrides)? If yes, provide the source file and join key.
18. Should supplier and customer references be imported before products, or can products stage without them?

## Source workflow

19. Confirm that **artigos csv.csv** is the authoritative export over **artigos html.html** when both are generated on the same date.
20. Will future exports be native `.xlsx` from the ERP? If yes, provide a sample to extend the profile.
21. Who signs off on the `FIELD_MAPPING` sheet before enabling confirm-and-import in ForgeOS?

## Inventory and ledger boundary

22. Confirm that **Stock Atual** must never be imported through this product master profile.
23. Opening stock, if needed, will be imported separately via the `opening-stock` template after locations and items exist — correct?
24. Confirm that no automated import from this profile may write stock movements or modify the immutable inventory ledger.

## Operational routing

25. Which **Tipo de Artigo** / family combinations map to ForgeOS `process_type_key` values (`direct-sale`, `label-application`, `repacking-labelling`, `internal-production`)?
26. Are **Descrição Extra** values required on production sheets or quotations?

## Approval gate

27. Name the JH Gomes approver for: field mapping, price canonicalization, packaging rules, and go-live of confirm-and-import.
28. Preferred language for validation messages in the staging UI: `pt-PT` only, or bilingual `pt-PT` + `en`?
