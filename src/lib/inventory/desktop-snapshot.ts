import type {
  InventoryItemSummary,
  MovementHistoryEntry,
  StockBalanceSummary,
  StockLocationSummary
} from "@/application/inventory-service";
import type {
  BarcodeRecord,
  InventoryLedgerEntry,
  InventoryReservation,
  LabelTemplate,
  StockCondition,
  Warehouse
} from "@/domain/inventory-product-types";
import { mapApiItemToMaster, mapApiLocation, mapMovementHistoryToTransactions } from "@/features/inventory-mobile/server-context";
import { createDefaultUnits } from "@/features/inventory-product/ledger";
import type { InventoryProductSnapshot } from "@/persistence/interfaces";

const DEFAULT_LABEL_TEMPLATE: LabelTemplate = {
  active: true,
  barcodeSymbology: "code128",
  createdAt: "2026-07-01T09:00:00.000Z",
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
  tenantId: "server",
  updatedAt: "2026-07-01T09:00:00.000Z",
  version: 1,
  width: 70
};

export function createEmptyInventoryProductSnapshot(): InventoryProductSnapshot {
  return {
    barcodes: [],
    conversions: [],
    entries: [],
    importBatch: null,
    importRows: [],
    items: [],
    labelPrintJobs: [],
    labelTemplates: [],
    locations: [],
    lots: [],
    packaging: [],
    products: [],
    reservations: [],
    stockCounts: [],
    transactions: [],
    unitOfMeasures: [],
    variants: [],
    warehouses: []
  };
}

function deriveWarehouses(
  locations: StockLocationSummary[],
  tenantId: string
): Warehouse[] {
  const byId = new Map<string, Warehouse>();
  for (const location of locations) {
    if (byId.has(location.warehouseId)) continue;
    byId.set(location.warehouseId, {
      active: true,
      code: location.warehouseId.slice(0, 8).toUpperCase(),
      createdAt: "",
      id: location.warehouseId,
      name: `Warehouse ${location.warehouseId.slice(0, 8)}`,
      tenantId,
      updatedAt: ""
    });
  }
  return [...byId.values()];
}

function balancesToEntries(
  balances: StockBalanceSummary[],
  items: InventoryItemSummary[],
  tenantId: string
): InventoryLedgerEntry[] {
  const itemById = new Map(items.map((item) => [item.id, item]));
  return balances
    .filter((balance) => balance.physicalStock !== 0)
    .map((balance, index) => {
      const item = itemById.get(balance.itemId);
      return {
        baseQuantityDelta: balance.physicalStock,
        costBasis: null,
        createdAt: "",
        entrySequence: index + 1,
        id: `balance:${balance.itemId}:${balance.locationId}:${balance.stockCondition}`,
        itemId: balance.itemId,
        itemReferenceSnapshot: item?.internalReference ?? balance.itemId,
        locationId: balance.locationId,
        lotId: null,
        productVariantId: null,
        productVariantSnapshot: null,
        quantityDelta: balance.physicalStock,
        stockCondition: balance.stockCondition as StockCondition,
        tenantId,
        transactionId: `balance:${balance.itemId}:${balance.locationId}`,
        unitOfMeasureId: item?.baseUnitCode ?? "unit",
        updatedAt: "",
        warehouseId: balance.warehouseId
      };
    });
}

function itemsToBarcodes(items: InventoryItemSummary[], tenantId: string): BarcodeRecord[] {
  const now = new Date().toISOString();
  return items
    .filter((item) => Boolean(item.barcode?.trim()))
    .map((item) => ({
      createdAt: now,
      customerId: null,
      id: `barcode:${item.id}`,
      itemId: item.id,
      lotId: null,
      lotSpecific: false,
      normalizedValue: item.barcode!.trim().toUpperCase(),
      ownershipType: "internal" as const,
      packagingConfigurationId: null,
      primary: true,
      productVariantId: null,
      replacedBarcodeId: null,
      status: "active" as const,
      supplierId: null,
      symbology: "code128" as const,
      tenantId,
      updatedAt: now,
      validFrom: null,
      validTo: null,
      value: item.barcode!.trim(),
      verificationStatus: "unchecked" as const
    }));
}

export function buildDesktopSnapshotFromApi(input: {
  tenantId: string;
  items: InventoryItemSummary[];
  locations: StockLocationSummary[];
  balances: StockBalanceSummary[];
  movements: MovementHistoryEntry[];
  sessionReservations?: InventoryReservation[];
}): InventoryProductSnapshot {
  const now = new Date().toISOString();
  const items = input.items.map((item) => mapApiItemToMaster(item, input.tenantId));
  const locations = input.locations.map(mapApiLocation);
  const warehouses = deriveWarehouses(input.locations, input.tenantId);
  const units = createDefaultUnits(input.tenantId, now).map((unit) => ({
    ...unit,
    tenantId: input.tenantId
  }));
  const entries = balancesToEntries(input.balances, input.items, input.tenantId);
  const transactions = mapMovementHistoryToTransactions(input.movements, input.tenantId);

  return {
    ...createEmptyInventoryProductSnapshot(),
    barcodes: itemsToBarcodes(input.items, input.tenantId),
    entries,
    items,
    labelTemplates: [{ ...DEFAULT_LABEL_TEMPLATE, tenantId: input.tenantId }],
    locations,
    reservations: input.sessionReservations ?? [],
    transactions,
    unitOfMeasures: units,
    warehouses
  };
}

export async function loadDesktopSnapshotFromSupabase(input: {
  tenantId: string;
  sessionReservations?: InventoryReservation[];
  fetchItems: () => Promise<InventoryItemSummary[]>;
  fetchLocations: () => Promise<StockLocationSummary[]>;
  fetchBalances: () => Promise<StockBalanceSummary[]>;
  fetchMovementHistory: (itemId: string, limit?: number) => Promise<MovementHistoryEntry[]>;
}): Promise<InventoryProductSnapshot> {
  const [items, locations, balances] = await Promise.all([
    input.fetchItems(),
    input.fetchLocations(),
    input.fetchBalances()
  ]);

  const movementChunks = await Promise.all(
    items.slice(0, 20).map((item) => input.fetchMovementHistory(item.id, 25))
  );
  const movements = movementChunks
    .flat()
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));

  return buildDesktopSnapshotFromApi({
    balances,
    items,
    locations,
    movements,
    sessionReservations: input.sessionReservations,
    tenantId: input.tenantId
  });
}
