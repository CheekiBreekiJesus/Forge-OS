import { describe, expect, it } from "vitest";
import type { ImportStagedRow, UnitConversion } from "@/domain/inventory-product-types";
import { createInventoryProductDemoState } from "@/features/inventory-product/demo";
import {
  buildStockBalances,
  canPerformInventoryAction,
  convertQuantity,
  createDefaultUnits,
  createLabelPrintJob,
  mockPrintTransport,
  normalizeBarcode,
  postInventoryTransaction,
  renderZplLabel,
  resolveBarcode,
  reverseInventoryTransaction,
  validateBarcodeRecord,
  validateImportRow,
  validateUnitConversions
} from "@/features/inventory-product/ledger";

const tenantId = "tenant_test";
const now = "2026-07-01T10:00:00.000Z";

function idFactory() {
  let index = 0;
  return (prefix: string) => `${prefix}_${(index += 1)}`;
}

describe("inventory product ledger foundation", () => {
  it("validates unit conversions and converts packaging quantities", () => {
    const units = createDefaultUnits(tenantId, now);
    const unit = units.find((row) => row.code === "unit")!;
    const box = units.find((row) => row.code === "box")!;
    const pallet = units.find((row) => row.code === "pallet")!;
    const conversions: UnitConversion[] = [
      {
        active: true,
        createdAt: now,
        factor: 1000,
        fromUnitId: box.id,
        id: "conv_box_unit",
        itemId: "item",
        packagingConfigurationId: null,
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
        id: "conv_pallet_box",
        itemId: "item",
        packagingConfigurationId: null,
        roundingPolicy: "whole",
        tenantId,
        toUnitId: box.id,
        updatedAt: now
      }
    ];

    expect(validateUnitConversions(conversions)).toEqual([]);
    expect(convertQuantity(2, pallet.id, unit.id, conversions, units)).toBe(48000);
  });

  it("rejects circular and invalid unit conversions", () => {
    const conversions: UnitConversion[] = [
      {
        active: true,
        createdAt: now,
        factor: 1,
        fromUnitId: "a",
        id: "a_to_b",
        itemId: null,
        packagingConfigurationId: null,
        roundingPolicy: "none",
        tenantId,
        toUnitId: "b",
        updatedAt: now
      },
      {
        active: true,
        createdAt: now,
        factor: 1,
        fromUnitId: "b",
        id: "b_to_a",
        itemId: null,
        packagingConfigurationId: null,
        roundingPolicy: "none",
        tenantId,
        toUnitId: "a",
        updatedAt: now
      }
    ];

    expect(validateUnitConversions(conversions)).toContain(
      "Unit conversions cannot contain circular definitions."
    );
  });

  it("posts receipts idempotently and rebuilds projected balances from ledger entries", () => {
    const createId = idFactory();
    const entry = {
      baseQuantityDelta: 10,
      costBasis: 1,
      itemId: "item",
      itemReferenceSnapshot: "ITEM-001",
      locationId: "loc",
      lotId: "lot",
      productVariantId: null,
      productVariantSnapshot: null,
      quantityDelta: 10,
      stockCondition: "available" as const,
      unitOfMeasureId: "uom_unit",
      warehouseId: "wh"
    };
    const first = postInventoryTransaction(
      { entries: [], transactions: [] },
      {
        entries: [entry],
        idempotencyKey: "receipt-1",
        occurredAt: now,
        operatorId: "operator",
        reasonCode: "receipt",
        tenantId,
        transactionType: "receipt"
      },
      createId
    );
    const second = postInventoryTransaction(
      first,
      {
        entries: [entry],
        idempotencyKey: "receipt-1",
        occurredAt: now,
        operatorId: "operator",
        reasonCode: "receipt",
        tenantId,
        transactionType: "receipt"
      },
      createId
    );

    expect(second.transactions).toHaveLength(1);
    expect(buildStockBalances(second.entries)[0]?.availableStock).toBe(10);
  });

  it("requires balanced transfers and blocks negative available stock by default", () => {
    const createId = idFactory();
    const state = postInventoryTransaction(
      { entries: [], transactions: [] },
      {
        entries: [
          {
            baseQuantityDelta: 5,
            costBasis: null,
            itemId: "item",
            itemReferenceSnapshot: "ITEM-001",
            locationId: "a",
            lotId: null,
            productVariantId: null,
            productVariantSnapshot: null,
            quantityDelta: 5,
            stockCondition: "available",
            unitOfMeasureId: "uom_unit",
            warehouseId: "wh"
          }
        ],
        idempotencyKey: "seed",
        occurredAt: now,
        operatorId: "operator",
        reasonCode: "receipt",
        tenantId,
        transactionType: "receipt"
      },
      createId
    );

    expect(() =>
      postInventoryTransaction(
        state,
        {
          entries: [
            {
              baseQuantityDelta: -6,
              costBasis: null,
              itemId: "item",
              itemReferenceSnapshot: "ITEM-001",
              locationId: "a",
              lotId: null,
              productVariantId: null,
              productVariantSnapshot: null,
              quantityDelta: -6,
              stockCondition: "available",
              unitOfMeasureId: "uom_unit",
              warehouseId: "wh"
            },
            {
              baseQuantityDelta: 6,
              costBasis: null,
              itemId: "item",
              itemReferenceSnapshot: "ITEM-001",
              locationId: "b",
              lotId: null,
              productVariantId: null,
              productVariantSnapshot: null,
              quantityDelta: 6,
              stockCondition: "available",
              unitOfMeasureId: "uom_unit",
              warehouseId: "wh"
            }
          ],
          idempotencyKey: "transfer",
          occurredAt: now,
          operatorId: "operator",
          reasonCode: "move",
          tenantId,
          transactionType: "location_transfer"
        },
        createId
      )
    ).toThrow("Negative available stock is blocked");
  });

  it("uses reversal transactions instead of editing posted transactions", () => {
    const createId = idFactory();
    const state = postInventoryTransaction(
      { entries: [], transactions: [] },
      {
        entries: [
          {
            baseQuantityDelta: 5,
            costBasis: null,
            itemId: "item",
            itemReferenceSnapshot: "ITEM-001",
            locationId: "a",
            lotId: null,
            productVariantId: null,
            productVariantSnapshot: null,
            quantityDelta: 5,
            stockCondition: "available",
            unitOfMeasureId: "uom_unit",
            warehouseId: "wh"
          }
        ],
        idempotencyKey: "receipt",
        occurredAt: now,
        operatorId: "operator",
        reasonCode: "receipt",
        tenantId,
        transactionType: "receipt"
      },
      createId
    );
    const reversed = reverseInventoryTransaction(
      state,
      state.transaction.id,
      tenantId,
      "operator",
      "mistake",
      createId
    );

    expect(reversed.transaction.transactionType).toBe("reversal");
    expect(reversed.transaction.reversalOfTransactionId).toBe(state.transaction.id);
    expect(buildStockBalances(reversed.entries)[0]?.availableStock).toBe(0);
  });

  it("applies reservations to available stock without mutating physical stock", () => {
    const demo = createInventoryProductDemoState();
    const balances = buildStockBalances(demo.entries, demo.reservations);
    const available = balances.find((row) => row.stockCondition === "available");

    expect(available?.physicalStock).toBe(11000);
    expect(available?.reservedStock).toBe(2000);
    expect(available?.availableStock).toBe(9000);
  });

  it("blocks postings that would drive available stock below reserved quantity", () => {
    const demo = createInventoryProductDemoState();
    const entry = {
      baseQuantityDelta: -9500,
      costBasis: 0.042,
      itemId: "item_clear_cup_330",
      itemReferenceSnapshot: "FG-CUP-330-CLR",
      locationId: "loc_a_r1_s1",
      lotId: "lot_cup_330_001",
      productVariantId: null,
      productVariantSnapshot: null,
      quantityDelta: -9500,
      stockCondition: "available" as const,
      unitOfMeasureId: "uom_unit",
      warehouseId: "wh_main"
    };

    expect(() =>
      postInventoryTransaction(
        { entries: demo.entries, reservations: demo.reservations, transactions: demo.transactions },
        {
          entries: [entry],
          idempotencyKey: "issue-over-reserved",
          occurredAt: now,
          operatorId: "operator",
          reasonCode: "issue",
          tenantId,
          transactionType: "adjustment_decrease"
        },
        idFactory()
      )
    ).toThrow("Negative available stock is blocked by default.");
  });

  it("preserves barcode strings and detects unknown or invalid barcode records", () => {
    const demo = createInventoryProductDemoState();
    expect(normalizeBarcode(" 0001234567890 ")).toBe("0001234567890");
    expect(resolveBarcode(demo.barcodes, "0001234567890").status).toBe("resolved");
    expect(resolveBarcode(demo.barcodes, "999").status).toBe("unknown");
    expect(validateBarcodeRecord({ ...demo.barcodes[0]!, normalizedValue: "bad" })).toContain(
      "Normalized barcode value is inconsistent."
    );
  });

  it("renders ZPL labels and records mock print history without printer access", async () => {
    const demo = createInventoryProductDemoState();
    const template = demo.labelTemplates[0]!;
    const rendered = renderZplLabel(template, {
      barcode: demo.barcodes[0]!.value,
      subtitle: demo.items[0]!.internalReference,
      title: demo.items[0]!.name
    });
    const job = createLabelPrintJob(
      tenantId,
      template,
      { barcode: "000123", subtitle: "ITEM-001", title: "Demo Item" },
      { dpi: 203, id: "mock", name: "Mock", transport: "mock" },
      "operator",
      idFactory()
    );

    await expect(mockPrintTransport()).resolves.toMatchObject({ ok: true });
    expect(rendered.content).toContain("^XA");
    expect(rendered.content).toContain("^BCN");
    expect(job.status).toBe("rendered");
  });

  it("keeps import rows staged when key fields are missing or invalid", () => {
    const row: ImportStagedRow = {
      approvalState: "pending",
      createdAt: now,
      duplicateCandidates: [],
      errors: [],
      id: "row",
      importBatchId: "batch",
      normalizedValues: { cost: "not-a-number", internalReference: "", unit: "" },
      originalValues: { cost: "not-a-number", internalReference: "", unit: "" },
      proposedAction: "create",
      sourceRowNumber: 2,
      tenantId,
      updatedAt: now,
      warnings: []
    };

    const validated = validateImportRow(row);
    expect(validated.proposedAction).toBe("review");
    expect(validated.errors).toEqual([
      "Missing internal reference.",
      "Missing unit of measure.",
      "Invalid cost."
    ]);
  });

  it("models preview permissions without claiming production security", () => {
    expect(canPerformInventoryAction("warehouse_operator", "receive")).toBe(true);
    expect(canPerformInventoryAction("warehouse_operator", "approve")).toBe(false);
    expect(canPerformInventoryAction("auditor", "read_audit")).toBe(true);
    expect(canPerformInventoryAction("auditor", "adjust")).toBe(false);
  });

  it("posts stock count differences through ledger adjustments", () => {
    const demo = createInventoryProductDemoState();
    const count = demo.stockCounts[0]!;
    const next = postInventoryTransaction(
      { entries: demo.entries, transactions: demo.transactions },
      {
        entries: [
          {
            baseQuantityDelta: count.differenceBaseQuantity ?? 0,
            costBasis: null,
            itemId: count.itemId,
            itemReferenceSnapshot: "FG-CUP-330-CLR",
            locationId: count.locationId ?? "loc_a_r1_s1",
            lotId: count.lotId,
            productVariantId: "variant_clear_cup_330_box",
            productVariantSnapshot: "PROD-CUP-330 / 1000-unit box",
            quantityDelta: count.differenceBaseQuantity ?? 0,
            stockCondition: "available",
            unitOfMeasureId: "uom_unit",
            warehouseId: count.warehouseId
          }
        ],
        idempotencyKey: `stock-count:${count.id}`,
        occurredAt: now,
        operatorId: count.operatorId,
        reasonCode: "stock_count_adjustment",
        tenantId: count.tenantId,
        transactionType: "stock_count_adjustment"
      },
      idFactory()
    );

    expect(next.transaction.transactionType).toBe("stock_count_adjustment");
    expect(buildStockBalances(next.entries)[0]?.availableStock).toBe(10000);
  });
});
