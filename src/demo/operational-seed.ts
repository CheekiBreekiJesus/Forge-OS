import { jhGomesTenant } from "./seed";
import type {
  ArticleProcessType,
  DocumentTemplate,
  ImportTemplate,
  LabelPackagingRecord,
  OperationalMachineRecord,
  ProductMasterRecord,
  ProductionRouting,
  QualityTemplate,
  QuotationRule,
  StockItem
} from "./operational-types";

export const articleProcessTypes: ArticleProcessType[] = [
  {
    key: "direct-sale",
    name: "Type 1 - Direct sale",
    description: "Purchased article sold without internal preparation.",
    canCreateCustomVariant: true
  },
  {
    key: "label-application",
    name: "Type 2 - Label application",
    description: "Apply customer or regulatory label before dispatch.",
    canCreateCustomVariant: true
  },
  {
    key: "repacking-labelling",
    name: "Type 3 - Repacking and labelling",
    description: "Split, repack, label, and prepare boxes or pallets.",
    canCreateCustomVariant: true
  },
  {
    key: "internal-production",
    name: "Type 4 - Internal production or customization",
    description: "Produce or customize internally using machines and routings.",
    canCreateCustomVariant: true
  }
];

export const operationalProducts: ProductMasterRecord[] = [
  {
    id: "op_prod_pp_cup_330",
    tenantId: jhGomesTenant.id,
    code: "JHG-CUP-PP-330",
    designation: "Personalized PP Cup 330 ml",
    family: "Cups",
    category: "personalized-cups",
    supplierName: "Demo Plastics Supplier",
    purchaseUnit: "box",
    salesUnit: "unit",
    quantityPerPackage: 50,
    quantityPerBox: 1000,
    quantityPerPallet: 24000,
    purchasePrice: 36,
    salePrice: 0.052,
    minimumStock: 10000,
    warehouseLocation: "WH-A-CUPS-01",
    barcode: "5600000000330",
    qrCode: "forgeos://jh-gomes/products/JHG-CUP-PP-330",
    imageUrl: "/demo/products/pp-cup-330.svg",
    status: "active",
    requiredLabelIds: ["label_customer_box"],
    requiredMaterialCodes: ["INK-UV-BLACK"],
    requiredPackagingCodes: ["PACK-BOX-CUP-M"],
    compatibleMachineIds: ["machine_cup_printer_01"],
    processType: "internal-production",
    preparationInstructions:
      "Confirm approved vector artwork, prepare screen, print sample, approve setup, then run production."
  },
  {
    id: "op_prod_kraft_bag_m",
    tenantId: jhGomesTenant.id,
    code: "JHG-BAG-KRAFT-M",
    designation: "Kraft Paper Bag M",
    family: "Bags",
    category: "bags",
    supplierName: "Demo Packaging Supplier",
    purchaseUnit: "box",
    salesUnit: "unit",
    quantityPerPackage: 50,
    quantityPerBox: 250,
    quantityPerPallet: 5000,
    purchasePrice: 18.5,
    salePrice: 0.11,
    minimumStock: 2000,
    warehouseLocation: "WH-B-BAGS-02",
    barcode: "5600000003000",
    qrCode: "forgeos://jh-gomes/products/JHG-BAG-KRAFT-M",
    imageUrl: "/demo/products/kraft-bag-m.svg",
    status: "active",
    requiredLabelIds: ["label_customer_box"],
    requiredMaterialCodes: ["INK-UV-BLACK"],
    requiredPackagingCodes: ["PACK-BOX-BAG-M"],
    compatibleMachineIds: ["machine_orange_label_01"],
    processType: "label-application",
    preparationInstructions:
      "Apply customer label to packed boxes and verify box quantity before palletization."
  },
  {
    id: "op_prod_takeaway_box",
    tenantId: jhGomesTenant.id,
    code: "JHG-PACK-BOX-M",
    designation: "Takeaway Packaging Box M",
    family: "Food packaging",
    category: "takeaway-packaging",
    supplierName: "Demo Packaging Supplier",
    purchaseUnit: "box",
    salesUnit: "unit",
    quantityPerPackage: 25,
    quantityPerBox: 300,
    quantityPerPallet: 7200,
    purchasePrice: 38,
    salePrice: 0.16,
    minimumStock: 1500,
    warehouseLocation: "WH-C-PACK-03",
    barcode: "5600000002000",
    qrCode: "forgeos://jh-gomes/products/JHG-PACK-BOX-M",
    imageUrl: "/demo/products/takeaway-box.svg",
    status: "active",
    requiredLabelIds: ["label_stock_box"],
    requiredMaterialCodes: [],
    requiredPackagingCodes: ["PALLET-EUR"],
    compatibleMachineIds: ["machine_flowpack_01"],
    processType: "direct-sale",
    preparationInstructions:
      "Pick sealed supplier boxes, verify quantity and pallet configuration, then dispatch."
  }
];

