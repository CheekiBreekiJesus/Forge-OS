export type TenantScoped = {
  id: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
};

export type InventoryItemType =
  | "raw_material"
  | "packaging_material"
  | "purchased_good"
  | "work_in_progress"
  | "finished_good"
  | "consumable"
  | "spare_part";

export type LotTrackingPolicy = "none" | "optional" | "required";
export type ExpiryTrackingPolicy = "none" | "optional" | "required";

export type UnitOfMeasureCode =
  | "unit"
  | "pack"
  | "box"
  | "pallet"
  | "kilogram"
  | "gram"
  | "litre"
  | "millilitre"
  | "metre"
  | "roll";

export type UnitRoundingPolicy = "none" | "whole" | "up" | "down";

export type UnitOfMeasure = TenantScoped & {
  code: UnitOfMeasureCode;
  name: string;
  symbol: string;
  wholeNumberOnly: boolean;
};

export type UnitConversion = TenantScoped & {
  itemId?: string | null;
  packagingConfigurationId?: string | null;
  fromUnitId: string;
  toUnitId: string;
  factor: number;
  roundingPolicy: UnitRoundingPolicy;
  active: boolean;
};

export type StockCondition =
  | "available"
  | "reserved"
  | "quarantine"
  | "damaged"
  | "scrap"
  | "blocked"
  | "work_in_progress"
  | "loaded"
  | "transit";

export type InventoryItemMaster = TenantScoped & {
  internalReference: string;
  itemType: InventoryItemType;
  name: string;
  description: string;
  baseUnitOfMeasureId: string;
  stockTrackingEnabled: boolean;
  lotTrackingPolicy: LotTrackingPolicy;
  expiryTrackingPolicy: ExpiryTrackingPolicy;
  minimumStock: number;
  preferredStock: number;
  defaultLocationId: string | null;
  defaultStockCondition: StockCondition;
  active: boolean;
  archivedAt: string | null;
};

export type ProductMaster = TenantScoped & {
  productCode: string;
  name: string;
  description: string;
  sellableItemId: string | null;
  defaultVariantId: string | null;
  active: boolean;
  archivedAt: string | null;
};

export type ProductVariantType =
  | "standard"
  | "packaging"
  | "customer_specific"
  | "printed"
  | "relabelled"
  | "flow_packed"
  | "thermoshrink";

export type ProductVariantStatus = "draft" | "active" | "inactive" | "archived";

export type PriceMetadata = {
  currency: "EUR" | "USD" | "GBP";
  unitPrice: number | null;
  validFrom: string | null;
  notes: string;
};

export type ProductVariant = TenantScoped & {
  productId: string;
  variantType: ProductVariantType;
  outputItemId: string;
  customerId: string | null;
  packagingConfigurationId: string | null;
  labelTemplateId: string | null;
  sellingUnitOfMeasureId: string;
  priceMetadata: PriceMetadata;
  status: ProductVariantStatus;
};

export type ExternalReferenceType =
  | "supplier"
  | "customer"
  | "legacy_internal"
  | "accounting"
  | "catalogue"
  | "other";

export type ExternalReferenceOwnerType = "item" | "product" | "product_variant";

export type ExternalReference = TenantScoped & {
  referenceType: ExternalReferenceType;
  ownerType: ExternalReferenceOwnerType;
  ownerId: string;
  itemId: string | null;
  productVariantId: string | null;
  externalReference: string;
  primary: boolean;
  validFrom: string | null;
  validTo: string | null;
  notes: string;
};

export type SupplierItem = TenantScoped & {
  supplierId: string;
  itemId: string;
  supplierReference: string;
  supplierBarcode: string | null;
  purchasingUnitOfMeasureId: string;
  packSize: number;
  purchaseCost: number | null;
  leadTimeDays: number | null;
  preferred: boolean;
};

export type CustomerProduct = TenantScoped & {
  customerId: string;
  productVariantId: string;
  customerReference: string;
  customerBarcode: string | null;
  customerLabelTemplateId: string | null;
  customerPackagingConfigurationId: string | null;
  priceMetadata: PriceMetadata;
  notes: string;
};

export type PackagingConfiguration = TenantScoped & {
  itemId: string | null;
  productVariantId: string | null;
  name: string;
  unitsPerInnerPack: number;
  innerPacksPerBox: number;
  boxesPerPallet: number;
  dimensions: {
    lengthMm: number;
    widthMm: number;
    heightMm: number;
  };
  weightKg: number | null;
  materialItemIds: string[];
  barcodeByLevel: Partial<Record<"unit" | "pack" | "box" | "pallet", string>>;
  labelRequired: boolean;
};

