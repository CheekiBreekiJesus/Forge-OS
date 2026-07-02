import {
  getProductImportProfile,
  type ProductImportProfile
} from "@/features/products/import-profile";
import {
  extractPackagingQuantityHint,
  isProbableEan,
  normalizeHeader,
  normalizeUnit,
  parsePortugueseDecimal
} from "@/features/products/locale";
import { matrixToRecords, type SpreadsheetMatrix } from "@/features/products/spreadsheet-parser";

export type ProductImportRowStatus = "valid" | "review" | "invalid";

export type StagedProductImportRow = {
  rowNumber: number;
  code: string;
  designation: string;
  shortName: string;
  family: string;
  articleType: string;
  barcode: string;
  purchasePriceExVat: string;
  purchasePriceIncVat: string;
  salePriceExVat: string;
  salePriceIncVat: string;
  salesUnit: string;
  capacityUnit: string;
  extraDescription: string;
  packagingQuantityHint: string;
  supplierReference: string;
  customerReference: string;
  status: ProductImportRowStatus;
  validationMessages: string[];
  sourceFile: string;
};

export type ProductImportResult = {
  profile: ProductImportProfile;
  headers: string[];
  sourceFile: string;
  validRows: StagedProductImportRow[];
  reviewRows: StagedProductImportRow[];
  invalidRows: StagedProductImportRow[];
  duplicateCodes: string[];
  duplicateBarcodes: string[];
  excludedInventoryFields: string[];
  metrics: {
    totalRows: number;
    validCount: number;
    reviewCount: number;
    invalidCount: number;
    duplicateCodeCount: number;
    duplicateBarcodeCount: number;
    missingBarcodeCount: number;
    zeroPurchasePriceCount: number;
    zeroSalePriceCount: number;
    packagingHintCount: number;
  };
};

const fieldAliases = {
  code: ["referencia", "referência", "ref", "codigo", "código", "sku", "code"],
  designation: ["descricao", "descrição", "description", "designation"],
  shortName: ["nome curto 1", "nome curto", "short name"],
  family: ["familia", "família", "family"],
  articleType: ["tipo de artigo", "tipo artigo", "article type"],
  barcode: ["cod. barras", "cód. barras", "codigo barras", "código barras", "barcode", "ean", "gtin"],
  purchasePriceExVat: [
    "preco de compra s/imposto",
    "preço de compra s/imposto",
    "preco compra s/iva",
    "preço compra s/iva"
  ],
  purchasePriceIncVat: ["preco de compra c/imposto", "preço de compra c/imposto"],
  salePriceExVat: ["preco s/imposto", "preço s/imposto", "preco venda s/iva", "preço venda s/iva"],
  salePriceIncVat: ["preco c/imposto", "preço c/imposto", "preco venda c/iva", "preço venda c/iva"],
  salesUnit: ["unidade de venda", "unidade venda"],
  capacityUnit: ["unidade de capacidade", "unidade capacidade"],
  extraDescription: ["descricao extra", "descrição extra"],
  supplierReference: ["fornecedor", "supplier", "supplier code"],
  customerReference: ["cliente", "customer", "customer reference"]
} as const;

const excludedInventoryAliases = new Set([
  "stock atual",
  "stock_atual",
  "current stock",
  "inventory quantity",
  "controlo remoto 5",
  "controlo remoto"
]);

export function parseProductSpreadsheet(
  matrix: SpreadsheetMatrix,
  sourceFile: string,
  profile = getProductImportProfile()
): ProductImportResult {
  const headers = matrix[0]?.map(normalizeHeader) ?? [];
  const excludedInventoryFields = headers.filter((header) => excludedInventoryAliases.has(header));
  const records = matrixToRecords(matrix);
  const mappedRows = records
    .map((record) => mapImportRow(record, sourceFile))
    .filter((row) => row.articleType.toLowerCase() !== "portes de envio");

  const duplicateCodes = findDuplicates(mappedRows.map((row) => row.code));
  const duplicateBarcodes = findDuplicates(
    mappedRows.map((row) => row.barcode).filter((value) => value.length > 0)
  );
  const duplicateCodeSet = new Set(duplicateCodes);
  const duplicateBarcodeSet = new Set(duplicateBarcodes);

  const classifiedRows = mappedRows.map((row) => {
    const messages = [...row.validationMessages];

    if (duplicateCodeSet.has(row.code)) {
      messages.push("Duplicate product code detected.");
    }

    if (row.barcode && duplicateBarcodeSet.has(row.barcode)) {
      messages.push("Duplicate barcode detected.");
    }

    if (messages.length > 0 && row.status === "valid") {
      return {
        ...row,
        status: "review" as const,
        validationMessages: messages
      };
    }

    return {
      ...row,
      validationMessages: messages
    };
  });

  const validRows = classifiedRows.filter((row) => row.status === "valid");
  const reviewRows = classifiedRows.filter((row) => row.status === "review");
  const invalidRows = classifiedRows.filter((row) => row.status === "invalid");

  return {
    profile,
    headers,
    sourceFile,
    validRows,
    reviewRows,
    invalidRows,
    duplicateCodes,
    duplicateBarcodes,
    excludedInventoryFields,
    metrics: {
      totalRows: classifiedRows.length,
      validCount: validRows.length,
      reviewCount: reviewRows.length,
      invalidCount: invalidRows.length,
      duplicateCodeCount: duplicateCodes.length,
      duplicateBarcodeCount: duplicateBarcodes.length,
      missingBarcodeCount: classifiedRows.filter((row) => !row.barcode).length,
      zeroPurchasePriceCount: classifiedRows.filter((row) => !row.purchasePriceExVat || row.purchasePriceExVat === "0").length,
      zeroSalePriceCount: classifiedRows.filter((row) => !row.salePriceExVat || row.salePriceExVat === "0").length,
      packagingHintCount: classifiedRows.filter((row) => row.packagingQuantityHint).length
    }
  };
}

