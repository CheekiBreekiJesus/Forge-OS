import type { ProductCategory } from "./types";

export type ArticleProcessTypeKey =
  | "direct-sale"
  | "label-application"
  | "repacking-labelling"
  | "internal-production";

export type ProductLifecycleStatus = "active" | "discontinued";

export type StockMovementType =
  | "receipt"
  | "consumption"
  | "production-output"
  | "transfer"
  | "adjustment"
  | "reservation"
  | "cycle-count"
  | "full-count";

export type QualityWorkflowType =
  | "incoming-goods-inspection"
  | "setup-approval"
  | "in-process-inspection"
  | "final-production-inspection"
  | "order-preparation-inspection"
  | "non-conformity-report"
  | "scrap-waste-record"
  | "downtime-record"
  | "corrective-action";

export type DocumentTemplateType =
  | "quotation"
  | "sales-order"
  | "production-order"
  | "machine-setup-sheet"
  | "production-log"
  | "quality-inspection"
  | "non-conformity-report"
  | "waste-record"
  | "downtime-record"
  | "picking-list"
  | "large-order-preparation-sheet"
  | "packing-list"
  | "inventory-count-sheet"
  | "goods-receipt";

export type ImportTemplateType =
  | "products"
  | "suppliers"
  | "customers"
  | "labels"
  | "machines"
  | "warehouses"
  | "locations"
  | "opening-stock"
  | "quotation-pricing-rules"
  | "product-bills-of-materials"
  | "product-routings";

export type ArticleProcessType = {
  key: ArticleProcessTypeKey;
  name: string;
  description: string;
  canCreateCustomVariant: boolean;
};

export type ProductMasterRecord = {
  id: string;
  tenantId: string;
  code: string;
  designation: string;
  family: string;
  category: ProductCategory;
  supplierName: string;
  purchaseUnit: string;
  salesUnit: string;
  quantityPerPackage: number;
  quantityPerBox: number;
  quantityPerPallet: number;
  purchasePrice: number;
  salePrice: number;
  minimumStock: number;
  warehouseLocation: string;
  barcode: string;
  qrCode: string;
  imageUrl: string;
  status: ProductLifecycleStatus;
  requiredLabelIds: string[];
  requiredMaterialCodes: string[];
  requiredPackagingCodes: string[];
  compatibleMachineIds: string[];
  processType: ArticleProcessTypeKey;
  preparationInstructions: string;
};

export type LabelPackagingRecord = {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  dimensions: string;
  filePath: string;
  printerType: string;
  requiredProductInformation: string[];
  productCodes: string[];
  quantityPerUnit: number;
  quantityPerPack: number;
  quantityPerBox: number;
  version: number;
  active: boolean;
};

export type OperationalMachineRecord = {
  id: string;
  tenantId: string;
  identification: string;
  type: "orange-repacking-labelling" | "flowpack" | "cup-printer";
  supportedProductCategories: ProductCategory[];
  supportedOperations: ArticleProcessTypeKey[];
  manualPaths: string[];
  standardSetupMinutes: number;
  standardProductionSpeedPerHour: number;
  maintenanceStatus: "available" | "maintenance-due" | "blocked";
  commonDefects: string[];
};

export type ProductionRoutingStep = {
  id: string;
  sequence: number;
  operation: ArticleProcessTypeKey | "quality-check" | "packing";
  machineType?: OperationalMachineRecord["type"];
  standardMinutes: number;
  instructions: string;
  requiredLabelIds: string[];
  requiredPackagingCodes: string[];
};

export type ProductionRouting = {
  id: string;
  tenantId: string;
  productCode: string;
  version: number;
  active: boolean;
  steps: ProductionRoutingStep[];
};

export type QuotationRuleTier = {
  minimumQuantity: number;
  unitPrice: number;
  setupCost: number;
  printCostPerColor: number;
};

export type QuotationRule = {
  id: string;
  tenantId: string;
  name: string;
  cupMaterial: string;
  cupType: string;
  capacity: string;
  color: string;
  minimumOrderQuantity: number;
  artworkCost: number;
  plateCostPerColor: number;
  packagingCost: number;
  transportCost: number;
  marginRate: number;
  discountRate: number;
  vatRate: number;
  productionLeadTimeDays: number;
  validityDays: number;
  tiers: QuotationRuleTier[];
};

export type QuotationInput = {
  quantity: number;
  printColorCount: number;
  manualUnitPriceOverride?: number;
  overrideReason?: string;
};

export type OperationalQuoteBreakdown = {
  selectedTier: QuotationRuleTier;
  productCost: number;
  setupCost: number;
  printingCost: number;
  plateCost: number;
  artworkCost: number;
  packagingCost: number;
  transportCost: number;
  margin: number;
  discount: number;
  subtotal: number;
  vat: number;
  total: number;
  validUntilDays: number;
  auditLog: string[];
};

export type StockItem = {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  stockType:
    | "raw-material"
    | "component"
    | "finished-product"
    | "packaging"
    | "label"
    | "spare-part";
  warehouse: string;
  location: string;
  quantityOnHand: number;
  reservedQuantity: number;
  minimumStock: number;
  unit: string;
  batch?: string;
  lot?: string;
};

export type StockMovementInput = {
  movementType: StockMovementType;
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  notes: string;
};

export type ProductionResultInput = {
  plannedQuantity: number;
  producedQuantity: number;
  rejectedQuantity: number;
  scrapQuantity: number;
  setupMinutes: number;
  productionMinutes: number;
  downtimeMinutes: number;
};

export type ProductionMetrics = {
  completionRate: number;
  scrapRate: number;
  rejectionRate: number;
  setupMinutes: number;
  productionMinutes: number;
  downtimeMinutes: number;
  unitsPerHour: number;
  estimatedVsActualPerformance: number;
};

export type QualityTemplate = {
  id: string;
  tenantId: string;
  type: QualityWorkflowType;
  name: string;
  version: number;
  active: boolean;
  checklist: string[];
};

export type DocumentTemplate = {
  id: string;
  tenantId: string;
  type: DocumentTemplateType;
  name: string;
  version: number;
  brandScope: "tenant";
  printable: boolean;
  pdfReady: boolean;
  requiredFields: string[];
};

export type ImportTemplate = {
  id: string;
  tenantId: string;
  type: ImportTemplateType;
  name: string;
  columns: Array<{
    key: string;
    required: boolean;
    example: string;
    validation: string;
  }>;
};
