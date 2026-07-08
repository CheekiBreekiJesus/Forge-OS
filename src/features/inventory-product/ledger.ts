import type {
  BarcodeRecord,
  ImportStagedRow,
  InventoryLedgerEntry,
  InventoryPermissionAction,
  InventoryPermissionRole,
  InventoryReservation,
  InventoryTransaction,
  InventoryTransactionType,
  LabelData,
  LabelPrintJob,
  LabelTemplate,
  PrinterConfiguration,
  PrintResult,
  RenderedLabel,
  StockCondition,
  UnitConversion,
  UnitOfMeasure
} from "@/domain/inventory-product-types";

type IdFactory = (prefix: string) => string;

export type LedgerState = {
  transactions: InventoryTransaction[];
  entries: InventoryLedgerEntry[];
  reservations?: InventoryReservation[];
};

export type LedgerEntryInput = Omit<
  InventoryLedgerEntry,
  "id" | "tenantId" | "transactionId" | "entrySequence"
>;

export type PostTransactionInput = {
  tenantId: string;
  transactionType: InventoryTransactionType;
  occurredAt: string;
  operatorId: string;
  sourceDocumentType?: string | null;
  sourceDocumentId?: string | null;
  reasonCode: string;
  notes?: string;
  idempotencyKey: string;
  entries: LedgerEntryInput[];
  allowNegativeAvailable?: boolean;
  overrideReason?: string;
};

export type StockBalance = {
  tenantId: string;
  itemId: string;
  productVariantId: string | null;
  warehouseId: string;
  locationId: string;
  lotId: string | null;
  stockCondition: StockCondition;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
  workInProgressStock: number;
  finishedStock: number;
  quarantinedStock: number;
  damagedStock: number;
  vehicleStock: number;
};

export type BarcodeResolution =
  | { status: "resolved"; barcode: BarcodeRecord }
  | { status: "unknown"; normalizedValue: string }
  | { status: "ambiguous"; normalizedValue: string; matches: BarcodeRecord[] };

const permissionMatrix: Record<InventoryPermissionRole, Set<InventoryPermissionAction>> = {
  administrator: new Set([
    "configure",
    "import",
    "approve",
    "adjust",
    "manage_products",
    "receive",
    "transfer",
    "count",
    "scan",
    "manage_suppliers",
    "read_audit"
  ]),
  auditor: new Set(["read_audit"]),
  company_owner: new Set([
    "configure",
    "import",
    "approve",
    "adjust",
    "manage_products",
    "receive",
    "transfer",
    "count",
    "scan",
    "manage_suppliers",
    "read_audit"
  ]),
  product_manager: new Set(["manage_products", "scan", "read_audit"]),
  purchasing: new Set(["manage_suppliers", "receive", "read_audit"]),
  warehouse_manager: new Set(["receive", "transfer", "count", "adjust", "approve", "scan", "read_audit"]),
  warehouse_operator: new Set(["receive", "transfer", "count", "scan"])
};

export function createDefaultUnits(tenantId: string, now: string): UnitOfMeasure[] {
  const units: Array<[UnitOfMeasure["code"], string, string, boolean]> = [
    ["unit", "Unit", "un", true],
    ["pack", "Pack", "pack", true],
    ["box", "Box", "box", true],
    ["pallet", "Pallet", "plt", true],
    ["kilogram", "Kilogram", "kg", false],
    ["gram", "Gram", "g", false],
    ["litre", "Litre", "l", false],
    ["millilitre", "Millilitre", "ml", false],
    ["metre", "Metre", "m", false],
    ["roll", "Roll", "roll", true]
  ];

  return units.map(([code, name, symbol, wholeNumberOnly]) => ({
    code,
    createdAt: now,
    id: `uom_${code}`,
    name,
    symbol,
    tenantId,
    updatedAt: now,
    wholeNumberOnly
  }));
}