export const labelPackagingRecords: LabelPackagingRecord[] = [
  {
    id: "label_customer_box",
    tenantId: jhGomesTenant.id,
    code: "LBL-CUSTOMER-BOX",
    name: "Customer box label",
    dimensions: "100 x 70 mm",
    filePath: "labels/jh-gomes/customer-box/v1.pdf",
    printerType: "thermal-transfer",
    requiredProductInformation: ["product_code", "designation", "quantity", "customer_order"],
    productCodes: ["JHG-CUP-PP-330", "JHG-BAG-KRAFT-M"],
    quantityPerUnit: 0,
    quantityPerPack: 0,
    quantityPerBox: 1,
    version: 1,
    active: true
  },
  {
    id: "label_stock_box",
    tenantId: jhGomesTenant.id,
    code: "LBL-STOCK-BOX",
    name: "Stock box label",
    dimensions: "80 x 50 mm",
    filePath: "labels/jh-gomes/stock-box/v1.pdf",
    printerType: "thermal-transfer",
    requiredProductInformation: ["product_code", "lot", "quantity"],
    productCodes: ["JHG-PACK-BOX-M"],
    quantityPerUnit: 0,
    quantityPerPack: 0,
    quantityPerBox: 1,
    version: 1,
    active: true
  }
];

export const operationalMachines: OperationalMachineRecord[] = [
  {
    id: "machine_orange_label_01",
    tenantId: jhGomesTenant.id,
    identification: "Orange repacking and labelling machine",
    type: "orange-repacking-labelling",
    supportedProductCategories: ["bags", "takeaway-packaging", "accessories"],
    supportedOperations: ["label-application", "repacking-labelling"],
    manualPaths: ["manuals/jh-gomes/orange-label-machine.pdf"],
    standardSetupMinutes: 20,
    standardProductionSpeedPerHour: 850,
    maintenanceStatus: "available",
    commonDefects: ["misaligned label", "box count mismatch"]
  },
  {
    id: "machine_flowpack_01",
    tenantId: jhGomesTenant.id,
    identification: "Flowpack line 01",
    type: "flowpack",
    supportedProductCategories: ["takeaway-packaging", "accessories"],
    supportedOperations: ["repacking-labelling"],
    manualPaths: ["manuals/jh-gomes/flowpack-01.pdf"],
    standardSetupMinutes: 35,
    standardProductionSpeedPerHour: 1200,
    maintenanceStatus: "maintenance-due",
    commonDefects: ["seal temperature drift", "film alignment"]
  },
  {
    id: "machine_cup_printer_01",
    tenantId: jhGomesTenant.id,
    identification: "Cup printer 01",
    type: "cup-printer",
    supportedProductCategories: ["personalized-cups", "paper-cups", "reusable-cups"],
    supportedOperations: ["internal-production"],
    manualPaths: ["manuals/jh-gomes/cup-printer-01.pdf"],
    standardSetupMinutes: 45,
    standardProductionSpeedPerHour: 2500,
    maintenanceStatus: "available",
    commonDefects: ["ink coverage variation", "screen registration", "cup feed jam"]
  }
];

export const productionRoutings: ProductionRouting[] = [
  {
    id: "routing_pp_cup_330_v1",
    tenantId: jhGomesTenant.id,
    productCode: "JHG-CUP-PP-330",
    version: 1,
    active: true,
    steps: [
      {
        id: "route_step_artwork",
        sequence: 10,
        operation: "quality-check",
        standardMinutes: 10,
        instructions: "Verify artwork approval and print color count.",
        requiredLabelIds: [],
        requiredPackagingCodes: []
      },
      {
        id: "route_step_cup_print",
        sequence: 20,
        operation: "internal-production",
        machineType: "cup-printer",
        standardMinutes: 300,
        instructions: "Run cup printer after setup approval sample is accepted.",
        requiredLabelIds: ["label_customer_box"],
        requiredPackagingCodes: ["PACK-BOX-CUP-M"]
      },
      {
        id: "route_step_final_pack",
        sequence: 30,
        operation: "packing",
        standardMinutes: 35,
        instructions: "Pack, label each box, and stage pallets for final verification.",
        requiredLabelIds: ["label_customer_box"],
        requiredPackagingCodes: ["PALLET-EUR"]
      }
    ]
  }
];

