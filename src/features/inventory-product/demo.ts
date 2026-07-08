import type {
  BarcodeRecord,
  ImportBatch,
  ImportStagedRow,
  InventoryItemMaster,
  InventoryLedgerEntry,
  InventoryLot,
  InventoryReservation,
  InventoryTransaction,
  LabelPrintJob,
  LabelTemplate,
  PackagingConfiguration,
  ProductMaster,
  ProductVariant,
  StockCountSession,
  StockLocation,
  UnitConversion,
  UnitOfMeasure,
  Warehouse
} from "@/domain/inventory-product-types";
import { createDefaultUnits, postInventoryTransaction } from "@/features/inventory-product/ledger";

export type InventoryProductDemoState = {
  unitOfMeasures: UnitOfMeasure[];
  items: InventoryItemMaster[];
  products: ProductMaster[];
  variants: ProductVariant[];
  packaging: PackagingConfiguration[];
  warehouses: Warehouse[];
  locations: StockLocation[];
  lots: InventoryLot[];
  transactions: InventoryTransaction[];
  entries: InventoryLedgerEntry[];
  reservations: InventoryReservation[];
  stockCounts: StockCountSession[];
  barcodes: BarcodeRecord[];
  labelTemplates: LabelTemplate[];
  labelPrintJobs: LabelPrintJob[];
  importBatch: ImportBatch;
  importRows: ImportStagedRow[];
  conversions: UnitConversion[];
};

const defaultTenantId = "tenant_jh_gomes";
const now = "2026-07-01T09:00:00.000Z";