export function validateUnitConversions(conversions: UnitConversion[]): string[] {
  const errors: string[] = [];
  const edges = new Map<string, string[]>();

  for (const conversion of conversions.filter((row) => row.active)) {
    if (conversion.factor <= 0) {
      errors.push(`Conversion ${conversion.id} must have a positive factor.`);
    }
    if (conversion.fromUnitId === conversion.toUnitId) {
      errors.push(`Conversion ${conversion.id} cannot use the same source and destination unit.`);
    }
    edges.set(conversion.fromUnitId, [
      ...(edges.get(conversion.fromUnitId) ?? []),
      conversion.toUnitId
    ]);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(unitId: string): boolean {
    if (visiting.has(unitId)) return true;
    if (visited.has(unitId)) return false;
    visiting.add(unitId);
    for (const next of edges.get(unitId) ?? []) {
      if (visit(next)) return true;
    }
    visiting.delete(unitId);
    visited.add(unitId);
    return false;
  }

  for (const unitId of edges.keys()) {
    if (visit(unitId)) {
      errors.push("Unit conversions cannot contain circular definitions.");
      break;
    }
  }

  return errors;
}

export function convertQuantity(
  quantity: number,
  fromUnitId: string,
  toUnitId: string,
  conversions: UnitConversion[],
  units: UnitOfMeasure[]
): number {
  if (fromUnitId === toUnitId) return quantity;
  const validationErrors = validateUnitConversions(conversions);
  if (validationErrors.length > 0) {
    throw new Error(validationErrors.join(" "));
  }

  const queue: Array<{ unitId: string; value: number }> = [{ unitId: fromUnitId, value: quantity }];
  const visited = new Set<string>();
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.unitId === toUnitId) {
      const targetUnit = units.find((unit) => unit.id === toUnitId);
      if (targetUnit?.wholeNumberOnly && !Number.isInteger(current.value)) {
        throw new Error("Conversion result violates whole-unit requirements.");
      }
      return current.value;
    }
    if (visited.has(current.unitId)) continue;
    visited.add(current.unitId);
    for (const conversion of conversions.filter((row) => row.active && row.fromUnitId === current.unitId)) {
      let value = current.value * conversion.factor;
      if (conversion.roundingPolicy === "up") value = Math.ceil(value);
      if (conversion.roundingPolicy === "down") value = Math.floor(value);
      if (conversion.roundingPolicy === "whole") value = Math.round(value);
      queue.push({ unitId: conversion.toUnitId, value });
    }
  }

  throw new Error(`No conversion path from ${fromUnitId} to ${toUnitId}.`);
}

