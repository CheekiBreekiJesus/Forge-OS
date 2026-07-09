/** Product import staging domain — tenant-scoped, Dexie-persisted. */

export type ProductImportSourceType =
  | "curated_workbook"
  | "invoice_export"
  | "supplier_catalogue"
  | "csv_export"
  | "unknown";

export type ProductImportBatchStatus =
  | "uploaded"
  | "parsed"
  | "needs_mapping"
  | "mapped"
  | "validated"
  | "approved"
  | "importing"
  | "staged"
  | "partially_committed"
  | "completed"
  | "committed"
  | "failed";

export type ProductImportRowStatus =
  | "pending"
  | "valid"
  | "warning"
  | "invalid"
  | "duplicate"
  | "conflict"
  | "staged"
  | "committed"
  | "skipped";

export type ProductImportProposedAction =
  | "create_new"
  | "update_missing_only"
  | "update"
  | "link_source_reference"
  | "attach_barcode"
  | "preserve_existing"
  | "use_incoming"
  | "manual_review"
  | "skip";

export type ProductClassification =
  | "DIRECT_SALE"
  | "RELABEL"
  | "REPACKAGE"
  | "MANUFACTURED"
  | "FLOW_PACK"
  | "SHRINK_WRAP"
  | "PRINTED_CUP"
  | "REVIEW_REQUIRED";

/** Canonical mappable field keys for product import. */
export type ProductImportFieldKey =
  | "internalReference"
  | "customerReference"
  | "supplierReference"
  | "invoiceReference"
  | "description"
  | "shortDescription"
  | "category"
  | "subcategory"
  | "brand"
  | "status"
  | "purchaseCost"
  | "salePrice"
  | "margin"
  | "markup"
  | "discount"
  | "vatRate"
  | "priceDate"
  | "currency"
  | "minimumQuantity"
  | "priceTier"
  | "baseUnit"
  | "saleUnit"
  | "unitsPerPackage"
  | "packagesPerCarton"
  | "cartonQuantity"
  | "palletQuantity"
  | "weight"
  | "dimensions"
  | "barcode"
  | "ean"
  | "alternativeBarcode"
  | "inventoryType"
  | "minimumStock"
  | "defaultLocation"
  | "taxRate"
  | "supplierReference";

export type ProductImportValueMap = Partial<Record<ProductImportFieldKey, string>>;

/** Lightweight inventory item snapshot for duplicate detection during import. */
export type ImportExistingItem = {
  id: string;
  internalReference: string;
  name: string;
  barcode?: string | null;
  salePrice?: number | null;
};

export type ProductImportConflictField = {
  field: ProductImportFieldKey;
  existingValue: string;
  incomingValue: string;
  existingSource: string;
  incomingSource: string;
  resolution?: "preserve_existing" | "use_incoming" | "manual_review";
};

export type ProductImportDuplicateMatch = {
  productId?: string;
  stagedRowId?: string;
  matchType: "exact_reference" | "exact_barcode" | "exact_source_reference" | "possible_description";
  confidence: "strong" | "possible";
  label: string;
};

export type ProductImportBatch = {
  id: string;
  tenantId: string;
  filename: string;
  sourceType: ProductImportSourceType;
  sourceLabel: string;
  fileFingerprint: string;
  worksheet: string;
  mappingProfileId: string | null;
  status: ProductImportBatchStatus;
  totalRows: number;
  validRows: number;
  warningRows: number;
  invalidRows: number;
  duplicateRows: number;
  conflictRows: number;
  stagedRows: number;
  committedRows: number;
  skippedRows: number;
  operatorId: string | null;
  createdAt: string;
  completedAt: string | null;
  updatedAt: string;
};

export type ProductImportRow = {
  id: string;
  tenantId: string;
  batchId: string;
  sourceRowNumber: number;
  originalValues: Record<string, string>;
  normalizedValues: ProductImportValueMap;
  validationErrors: string[];
  warnings: string[];
  duplicateMatches: ProductImportDuplicateMatch[];
  conflictFields: ProductImportConflictField[];
  classification: ProductClassification | null;
  proposedAction: ProductImportProposedAction;
  approvedAction: ProductImportProposedAction | null;
  committedProductId: string | null;
  status: ProductImportRowStatus;
  createdAt: string;
  updatedAt: string;
};

export type ProductMappingProfile = {
  id: string;
  tenantId: string;
  name: string;
  sourceType: ProductImportSourceType;
  sourceLabel: string;
  worksheetPattern: string;
  columnMappings: Record<string, ProductImportFieldKey>;
  createdAt: string;
  updatedAt: string;
};

export type ProductSourceReference = {
  id: string;
  tenantId: string;
  productId: string;
  sourceType: ProductImportSourceType;
  sourceLabel: string;
  sourceReference: string;
  importBatchId: string;
  importedAt: string;
  createdAt: string;
};

export type SourcePrecedenceTier =
  | "forgeos_approved"
  | "curated_workbook"
  | "invoice_export"
  | "inferred_default";

export type SourcePrecedencePolicy = {
  defaultOrder: SourcePrecedenceTier[];
  fieldOverrides: Partial<Record<ProductImportFieldKey, SourcePrecedenceTier[]>>;
};

export const DEFAULT_SOURCE_PRECEDENCE: SourcePrecedencePolicy = {
  defaultOrder: ["forgeos_approved", "curated_workbook", "invoice_export", "inferred_default"],
  fieldOverrides: {
    salePrice: ["forgeos_approved", "curated_workbook", "invoice_export", "inferred_default"],
    internalReference: ["forgeos_approved", "invoice_export", "curated_workbook", "inferred_default"]
  }
};
