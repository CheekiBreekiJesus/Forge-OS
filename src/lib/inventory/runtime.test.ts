import { describe, expect, it, vi, beforeEach } from "vitest";
import type {
  InventoryItemSummary,
  MovementHistoryEntry,
  StockBalanceSummary,
  StockLocationSummary
} from "@/application/inventory-service";
import {
  hasInventoryDesktopCapability,
  resolveInventoryDesktopCapabilities
} from "@/lib/inventory/capabilities";
import {
  buildDesktopSnapshotFromApi,
  loadDesktopSnapshotFromSupabase
} from "@/lib/inventory/desktop-snapshot";
import { createSupabaseDesktopWorkflows } from "@/lib/inventory/desktop-workflows";
import * as apiClient from "@/lib/inventory/api-client";
import { readClientInventoryRuntimeMode, resolveInventoryRuntimeMode } from "@/lib/inventory/runtime";

const sampleItem: InventoryItemSummary = {
  active: true,
  barcode: "5601234001005",
  baseUnitCode: "unit",
  createdAt: "2026-07-01T09:00:00.000Z",
  defaultLocationId: "loc-1",
  description: "Test cup",
  id: "item-1",
  internalReference: "FG-CUP-330",
  itemType: "finished_good",
  minimumStock: 100,
  name: "Clear cup 330ml",
  preferredStock: 500,
  sku: "FG-CUP-330",
  tenantId: "tenant-a",
  updatedAt: "2026-07-01T09:00:00.000Z"
};

const sampleLocation: StockLocationSummary = {
  active: true,
  code: "A-R1-S1",
  id: "loc-1",
  locationType: "shelf",
  name: "Shelf A",
  tenantId: "tenant-a",
  warehouseId: "wh-1"
};

const sampleBalance: StockBalanceSummary = {
  availableStock: 80,
  itemId: "item-1",
  locationId: "loc-1",
  physicalStock: 100,
  reservedStock: 20,
  stockCondition: "available",
  warehouseId: "wh-1"
};

const sampleMovement: MovementHistoryEntry = {
  itemId: "item-1",
  locationId: "loc-1",
  notes: "",
  occurredAt: "2026-07-02T10:00:00.000Z",
  operatorId: "operator-1",
  quantityDelta: 100,
  reasonCode: "receipt",
  stockCondition: "available",
  transactionId: "tx-1",
  transactionType: "receipt"
};

describe("inventory desktop runtime", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("exposes supabase capabilities without demo seeding or label persistence", () => {
    const capabilities = resolveInventoryDesktopCapabilities("supabase");
    expect(capabilities.has("read_snapshot")).toBe(true);
    expect(capabilities.has("stock_movements")).toBe(true);
    expect(capabilities.has("seed_demo")).toBe(false);
    expect(capabilities.has("label_persist")).toBe(false);
    expect(hasInventoryDesktopCapability("demo", "seed_demo")).toBe(true);
  });

  it("maps API payloads into a desktop snapshot", () => {
    const snapshot = buildDesktopSnapshotFromApi({
      balances: [sampleBalance],
      items: [sampleItem],
      locations: [sampleLocation],
      movements: [sampleMovement],
      tenantId: "tenant-a"
    });

    expect(snapshot.items).toHaveLength(1);
    expect(snapshot.locations).toHaveLength(1);
    expect(snapshot.warehouses).toHaveLength(1);
    expect(snapshot.entries).toHaveLength(1);
    expect(snapshot.transactions).toHaveLength(1);
    expect(snapshot.barcodes[0]?.value).toBe("5601234001005");
    expect(snapshot.labelTemplates).toHaveLength(1);
  });

  it("loads supabase snapshots through the authenticated API client", async () => {
    const fetchItems = vi.fn(async () => [sampleItem]);
    const fetchLocations = vi.fn(async () => [sampleLocation]);
    const fetchBalances = vi.fn(async () => [sampleBalance]);
    const fetchMovementHistory = vi.fn(async () => [sampleMovement]);

    const snapshot = await loadDesktopSnapshotFromSupabase({
      fetchBalances,
      fetchItems,
      fetchLocations,
      fetchMovementHistory,
      tenantId: "tenant-a"
    });

    expect(fetchItems).toHaveBeenCalledOnce();
    expect(fetchLocations).toHaveBeenCalledOnce();
    expect(fetchBalances).toHaveBeenCalledOnce();
    expect(fetchMovementHistory).toHaveBeenCalledWith("item-1", 25);
    expect(snapshot.items[0]?.internalReference).toBe("FG-CUP-330");
  });

  it("routes desktop workflows through supabase APIs without IndexedDB writes", async () => {
    const postMovement = vi.spyOn(apiClient, "postInventoryDesktopMovement").mockResolvedValue({
      idempotencyKey: "desktop:receipt:1",
      idempotent: false,
      transactionId: "tx-2"
    });
    const reloadSnapshot = vi.fn(async () =>
      buildDesktopSnapshotFromApi({
        balances: [sampleBalance],
        items: [sampleItem],
        locations: [sampleLocation],
        movements: [sampleMovement],
        tenantId: "tenant-a"
      })
    );
    const workflows = createSupabaseDesktopWorkflows({
      onReservationCreated: vi.fn(),
      onReservationReleased: vi.fn(),
      reloadSnapshot
    });

    await workflows.runWorkflow("receipt", {
      idempotencyKey: "desktop:receipt:1",
      itemId: "item-1",
      locationId: "loc-1",
      operatorId: "operator-1",
      quantity: 10,
      reasonCode: "receipt",
      unitOfMeasureId: "unit",
      warehouseId: "wh-1"
    });

    expect(postMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: "desktop:receipt:1",
        itemId: "item-1",
        kind: "receipt",
        quantity: 10
      })
    );
    expect(reloadSnapshot).toHaveBeenCalledOnce();
  });

  it("resolves server runtime mode from configured persistence settings", () => {
    expect(
      resolveInventoryRuntimeMode({
        FORGEOS_PERSISTENCE_MODE: "supabase",
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service-role-key"
      })
    ).toBe("supabase");
    expect(readClientInventoryRuntimeMode()).toBe("demo");
  });
});