export function buildStockBalances(
  entries: InventoryLedgerEntry[],
  reservations: InventoryReservation[] = []
): StockBalance[] {
  const map = new Map<string, StockBalance>();

  function key(entry: Pick<InventoryLedgerEntry, "tenantId" | "itemId" | "productVariantId" | "warehouseId" | "locationId" | "lotId" | "stockCondition">) {
    return [
      entry.tenantId,
      entry.itemId,
      entry.productVariantId ?? "",
      entry.warehouseId,
      entry.locationId,
      entry.lotId ?? "",
      entry.stockCondition
    ].join("|");
  }

  for (const entry of entries) {
    const balanceKey = key(entry);
    const existing =
      map.get(balanceKey) ??
      {
        availableStock: 0,
        damagedStock: 0,
        finishedStock: 0,
        itemId: entry.itemId,
        locationId: entry.locationId,
        lotId: entry.lotId,
        physicalStock: 0,
        productVariantId: entry.productVariantId,
        quarantinedStock: 0,
        reservedStock: 0,
        stockCondition: entry.stockCondition,
        tenantId: entry.tenantId,
        vehicleStock: 0,
        warehouseId: entry.warehouseId,
        workInProgressStock: 0
      };
    existing.physicalStock += entry.baseQuantityDelta;
    if (entry.stockCondition === "available") existing.availableStock += entry.baseQuantityDelta;
    if (entry.stockCondition === "reserved") existing.reservedStock += entry.baseQuantityDelta;
    if (entry.stockCondition === "quarantine") existing.quarantinedStock += entry.baseQuantityDelta;
    if (entry.stockCondition === "damaged") existing.damagedStock += entry.baseQuantityDelta;
    if (entry.stockCondition === "work_in_progress") existing.workInProgressStock += entry.baseQuantityDelta;
    if (entry.stockCondition === "loaded") existing.vehicleStock += entry.baseQuantityDelta;
    if (entry.stockCondition === "available" && entry.productVariantId) {
      existing.finishedStock += entry.baseQuantityDelta;
    }
    map.set(balanceKey, existing);
  }

  for (const reservation of reservations.filter((row) => row.status === "active" || row.status === "partially_consumed")) {
    for (const balance of map.values()) {
      const sameItem = balance.tenantId === reservation.tenantId && balance.itemId === reservation.itemId;
      const sameLocation = !reservation.locationId || balance.locationId === reservation.locationId;
      const sameLot = !reservation.lotId || balance.lotId === reservation.lotId;
      if (sameItem && sameLocation && sameLot && balance.stockCondition === "available") {
        balance.reservedStock += reservation.baseQuantity;
        balance.availableStock -= reservation.baseQuantity;
        break;
      }
    }
  }

  return [...map.values()].sort((a, b) =>
    `${a.itemId}${a.locationId}${a.stockCondition}`.localeCompare(
      `${b.itemId}${b.locationId}${b.stockCondition}`
    )
  );
}

function hasNegativeAggregatedAvailable(balances: StockBalance[]): boolean {
  const availableByLocation = new Map<string, number>();
  for (const balance of balances) {
    if (balance.stockCondition !== "available") continue;
    const key = [
      balance.tenantId,
      balance.itemId,
      balance.warehouseId,
      balance.locationId,
      balance.lotId ?? ""
    ].join("|");
    availableByLocation.set(
      key,
      (availableByLocation.get(key) ?? 0) + balance.availableStock
    );
  }
  return [...availableByLocation.values()].some((available) => available < -0.000001);
}

export function postInventoryTransaction(
  state: LedgerState,
  input: PostTransactionInput,
  createId: IdFactory = (prefix) => `${prefix}_${Date.now()}`
): LedgerState & { transaction: InventoryTransaction; entries: InventoryLedgerEntry[] } {
  const existing = state.transactions.find(
    (transaction) => transaction.tenantId === input.tenantId && transaction.idempotencyKey === input.idempotencyKey
  );
  if (existing) {
    return {
      entries: state.entries,
      transaction: existing,
      transactions: state.transactions
    };
  }

  if (input.entries.length === 0) {
    throw new Error("A transaction requires at least one ledger entry.");
  }
  if (input.transactionType === "location_transfer") {
    const total = input.entries.reduce((sum, entry) => sum + entry.baseQuantityDelta, 0);
    if (Math.abs(total) > 0.000001) {
      throw new Error("Location transfers must be balanced.");
    }
  }

  const postedAt = new Date().toISOString();
  const transaction: InventoryTransaction = {
    createdAt: postedAt,
    id: createId("itx"),
    idempotencyKey: input.idempotencyKey,
    notes: input.notes ?? "",
    occurredAt: input.occurredAt,
    operatorId: input.operatorId,
    postedAt,
    reasonCode: input.reasonCode,
    reversalOfTransactionId: null,
    sourceDocumentId: input.sourceDocumentId ?? null,
    sourceDocumentType: input.sourceDocumentType ?? null,
    status: "posted",
    tenantId: input.tenantId,
    transactionType: input.transactionType
  };

  const newEntries = input.entries.map((entry, index) => ({
    ...entry,
    entrySequence: index + 1,
    id: createId("ile"),
    tenantId: input.tenantId,
    transactionId: transaction.id
  }));

  const projected = buildStockBalances([...state.entries, ...newEntries], state.reservations ?? []);
  const negativeAvailable = hasNegativeAggregatedAvailable(projected);
  if (negativeAvailable && !input.allowNegativeAvailable) {
    throw new Error("Negative available stock is blocked by default.");
  }
  if (negativeAvailable && input.allowNegativeAvailable && !input.overrideReason?.trim()) {
    throw new Error("Negative stock override requires a reason.");
  }

  return {
    entries: [...state.entries, ...newEntries],
    transaction,
    transactions: [...state.transactions, transaction]
  };
}