export type LocationType =
  | "warehouse"
  | "zone"
  | "rack"
  | "shelf"
  | "production_staging"
  | "work_in_progress"
  | "quarantine"
  | "damaged"
  | "scrap"
  | "vehicle"
  | "virtual_transit"
  | "external";

export type Warehouse = TenantScoped & {
  code: string;
  name: string;
  active: boolean;
};

export type StockLocation = TenantScoped & {
  warehouseId: string;
  parentLocationId: string | null;
  code: string;
  name: string;
  locationType: LocationType;
  active: boolean;
};

export type InventoryLotQualityStatus = "pending" | "approved" | "quarantine" | "rejected";

export type InventoryLot = TenantScoped & {
  itemId: string;
  internalLotNumber: string;
  supplierLot: string | null;
  productionLot: string | null;
  manufacturingDate: string | null;
  arrivalDate: string | null;
  expiryDate: string | null;
  qualityStatus: InventoryLotQualityStatus;
  notes: string;
};

export type InventoryTransactionType =
  | "receipt"
  | "supplier_return"
  | "location_transfer"
  | "quality_hold"
  | "quality_release"
  | "adjustment_increase"
  | "adjustment_decrease"
  | "stock_count_adjustment"
  | "reversal"
  | "production_issue"
  | "production_return"
  | "production_output"
  | "repackaging"
  | "relabelling"
  | "scrap"
  | "vehicle_loading"
  | "vehicle_unloading"
  | "customer_delivery"
  | "customer_return";

export type InventoryTransactionStatus = "draft" | "posted" | "void";

export type InventoryTransaction = {
  id: string;
  tenantId: string;
  transactionType: InventoryTransactionType;
  occurredAt: string;
  postedAt: string | null;
  status: InventoryTransactionStatus;
  operatorId: string;
  sourceDocumentType: string | null;
  sourceDocumentId: string | null;
  reasonCode: string;
  notes: string;
  idempotencyKey: string;
  reversalOfTransactionId: string | null;
  createdAt: string;
};

export type InventoryLedgerEntry = {
  id: string;
  tenantId: string;
  transactionId: string;
  itemId: string;
  productVariantId: string | null;
  warehouseId: string;
  locationId: string;
  lotId: string | null;
  stockCondition: StockCondition;
  quantityDelta: number;
  unitOfMeasureId: string;
  baseQuantityDelta: number;
  costBasis: number | null;
  entrySequence: number;
  itemReferenceSnapshot: string;
  productVariantSnapshot: string | null;
};

export type InventoryReservationStatus =
  | "planned"
  | "active"
  | "partially_consumed"
  | "consumed"
  | "released"
  | "expired";

export type InventoryReservation = TenantScoped & {
  itemId: string;
  productVariantId: string | null;
  warehouseId: string;
  locationId: string | null;
  lotId: string | null;
  quantity: number;
  unitOfMeasureId: string;
  baseQuantity: number;
  status: InventoryReservationStatus;
  sourceDocumentType: "sales_order" | "delivery" | "production_order";
  sourceDocumentId: string;
};

export type StockCountSessionStatus = "draft" | "counted" | "reviewed" | "posted" | "rejected";

export type StockCountSession = TenantScoped & {
  warehouseId: string;
  locationId: string | null;
  itemId: string;
  lotId: string | null;
  expectedBaseQuantity: number;
  countedBaseQuantity: number | null;
  differenceBaseQuantity: number | null;
  operatorId: string;
  reviewerId: string | null;
  status: StockCountSessionStatus;
  adjustmentTransactionId: string | null;
};

export type BarcodeSymbology = "code128" | "ean13" | "ean8" | "upca" | "qr" | "unknown";
export type BarcodeOwnershipType = "internal" | "supplier" | "customer" | "gtin" | "package" | "temporary";
export type BarcodeStatus = "active" | "replaced" | "invalid" | "retired";
export type BarcodeVerificationStatus = "unchecked" | "valid" | "invalid";