export function createInventoryProductDemoState(
  tenantId = defaultTenantId
): InventoryProductDemoState {
  const units = createDefaultUnits(tenantId, now);
  const unit = units.find((row) => row.code === "unit")!;
  const box = units.find((row) => row.code === "box")!;
  const pallet = units.find((row) => row.code === "pallet")!;

  const warehouse: Warehouse = {
    active: true,
    code: "WH-A",
    createdAt: now,
    id: "wh_main",
    name: "Main Warehouse",
    tenantId,
    updatedAt: now
  };
  const locations: StockLocation[] = [
    {
      active: true,
      code: "A",
      createdAt: now,
      id: "loc_zone_a",
      locationType: "zone",
      name: "Zone A",
      parentLocationId: null,
      tenantId,
      updatedAt: now,
      warehouseId: warehouse.id
    },
    {
      active: true,
      code: "A-R1-S1",
      createdAt: now,
      id: "loc_a_r1_s1",
      locationType: "shelf",
      name: "Rack 1 / Shelf 1",
      parentLocationId: "loc_zone_a",
      tenantId,
      updatedAt: now,
      warehouseId: warehouse.id
    },
    {
      active: true,
      code: "QA-HOLD",
      createdAt: now,
      id: "loc_quarantine",
      locationType: "quarantine",
      name: "Quality hold",
      parentLocationId: null,
      tenantId,
      updatedAt: now,
      warehouseId: warehouse.id
    }
  ];

  const items: InventoryItemMaster[] = [
    {
      active: true,
      archivedAt: null,
      baseUnitOfMeasureId: unit.id,
      createdAt: now,
      defaultLocationId: "loc_a_r1_s1",
      defaultStockCondition: "available",
      description: "Synthetic clear cup blank used for demo receiving and labels.",
      expiryTrackingPolicy: "optional",
      id: "item_clear_cup_330",
      internalReference: "FG-CUP-330-CLR",
      itemType: "finished_good",
      lotTrackingPolicy: "required",
      minimumStock: 8000,
      name: "Clear cup 330 ml blank",
      preferredStock: 24000,
      stockTrackingEnabled: true,
      tenantId,
      updatedAt: now
    },
    {
      active: true,
      archivedAt: null,
      baseUnitOfMeasureId: unit.id,
      createdAt: now,
      defaultLocationId: "loc_a_r1_s1",
      defaultStockCondition: "available",
      description: "Synthetic cardboard box for packaged cup orders.",
      expiryTrackingPolicy: "none",
      id: "item_box_medium",
      internalReference: "PKG-BOX-M",
      itemType: "packaging_material",
      lotTrackingPolicy: "optional",
      minimumStock: 250,
      name: "Medium shipping box",
      preferredStock: 1000,
      stockTrackingEnabled: true,
      tenantId,
      updatedAt: now
    }
  ];

  const products: ProductMaster[] = [
    {
      active: true,
      archivedAt: null,
      createdAt: now,
      defaultVariantId: "variant_clear_cup_330_box",
      description: "Commercial sellable product linked to a stocked cup item.",
      id: "product_clear_cup_330",
      name: "Clear cup 330 ml",
      productCode: "PROD-CUP-330",
      sellableItemId: "item_clear_cup_330",
      tenantId,
      updatedAt: now
    }
  ];

  const packaging: PackagingConfiguration[] = [
    {
      barcodeByLevel: { box: "05601234001005", pallet: "05601234001012" },
      boxesPerPallet: 24,
      createdAt: now,
      dimensions: { heightMm: 280, lengthMm: 590, widthMm: 390 },
      id: "pkg_cup_330_box",
      innerPacksPerBox: 10,
      itemId: "item_clear_cup_330",
      labelRequired: true,
      materialItemIds: ["item_box_medium"],
      name: "1000-unit box",
      productVariantId: "variant_clear_cup_330_box",
      tenantId,
      unitsPerInnerPack: 100,
      updatedAt: now,
      weightKg: 6.5
    }
  ];

  const variants: ProductVariant[] = [
    {
      createdAt: now,
      customerId: null,
      id: "variant_clear_cup_330_box",
      labelTemplateId: "label_internal_item",
      outputItemId: "item_clear_cup_330",
      packagingConfigurationId: "pkg_cup_330_box",
      priceMetadata: {
        currency: "EUR",
        notes: "Synthetic demo price only.",
        unitPrice: 0.075,
        validFrom: now.slice(0, 10)
      },
      productId: "product_clear_cup_330",
      sellingUnitOfMeasureId: box.id,
      status: "active",
      tenantId,
      updatedAt: now,
      variantType: "packaging"
    }
  ];

  const lots: InventoryLot[] = [
    {
      arrivalDate: "2026-06-25",
      createdAt: now,
      expiryDate: "2028-06-25",
      id: "lot_cup_330_001",
      internalLotNumber: "LOT-2026-001",
      itemId: "item_clear_cup_330",
      manufacturingDate: "2026-06-20",
      notes: "Synthetic approved lot.",
      productionLot: null,
      qualityStatus: "approved",
      supplierLot: "SUP-DEMO-001",
      tenantId,
      updatedAt: now
    }
  ];

  let ledger = postInventoryTransaction(
    { entries: [], transactions: [] },
    {
      entries: [
        {
          baseQuantityDelta: 12000,
          costBasis: 0.041,
          itemId: "item_clear_cup_330",
          itemReferenceSnapshot: "FG-CUP-330-CLR",
          locationId: "loc_a_r1_s1",
          lotId: "lot_cup_330_001",
          productVariantId: "variant_clear_cup_330_box",
          productVariantSnapshot: "PROD-CUP-330 / 1000-unit box",
          quantityDelta: 12000,
          stockCondition: "available",
          unitOfMeasureId: unit.id,
          warehouseId: warehouse.id
        }
      ],
      idempotencyKey: "seed:receipt:cup330:001",
      occurredAt: "2026-06-25T10:00:00.000Z",
      operatorId: "operator_demo",
      reasonCode: "opening_receipt",
      sourceDocumentId: "receipt_demo_001",
      sourceDocumentType: "receipt",
      tenantId,
      transactionType: "receipt"
    },
    (prefix) => `${prefix}_seed_${prefix === "ile" ? "entry" : "receipt"}`
  );

  let qualityEntryIndex = 0;
  ledger = postInventoryTransaction(
    ledger,
    {
      entries: [
        {
          baseQuantityDelta: -1000,
          costBasis: 0.041,
          itemId: "item_clear_cup_330",
          itemReferenceSnapshot: "FG-CUP-330-CLR",
          locationId: "loc_a_r1_s1",
          lotId: "lot_cup_330_001",
          productVariantId: "variant_clear_cup_330_box",
          productVariantSnapshot: "PROD-CUP-330 / 1000-unit box",
          quantityDelta: -1000,
          stockCondition: "available",
          unitOfMeasureId: unit.id,
          warehouseId: warehouse.id
        },
        {
          baseQuantityDelta: 1000,
          costBasis: 0.041,
          itemId: "item_clear_cup_330",
          itemReferenceSnapshot: "FG-CUP-330-CLR",
          locationId: "loc_quarantine",
          lotId: "lot_cup_330_001",
          productVariantId: "variant_clear_cup_330_box",
          productVariantSnapshot: "PROD-CUP-330 / 1000-unit box",
          quantityDelta: 1000,
          stockCondition: "quarantine",
          unitOfMeasureId: unit.id,
          warehouseId: warehouse.id
        }
      ],
      idempotencyKey: "seed:quality-hold:cup330:001",
      occurredAt: "2026-06-26T14:00:00.000Z",
      operatorId: "operator_demo",
      reasonCode: "quality_hold",
      tenantId,
      transactionType: "quality_hold"
    },
    (prefix) =>
      prefix === "ile"
        ? `ile_seed_quality_${(qualityEntryIndex += 1)}`
        : "itx_seed_quality_hold"
  );

  const reservations: InventoryReservation[] = [
    {
      baseQuantity: 2000,
      createdAt: now,
      id: "res_demo_001",
      itemId: "item_clear_cup_330",
      locationId: "loc_a_r1_s1",
      lotId: "lot_cup_330_001",
      productVariantId: "variant_clear_cup_330_box",
      quantity: 2000,
      sourceDocumentId: "sales_order_demo_001",
      sourceDocumentType: "sales_order",
      status: "active",
      tenantId,
      unitOfMeasureId: unit.id,
      updatedAt: now,
      warehouseId: warehouse.id
    }
  ];

  return {
    barcodes: [
      {
        createdAt: now,
        customerId: null,
        id: "bc_internal_cup330",
        itemId: "item_clear_cup_330",
        lotId: null,
        lotSpecific: false,
        normalizedValue: "05601234001005",
        ownershipType: "internal",
        packagingConfigurationId: "pkg_cup_330_box",
        primary: true,
        productVariantId: "variant_clear_cup_330_box",
        replacedBarcodeId: null,
        status: "active",
        supplierId: null,
        symbology: "code128",
        tenantId,
        updatedAt: now,
        validFrom: "2026-06-25",
        validTo: null,
        value: "05601234001005",
        verificationStatus: "valid"
      },
      {
        createdAt: now,
        customerId: null,
        id: "bc_supplier_cup330",
        itemId: "item_clear_cup_330",
        lotId: null,
        lotSpecific: false,
        normalizedValue: "0001234567890",
        ownershipType: "supplier",
        packagingConfigurationId: null,
        primary: false,
        productVariantId: null,
        replacedBarcodeId: null,
        status: "active",
        supplierId: "supplier_demo",
        symbology: "code128",
        tenantId,
        updatedAt: now,
        validFrom: "2026-06-25",
        validTo: null,
        value: "0001234567890",
        verificationStatus: "unchecked"
      }
    ],
    conversions: [
      {
        active: true,
        createdAt: now,
        factor: 1000,
        fromUnitId: box.id,
        id: "conv_box_unit_cup330",
        itemId: "item_clear_cup_330",
        packagingConfigurationId: "pkg_cup_330_box",
        roundingPolicy: "whole",
        tenantId,
        toUnitId: unit.id,
        updatedAt: now
      },
      {
        active: true,
        createdAt: now,
        factor: 24,
        fromUnitId: pallet.id,
        id: "conv_pallet_box_cup330",
        itemId: "item_clear_cup_330",
        packagingConfigurationId: "pkg_cup_330_box",
        roundingPolicy: "whole",
        tenantId,
        toUnitId: box.id,
        updatedAt: now
      }
    ],
    entries: ledger.entries,
    importBatch: {
      createdAt: now,
      duplicateRowCount: 1,
      fileName: "inventory-items-template.csv",
      id: "imp_demo_001",
      importedRowCount: 0,
      importType: "items",
      rejectedRowCount: 1,
      sourceRowCount: 3,
      state: "needs_review",
      tenantId,
      updatedAt: now
    },
    importRows: [
      {
        approvalState: "pending",
        createdAt: now,
        duplicateCandidates: [],
        errors: [],
        id: "improw_demo_001",
        importBatchId: "imp_demo_001",
        normalizedValues: {
          internalReference: "FG-CUP-500-CLR",
          name: "Clear cup 500 ml blank",
          unit: "unit"
        },
        originalValues: {
          internalReference: "FG-CUP-500-CLR",
          name: "Clear cup 500 ml blank",
          unit: "unit"
        },
        proposedAction: "create",
        sourceRowNumber: 2,
        tenantId,
        updatedAt: now,
        warnings: []
      },
      {
        approvalState: "pending",
        createdAt: now,
        duplicateCandidates: ["item_clear_cup_330"],
        errors: ["Duplicate internal reference."],
        id: "improw_demo_002",
        importBatchId: "imp_demo_001",
        normalizedValues: {
          internalReference: "FG-CUP-330-CLR",
          name: "Clear cup 330 ml blank",
          unit: "unit"
        },
        originalValues: {
          internalReference: "FG-CUP-330-CLR",
          name: "Clear cup 330 ml blank",
          unit: "unit"
        },
        proposedAction: "review",
        sourceRowNumber: 3,
        tenantId,
        updatedAt: now,
        warnings: []
      }
    ],
    items,
    labelPrintJobs: [],
    labelTemplates: [
      {
        active: true,
        barcodeSymbology: "code128",
        createdAt: now,
        customerId: null,
        dpi: 203,
        height: 35,
        id: "label_internal_item",
        layout: {
          barcodeField: "barcode",
          subtitleField: "subtitle",
          titleField: "title"
        },
        measurementUnit: "mm",
        name: "Internal item label",
        orientation: "landscape",
        purpose: "item",
        supportedFields: ["title", "subtitle", "barcode", "lot"],
        tenantId,
        updatedAt: now,
        version: 1,
        width: 70
      }
    ],
    locations,
    lots,
    packaging,
    products,
    reservations,
    stockCounts: [
      {
        adjustmentTransactionId: null,
        countedBaseQuantity: 9000,
        createdAt: now,
        differenceBaseQuantity: -1000,
        expectedBaseQuantity: 10000,
        id: "count_demo_001",
        itemId: "item_clear_cup_330",
        locationId: "loc_a_r1_s1",
        lotId: "lot_cup_330_001",
        operatorId: "operator_demo",
        reviewerId: null,
        status: "counted",
        tenantId,
        updatedAt: now,
        warehouseId: warehouse.id
      }
    ],
    transactions: ledger.transactions,
    unitOfMeasures: units,
    variants,
    warehouses: [warehouse]
  };
}
