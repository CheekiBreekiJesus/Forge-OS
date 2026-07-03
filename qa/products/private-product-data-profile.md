# Private product data profile (sanitized aggregates)

**Generated for:** JH Gomes product staging milestone  
**Location inspected:** `C:\Users\J35U5\Desktop\JH Gomes\Databases\Products`  
**Privacy:** No prices, barcodes, references, descriptions, or supplier names recorded below.

## Files discovered

| Source label | Format | Worksheets / notes | Row count (approx.) | Column count |
| --- | --- | --- | ---: | ---: |
| `artigos csv.csv` | CSV (cp1252, `;`) | Single sheet | 791 | 18 |
| `artigos xls.xls` | XLS (legacy invoice export) | Single sheet (wide export) | 791+ (source rows) | 18–19 |
| `ForgeOS_Product_Catalog_Draft_2026-07-01.xlsx` | XLSX (curated workbook) | 9 sheets (see below) | varies | 4–33 |
| `artigos html.html` | HTML table | Superseded by CSV | 791 | 19 |
| `Product_Database_Standardized.xlsx` | XLSX (staging output) | Derived — not primary source | — | — |

**Note:** Expected filename `Amaral & Filhos - Distribuição S.A - 01-07-2026.xlsx` was **not** found as a standalone file. Amaral-related data appears as worksheet `Customer_Prices_Amaral` and `Raw_Amaral` inside the curated ForgeOS workbook.

## Curated workbook worksheets

| Worksheet | Rows | Columns | Role |
| --- | ---: | ---: | --- |
| README | 8 | 8 | Documentation |
| Summary | 15 | 8 | Overview |
| Assumptions | 6 | 4 | Mapping assumptions |
| **Products_Import** | 874 | 33 | **Primary curated import target** |
| Customer_Prices_Amaral | 147 | 26 | Customer-specific pricing (staged only) |
| Match_Review | 147 | 14 | Cross-source match review |
| Raw_Amaral | 147 | 14 | Supplier raw feed |
| Raw_XD_Articles | 791 | 19 | Invoice software mirror |
| Data_Dictionary | 14 | 5 | Field definitions |

## Sanitized headers — invoice export

`referencia`, `descricao`, `nome_curto`, `familia`, `tipo_artigo`, `cod_barras`, `taxa`, `preco_compra_sem_imposto`, `preco_compra_com_imposto`, `preco_sem_imposto`, `preco_com_imposto`, `unidade_venda`, `unidade_capacidade`, `stock_atual` (**excluded**), `imposto_lucro`, `controlo_remoto`

## Aggregate quality signals

| Signal | artigos csv | Products_Import |
| --- | ---: | ---: |
| Duplicate references (within file) | present | present |
| Barcode availability | partial | higher |
| Price-field availability | high | high |
| Stock columns | present (**ignored**) | present (**ignored**) |

## Source precedence proposal

1. ForgeOS approved → 2. Curated workbook → 3. Invoice export → 4. Inferred default

Raw profiling JSON: `scripts/data-preparation/reports/product-private-profile.json` (gitignored).