export function reverseInventoryTransaction(
  state: LedgerState,
  transactionId: string,
  tenantId: string,
  operatorId: string,
  reasonCode: string,
  createId: IdFactory = (prefix) => `${prefix}_${Date.now()}`
): LedgerState & { transaction: InventoryTransaction; entries: InventoryLedgerEntry[] } {
  const original = state.transactions.find(
    (transaction) => transaction.id === transactionId && transaction.tenantId === tenantId
  );
  if (!original || original.status !== "posted") {
    throw new Error("Only posted transactions can be reversed.");
  }

  const originalEntries = state.entries.filter((entry) => entry.transactionId === transactionId);
  const reversed = postInventoryTransaction(
    state,
    {
      entries: originalEntries.map((entry) => ({
        baseQuantityDelta: -entry.baseQuantityDelta,
        costBasis: entry.costBasis,
        itemId: entry.itemId,
        itemReferenceSnapshot: entry.itemReferenceSnapshot,
        locationId: entry.locationId,
        lotId: entry.lotId,
        productVariantId: entry.productVariantId,
        productVariantSnapshot: entry.productVariantSnapshot,
        quantityDelta: -entry.quantityDelta,
        stockCondition: entry.stockCondition,
        unitOfMeasureId: entry.unitOfMeasureId,
        warehouseId: entry.warehouseId
      })),
      idempotencyKey: `reversal:${transactionId}`,
      occurredAt: new Date().toISOString(),
      operatorId,
      reasonCode,
      sourceDocumentId: transactionId,
      sourceDocumentType: "inventory_transaction",
      tenantId,
      transactionType: "reversal"
    },
    createId
  );
  reversed.transaction.reversalOfTransactionId = transactionId;
  return reversed;
}

