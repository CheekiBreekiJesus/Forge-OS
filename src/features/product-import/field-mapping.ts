import type { ProductImportFieldKey } from "@/domain/product-import-types";

/** Header aliases → canonical field keys (normalized lowercase, no accents for matching). */
export const PRODUCT_FIELD_ALIASES: Record<ProductImportFieldKey, string[]> = {
  internalReference: [
    "referencia",
    "referência",
    "reference",
    "ref",
    "sku",
    "codigo",
    "código",
    "internal reference",
    "product code"
  ],
  customerReference: ["customer reference", "ref cliente", "referencia cliente"],
  supplierReference: ["supplier reference", "ref fornecedor", "referencia fornecedor"],
  invoiceReference: ["invoice reference", "ref fatura", "artigo"],
  description: ["descricao", "descrição", "description", "nome", "name", "designacao", "designação", "product_name", "product name"],
  shortDescription: ["nome curto", "short description", "short name", "nome curto 1", "short_name"],
  category: ["familia", "família", "category", "categoria", "family"],
  subcategory: ["subcategory", "subcategoria", "tipo de artigo", "tipo"],
  brand: ["brand", "marca"],
  status: ["status", "estado", "ativo", "active"],
  purchaseCost: [
    "preco de compra",
    "preço de compra",
    "purchase cost",
    "cost",
    "preco de compra s/imposto",
    "preço de compra s/imposto"
  ],
  salePrice: [
    "preco",
    "preço",
    "sale price",
    "sale_price",
    "preco s/imposto",
    "preço s/imposto",
    "preco c/imposto",
    "preço c/imposto",
    "pvp"
  ],
  margin: ["margin", "margem"],
  markup: ["markup", "mark up"],
  discount: ["discount", "desconto"],
  vatRate: ["taxa", "vat", "iva", "imposto", "vat rate"],
  priceDate: ["price date", "data preco", "data preço"],
  currency: ["currency", "moeda"],
  minimumQuantity: ["minimum quantity", "qtd minima", "quantidade minima"],
  priceTier: ["price tier", "escalao", "escalão"],
  baseUnit: ["unidade", "base unit", "unit", "unidade de capacidade", "capacity_uom", "sales_uom"],
  saleUnit: ["unidade de venda", "sale unit", "selling unit"],
  unitsPerPackage: ["units per package", "unidades por embalagem"],
  packagesPerCarton: ["packages per carton", "embalagens por caixa"],
  cartonQuantity: ["carton quantity", "caixas", "qty caixa"],
  palletQuantity: ["pallet quantity", "palete", "pallet"],
  weight: ["weight", "peso"],
  dimensions: ["dimensions", "dimensoes", "dimensões"],
  barcode: ["cod. barras", "codigo barras", "código barras", "barcode", "cod barras"],
  ean: ["ean", "ean13", "gtin"],
  alternativeBarcode: ["alternative barcode", "codigo alternativo", "barcode alternativo"]
};

export function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ");
}

export function suggestFieldMapping(headers: string[]): Record<string, ProductImportFieldKey> {
  const mapping: Record<string, ProductImportFieldKey> = {};
  const usedFields = new Set<ProductImportFieldKey>();

  for (const rawHeader of headers) {
    const normalized = normalizeHeader(rawHeader);
    if (!normalized) continue;

    for (const [field, aliases] of Object.entries(PRODUCT_FIELD_ALIASES) as Array<
      [ProductImportFieldKey, string[]]
    >) {
      if (usedFields.has(field)) continue;
      const match = aliases.some((alias) => normalized === alias || normalized.includes(alias));
      if (match) {
        mapping[rawHeader] = field;
        usedFields.add(field);
        break;
      }
    }
  }

  return mapping;
}

export function applyColumnMapping(
  headers: string[],
  row: string[],
  columnMappings: Record<string, ProductImportFieldKey>
): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((header, index) => {
    const field = columnMappings[header];
    if (field) {
      result[field] = row[index] ?? "";
    }
  });
  return result;
}

export function rawRowToRecord(headers: string[], row: string[]): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((header, index) => {
    record[header] = row[index] ?? "";
  });
  return record;
}
