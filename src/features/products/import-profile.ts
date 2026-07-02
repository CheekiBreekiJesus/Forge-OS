export type ProductImportProfileId = "jh-gomes-artigos-v1";

export type ProductImportSourceKind =
  | "standardized_workbook"
  | "native_csv_export"
  | "xlsx_workbook"
  | "html_table_export"
  | "manual_field_mapping";

export type ProductImportPrecedenceRule = {
  rank: number;
  sourceKind: ProductImportSourceKind;
  rule: string;
};

export type ProductImportColumn = {
  key: string;
  required: boolean;
  example: string;
  validation: string;
  excludedFromStaging?: boolean;
};

export type ProductImportProfile = {
  id: ProductImportProfileId;
  name: string;
  version: number;
  delimiter: ";" | "," | "\t";
  encodings: string[];
  acceptedExtensions: string[];
  columns: ProductImportColumn[];
  precedence: ProductImportPrecedenceRule[];
  excludedFields: string[];
  notes: string[];
};

export const JH_GOMES_ARTIGOS_IMPORT_PROFILE: ProductImportProfile = {
  id: "jh-gomes-artigos-v1",
  name: "JH Gomes artigos export",
  version: 1,
  delimiter: ";",
  encodings: ["utf-8", "utf-8-sig", "cp1252", "latin-1"],
  acceptedExtensions: [".csv", ".tsv", ".xlsx", ".xls", ".html", ".htm"],
  columns: [
    { key: "code", required: true, example: "SYN-001", validation: "Unique per tenant" },
    { key: "designation", required: true, example: "Demo cup 330 ml (1000 UN)", validation: "Text" },
    { key: "short_name", required: false, example: "DEMO CUP", validation: "Text" },
    { key: "family", required: false, example: "Plástico", validation: "Controlled vocabulary" },
    { key: "article_type", required: false, example: "Normal", validation: "Flag shipping rows" },
    { key: "barcode", required: false, example: "5601460000001", validation: "8/12/13/14 digits" },
    { key: "purchase_price_ex_vat", required: false, example: "10.5", validation: "Portuguese decimal" },
    { key: "purchase_price_inc_vat", required: false, example: "12.915", validation: "Audit only" },
    { key: "sale_price_ex_vat", required: true, example: "15", validation: "Portuguese decimal" },
    { key: "sale_price_inc_vat", required: false, example: "18.45", validation: "Audit only" },
    { key: "sales_unit", required: false, example: "Unidade", validation: "Unit synonym map" },
    { key: "capacity_unit", required: false, example: "Unidade", validation: "Unit synonym map" },
    { key: "extra_description", required: false, example: "", validation: "Text" },
    { key: "packaging_quantity_hint", required: false, example: "1000", validation: "Extracted from designation" },
    { key: "supplier_reference", required: false, example: "SUP-001", validation: "Resolve to supplier master" },
    { key: "customer_reference", required: false, example: "CUST-001", validation: "Optional customer mapping" }
  ],
  precedence: [
    {
      rank: 1,
      sourceKind: "standardized_workbook",
      rule: "Generated Product_Database_Standardized.xlsx MASTER_PRODUCTS wins over raw exports."
    },
    {
      rank: 2,
      sourceKind: "native_csv_export",
      rule: "Semicolon CSV exports take precedence over HTML table exports."
    },
    {
      rank: 3,
      sourceKind: "xlsx_workbook",
      rule: "Native .xlsx is preferred over legacy .xls for the same snapshot."
    },
    {
      rank: 4,
      sourceKind: "html_table_export",
      rule: "HTML exports are fallback-only because headers and cells may be truncated."
    },
    {
      rank: 5,
      sourceKind: "manual_field_mapping",
      rule: "Explicit FIELD_MAPPING overrides beat automatic alias resolution."
    }
  ],
  excludedFields: [
    "stock_atual",
    "current_stock",
    "inventory_quantity",
    "controlo_remoto"
  ],
  notes: [
    "Staging-only profile. No inventory quantities or immutable ledger writes.",
    "Supplier and customer references are reserved for future master files; not present in the current artigos export.",
    "Use the Python pipeline for legacy .xls and full workbook generation."
  ]
};

export const productImportProfiles: Record<ProductImportProfileId, ProductImportProfile> = {
  "jh-gomes-artigos-v1": JH_GOMES_ARTIGOS_IMPORT_PROFILE
};

export function getProductImportProfile(profileId: ProductImportProfileId = "jh-gomes-artigos-v1") {
  return productImportProfiles[profileId];
}