export function normalizeBarcode(value: string): string {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

export function resolveBarcode(records: BarcodeRecord[], value: string): BarcodeResolution {
  const normalizedValue = normalizeBarcode(value);
  const matches = records.filter(
    (record) => record.status === "active" && record.normalizedValue === normalizedValue
  );
  if (matches.length === 0) return { normalizedValue, status: "unknown" };
  if (matches.length > 1) return { matches, normalizedValue, status: "ambiguous" };
  return { barcode: matches[0]!, status: "resolved" };
}

export function validateBarcodeRecord(record: BarcodeRecord): string[] {
  const errors: string[] = [];
  if (record.value !== record.value.trim()) {
    errors.push("Barcode value must not include leading or trailing whitespace.");
  }
  if (record.normalizedValue !== normalizeBarcode(record.value)) {
    errors.push("Normalized barcode value is inconsistent.");
  }
  if (record.ownershipType === "supplier" && !record.supplierId) {
    errors.push("Supplier barcodes require a supplier.");
  }
  if (record.ownershipType === "customer" && !record.customerId) {
    errors.push("Customer barcodes require a customer.");
  }
  if (record.lotSpecific && !record.lotId) {
    errors.push("Lot-specific barcodes require a lot.");
  }
  return errors;
}

function sanitizeZplField(value: string): string {
  return value.replace(/[\^~]/g, " ").slice(0, 120);
}

export function renderHtmlLabel(template: LabelTemplate, data: LabelData): RenderedLabel {
  const width = template.measurementUnit === "mm" ? `${template.width}mm` : `${template.width}in`;
  const height = template.measurementUnit === "mm" ? `${template.height}mm` : `${template.height}in`;
  return {
    content: `<div style="width:${width};height:${height};font-family:Arial,sans-serif;border:1px solid #111;padding:8px"><strong>${data.title}</strong><br/><span>${data.subtitle}</span><div style="margin-top:8px;font-family:monospace">${data.barcode}</div></div>`,
    format: "html",
    warnings: []
  };
}

export function renderZplLabel(template: LabelTemplate, data: LabelData): RenderedLabel {
  if (template.barcodeSymbology !== "code128") {
    return {
      content: "",
      format: "zpl",
      warnings: ["Only Code 128 ZPL rendering is enabled in this milestone."]
    };
  }
  const dotsPerMm = template.dpi / 25.4;
  const widthDots = Math.round(template.width * dotsPerMm);
  const heightDots = Math.round(template.height * dotsPerMm);
  const title = sanitizeZplField(data.title);
  const subtitle = sanitizeZplField(data.subtitle);
  const barcode = sanitizeZplField(data.barcode);
  const zpl = [
    "^XA",
    `^PW${widthDots}`,
    `^LL${heightDots}`,
    "^FO24,24^A0N,32,32^FD" + title + "^FS",
    "^FO24,64^A0N,24,24^FD" + subtitle + "^FS",
    "^FO24,110^BCN,88,Y,N,N^FD>:" + barcode + "^FS",
    "^XZ"
  ].join("\n");

  return { content: zpl, format: "zpl", warnings: [] };
}

export function createLabelPrintJob(
  tenantId: string,
  template: LabelTemplate,
  data: LabelData,
  printerConfiguration: PrinterConfiguration,
  operatorId: string,
  createId: IdFactory = (prefix) => `${prefix}_${Date.now()}`
): LabelPrintJob {
  const timestamp = new Date().toISOString();
  return {
    barcodeId: null,
    completedAt: null,
    createdAt: timestamp,
    error: null,
    id: createId("label_job"),
    isReprint: false,
    itemId: null,
    operatorId,
    printerConfiguration,
    productVariantId: null,
    renderedDataSnapshot: data,
    renderedFormat: "zpl",
    reprintReason: null,
    requestedAt: timestamp,
    requestedQuantity: 1,
    status: "rendered",
    templateId: template.id,
    templateVersion: template.version,
    tenantId,
    updatedAt: timestamp
  };
}

export async function mockPrintTransport(): Promise<PrintResult> {
  return {
    message: "Mock print transport recorded the job without contacting a printer.",
    ok: true,
    status: "printed"
  };
}

export function validateImportRow(row: ImportStagedRow): ImportStagedRow {
  const errors = [...row.errors];
  const warnings = [...row.warnings];
  const values = row.normalizedValues;

  if ("barcode" in values && values.barcode !== undefined && values.barcode !== row.originalValues.barcode?.trim()) {
    warnings.push("Barcode was normalized; verify leading zeroes were preserved.");
  }
  if ("internalReference" in values && !values.internalReference) {
    errors.push("Missing internal reference.");
  }
  if ("unit" in values && !values.unit) {
    errors.push("Missing unit of measure.");
  }
  if ("cost" in values && Number.isNaN(Number(values.cost.replace(",", ".")))) {
    errors.push("Invalid cost.");
  }

  return {
    ...row,
    approvalState: errors.length > 0 ? "pending" : row.approvalState,
    errors,
    proposedAction: errors.length > 0 ? "review" : row.proposedAction,
    warnings
  };
}

export function canPerformInventoryAction(
  role: InventoryPermissionRole,
  action: InventoryPermissionAction
): boolean {
  return permissionMatrix[role].has(action);
}