function mapImportRow(record: Record<string, string>, sourceFile: string): StagedProductImportRow {
  const get = (field: keyof typeof fieldAliases) => {
    const aliases = fieldAliases[field];
    const header = Object.keys(record).find((key) => (aliases as readonly string[]).includes(key));
    return header ? sanitizeCell(record[header] ?? "") : "";
  };

  const messages: string[] = [];
  const code = get("code");
  const designation = get("designation");
  const articleType = get("articleType");

  if (!code) {
    messages.push("Product code is required.");
  }

  if (!designation) {
    messages.push("Designation is required.");
  }

  const purchaseEx = parsePortugueseDecimal(get("purchasePriceExVat"));
  const purchaseInc = parsePortugueseDecimal(get("purchasePriceIncVat"));
  const saleEx = parsePortugueseDecimal(get("salePriceExVat"));
  const saleInc = parsePortugueseDecimal(get("salePriceIncVat"));

  for (const [label, parsed] of [
    ["Purchase price ex-VAT", purchaseEx],
    ["Purchase price inc-VAT", purchaseInc],
    ["Sale price ex-VAT", saleEx],
    ["Sale price inc-VAT", saleInc]
  ] as const) {
    if (parsed.status === "invalid") {
      messages.push(`${label} has an invalid Portuguese number format.`);
    }
  }

  if (!saleEx.normalized || saleEx.normalized === "0") {
    messages.push("Sale price ex-VAT is missing or zero.");
  }

  if (!purchaseEx.normalized || purchaseEx.normalized === "0") {
    messages.push("Purchase price ex-VAT is missing or zero.");
  }

  let barcode = get("barcode").replace(/\D/g, "");
  if (!barcode && isProbableEan(code)) {
    barcode = code.replace(/\D/g, "");
    messages.push("Barcode inferred from EAN-shaped product code.");
  }

  if (barcode && !isProbableEan(barcode)) {
    messages.push("Barcode length is not a valid EAN/GTIN.");
  }

  const packaging = extractPackagingQuantityHint(designation);
  if (packaging.status === "invalid") {
    messages.push("Packaging quantity hint could not be parsed.");
  }

  const status: ProductImportRowStatus =
    messages.some((message) => message.includes("required")) ||
    !saleEx.normalized ||
    saleEx.normalized === "0"
      ? "invalid"
      : messages.length > 0
        ? "review"
        : "valid";

  return {
    rowNumber: Number(record.__row ?? 0),
    code,
    designation,
    shortName: get("shortName"),
    family: get("family"),
    articleType,
    barcode,
    purchasePriceExVat: purchaseEx.normalized,
    purchasePriceIncVat: purchaseInc.normalized,
    salePriceExVat: saleEx.normalized,
    salePriceIncVat: saleInc.normalized,
    salesUnit: normalizeUnit(get("salesUnit")),
    capacityUnit: normalizeUnit(get("capacityUnit")),
    extraDescription: get("extraDescription"),
    packagingQuantityHint: packaging.normalized,
    supplierReference: get("supplierReference"),
    customerReference: get("customerReference"),
    status,
    validationMessages: messages,
    sourceFile
  };
}

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) {
      continue;
    }

    if (seen.has(normalized)) {
      duplicates.add(normalized);
    } else {
      seen.add(normalized);
    }
  }

  return [...duplicates];
}

function sanitizeCell(value: string): string {
  return value.replace(/\p{C}/gu, "").trim();
}

export function validateImportFile(file: File, profile = getProductImportProfile()): string | null {
  const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!profile.acceptedExtensions.includes(extension)) {
    return "Unsupported file type.";
  }

  if (file.size > 5 * 1024 * 1024) {
    return "File exceeds the 5 MB staging preview limit.";
  }

  return null;
}