export const personalizedCupQuotationRules: QuotationRule[] = [
  {
    id: "quote_rule_pp_clear_cups",
    tenantId: jhGomesTenant.id,
    name: "Clear PP personalized cups",
    cupMaterial: "Polypropylene",
    cupType: "Reusable/disposable event cup",
    capacity: "330 ml",
    color: "Transparent",
    minimumOrderQuantity: 1000,
    artworkCost: 18,
    plateCostPerColor: 28,
    packagingCost: 12,
    transportCost: 35,
    marginRate: 0.22,
    discountRate: 0,
    vatRate: 0.23,
    productionLeadTimeDays: 7,
    validityDays: 15,
    tiers: [
      { minimumQuantity: 1000, unitPrice: 0.068, setupCost: 45, printCostPerColor: 18 },
      { minimumQuantity: 5000, unitPrice: 0.058, setupCost: 40, printCostPerColor: 14 },
      { minimumQuantity: 10000, unitPrice: 0.052, setupCost: 35, printCostPerColor: 12 }
    ]
  }
];

export const stockItems: StockItem[] = [
  {
    id: "stock_pp_cup_330_clear",
    tenantId: jhGomesTenant.id,
    code: "STOCK-PP-330-CLEAR",
    name: "PP cups 330 ml clear",
    stockType: "raw-material",
    warehouse: "Main warehouse",
    location: "WH-A-CUPS-01",
    quantityOnHand: 18000,
    reservedQuantity: 12000,
    minimumStock: 10000,
    unit: "un",
    lot: "DEMO-LOT-330"
  },
  {
    id: "stock_customer_box_label",
    tenantId: jhGomesTenant.id,
    code: "LBL-CUSTOMER-BOX",
    name: "Customer box label",
    stockType: "label",
    warehouse: "Main warehouse",
    location: "WH-L-LABEL-01",
    quantityOnHand: 420,
    reservedQuantity: 24,
    minimumStock: 100,
    unit: "un"
  }
];

export const qualityTemplates: QualityTemplate[] = [
  {
    id: "quality_setup_approval_v1",
    tenantId: jhGomesTenant.id,
    type: "setup-approval",
    name: "Cup printer setup approval",
    version: 1,
    active: true,
    checklist: [
      "Artwork version matches approved quote.",
      "Print colors match job card.",
      "First sample approved by responsible user.",
      "Screen status is ready."
    ]
  },
  {
    id: "quality_order_prep_v1",
    tenantId: jhGomesTenant.id,
    type: "order-preparation-inspection",
    name: "Large order final verification",
    version: 1,
    active: true,
    checklist: [
      "All articles picked.",
      "Labels and packaging checked.",
      "Package and pallet counts confirmed.",
      "Shipping documents attached."
    ]
  }
];

export const documentTemplates: DocumentTemplate[] = [
  {
    id: "doc_quote_v1",
    tenantId: jhGomesTenant.id,
    type: "quotation",
    name: "JH Gomes quotation",
    version: 1,
    brandScope: "tenant",
    printable: true,
    pdfReady: true,
    requiredFields: ["quote_number", "customer", "items", "vat", "total", "valid_until"]
  },
  {
    id: "doc_large_order_prep_v1",
    tenantId: jhGomesTenant.id,
    type: "large-order-preparation-sheet",
    name: "Large order preparation sheet",
    version: 1,
    brandScope: "tenant",
    printable: true,
    pdfReady: true,
    requiredFields: ["order_number", "articles", "boxes", "pallets", "verification"]
  }
];

export const importTemplates: ImportTemplate[] = [
  {
    id: "import_products_v1",
    tenantId: jhGomesTenant.id,
    type: "products",
    name: "Product master import",
    columns: [
      { key: "code", required: true, example: "JHG-CUP-PP-330", validation: "Unique per tenant" },
      { key: "designation", required: true, example: "Personalized PP Cup 330 ml", validation: "Text" },
      { key: "process_type", required: true, example: "internal-production", validation: "Known process type" },
      { key: "minimum_stock", required: true, example: "10000", validation: "Number >= 0" }
    ]
  },
  {
    id: "import_opening_stock_v1",
    tenantId: jhGomesTenant.id,
    type: "opening-stock",
    name: "Opening stock import",
    columns: [
      { key: "item_code", required: true, example: "STOCK-PP-330-CLEAR", validation: "Existing stock item" },
      { key: "location", required: true, example: "WH-A-CUPS-01", validation: "Existing location" },
      { key: "quantity", required: true, example: "18000", validation: "Number >= 0" },
      { key: "lot", required: false, example: "DEMO-LOT-330", validation: "Optional text" }
    ]
  }
];