export type BarcodeRecord = TenantScoped & {
  value: string;
  normalizedValue: string;
  symbology: BarcodeSymbology;
  ownershipType: BarcodeOwnershipType;
  itemId: string | null;
  productVariantId: string | null;
  packagingConfigurationId: string | null;
  supplierId: string | null;
  customerId: string | null;
  lotSpecific: boolean;
  lotId: string | null;
  primary: boolean;
  status: BarcodeStatus;
  replacedBarcodeId: string | null;
  validFrom: string | null;
  validTo: string | null;
  verificationStatus: BarcodeVerificationStatus;
};

export type LabelPurpose = "item" | "product" | "lot" | "customer" | "shipping" | "internal";
export type LabelOrientation = "portrait" | "landscape";
export type RenderedLabelFormat = "html" | "zpl";
export type LabelPrintStatus = "requested" | "rendered" | "printed" | "failed";

export type LabelTemplate = TenantScoped & {
  name: string;
  purpose: LabelPurpose;
  customerId: string | null;
  width: number;
  height: number;
  measurementUnit: "mm" | "inch";
  dpi: 203 | 300;
  orientation: LabelOrientation;
  supportedFields: string[];
  barcodeSymbology: BarcodeSymbology;
  layout: {
    titleField: string;
    subtitleField: string;
    barcodeField: string;
  };
  version: number;
  active: boolean;
};

export type LabelData = {
  title: string;
  subtitle: string;
  barcode: string;
  lot?: string | null;
  quantity?: string | null;
};

export type RenderedLabel = {
  format: RenderedLabelFormat;
  content: string;
  warnings: string[];
};

export type PrinterConfiguration = {
  id: string;
  name: string;
  dpi: 203 | 300;
  transport: "mock" | "browser_download";
};

export type PrintResult = {
  ok: boolean;
  status: LabelPrintStatus;
  message: string;
};

export type LabelPrintJob = TenantScoped & {
  templateId: string;
  templateVersion: number;
  itemId: string | null;
  productVariantId: string | null;
  barcodeId: string | null;
  requestedQuantity: number;
  renderedDataSnapshot: LabelData;
  renderedFormat: RenderedLabelFormat;
  printerConfiguration: PrinterConfiguration;
  operatorId: string;
  isReprint: boolean;
  reprintReason: string | null;
  requestedAt: string;
  completedAt: string | null;
  status: LabelPrintStatus;
  error: string | null;
};

export type ImportType =
  | "items"
  | "products"
  | "variants"
  | "suppliers"
  | "supplier_items"
  | "customers"
  | "customer_products"
  | "barcodes"
  | "packaging_configurations"
  | "inventory_opening_balances"
  | "locations"
  | "label_templates";

export type ImportState =
  | "uploaded"
  | "parsed"
  | "needs_mapping"
  | "validating"
  | "needs_review"
  | "approved"
  | "importing"
  | "completed"
  | "partially_completed"
  | "rejected"
  | "failed";

export type ImportRowProposal = "create" | "update" | "skip" | "review";
export type ImportApprovalState = "pending" | "approved" | "rejected";

export type ImportBatch = TenantScoped & {
  importType: ImportType;
  fileName: string;
  state: ImportState;
  sourceRowCount: number;
  importedRowCount: number;
  duplicateRowCount: number;
  rejectedRowCount: number;
};

export type ImportStagedRow = TenantScoped & {
  importBatchId: string;
  sourceRowNumber: number;
  originalValues: Record<string, string>;
  normalizedValues: Record<string, string>;
  errors: string[];
  warnings: string[];
  duplicateCandidates: string[];
  proposedAction: ImportRowProposal;
  approvalState: ImportApprovalState;
};

export type InventoryPermissionRole =
  | "company_owner"
  | "administrator"
  | "product_manager"
  | "warehouse_manager"
  | "warehouse_operator"
  | "purchasing"
  | "auditor";

export type InventoryPermissionAction =
  | "configure"
  | "import"
  | "approve"
  | "adjust"
  | "issue"
  | "manage_products"
  | "receive"
  | "transfer"
  | "count"
  | "scan"
  | "manage_suppliers"
  | "read_audit";

export type InventoryActivityType =
  | "item.created"
  | "product.created"
  | "product_variant.created"
  | "barcode.created"
  | "barcode.replaced"
  | "receipt.posted"
  | "inventory.transferred"
  | "inventory.adjusted"
  | "inventory.reversed"
  | "reservation.created"
  | "reservation.released"
  | "stock_count.completed"
  | "label.rendered"
  | "label.downloaded"
  | "label.reprinted"
  | "import.approved"
  | "import.completed";
