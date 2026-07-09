import type { MobileMovementKind } from "@/features/inventory-mobile/offline-queue";
import type {
  BarcodeResolveResult,
  InventoryItemSummary,
  MovementHistoryEntry,
  StockBalanceSummary,
  StockLocationSummary
} from "@/application/inventory-service";

type ApiError = { error: string };

async function parseJson<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json();
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error?: string }).error)
        : "Inventory API request failed.";
    throw new Error(message);
  }
  return payload as T;
}

export async function fetchInventoryItems(): Promise<InventoryItemSummary[]> {
  const response = await fetch("/api/inventory/items", { credentials: "include" });
  const payload = await parseJson<{ items: InventoryItemSummary[] }>(response);
  return payload.items;
}

export async function fetchInventoryItem(itemId: string): Promise<InventoryItemSummary> {
  const response = await fetch(`/api/inventory/items/${encodeURIComponent(itemId)}`, {
    credentials: "include"
  });
  const payload = await parseJson<{ item: InventoryItemSummary }>(response);
  return payload.item;
}

export async function fetchStockLocations(): Promise<StockLocationSummary[]> {
  const response = await fetch("/api/inventory/locations", { credentials: "include" });
  const payload = await parseJson<{ locations: StockLocationSummary[] }>(response);
  return payload.locations;
}

export async function fetchStockBalances(itemId?: string): Promise<StockBalanceSummary[]> {
  const query = itemId ? `?itemId=${encodeURIComponent(itemId)}` : "";
  const response = await fetch(`/api/inventory/balances${query}`, { credentials: "include" });
  const payload = await parseJson<{ balances: StockBalanceSummary[] }>(response);
  return payload.balances;
}

export async function fetchMovementHistory(itemId: string, limit = 50): Promise<MovementHistoryEntry[]> {
  const response = await fetch(
    `/api/inventory/movements?itemId=${encodeURIComponent(itemId)}&limit=${limit}`,
    { credentials: "include" }
  );
  const payload = await parseJson<{ movements: MovementHistoryEntry[] }>(response);
  return payload.movements;
}

export async function resolveInventoryBarcode(scannedValue: string): Promise<BarcodeResolveResult> {
  const response = await fetch("/api/inventory/barcodes/resolve", {
    body: JSON.stringify({ scannedValue }),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });
  const payload = await parseJson<{ result: BarcodeResolveResult }>(response);
  return payload.result;
}

export async function postInventoryMobileMovement(input: {
  kind: MobileMovementKind;
  itemId: string;
  warehouseId: string;
  locationId: string;
  destinationLocationId?: string;
  quantity: number;
  unitCode?: string;
  stockCondition?: string;
  reasonCode?: string;
  notes?: string;
  idempotencyKey: string;
}): Promise<{ transactionId: string; idempotencyKey: string; idempotent: boolean }> {
  const response = await fetch("/api/inventory/mobile/movement", {
    body: JSON.stringify(input),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });
  const payload = await parseJson<{
    result: { transactionId: string; idempotencyKey: string; idempotent: boolean };
  }>(response);
  return payload.result;
}

export async function linkInventoryBarcode(input: {
  itemId: string;
  scannedValue: string;
}): Promise<{ barcodeRecordId: string; normalizedValue: string }> {
  const response = await fetch("/api/inventory/barcodes/link", {
    body: JSON.stringify(input),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });
  const payload = await parseJson<{
    result: { barcodeRecordId: string; normalizedValue: string };
  }>(response);
  return payload.result;
}

export async function postInventoryDesktopMovement(input: {
  kind: "receipt" | "issue" | "transfer" | "adjust_increase" | "adjust_decrease";
  itemId: string;
  warehouseId: string;
  locationId: string;
  destinationLocationId?: string;
  quantity: number;
  unitCode?: string;
  stockCondition?: string;
  destinationStockCondition?: string;
  lotId?: string | null;
  reasonCode?: string;
  notes?: string;
  allowNegative?: boolean;
  overrideReason?: string;
  idempotencyKey: string;
}): Promise<{ transactionId: string; idempotencyKey: string; idempotent: boolean }> {
  const response = await fetch("/api/inventory/mobile/movement", {
    body: JSON.stringify(input),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });
  const payload = await parseJson<{
    result: { transactionId: string; idempotencyKey: string; idempotent: boolean };
  }>(response);
  return payload.result;
}

export async function postInventoryReservation(input: {
  itemId: string;
  warehouseId: string;
  locationId: string;
  quantity: number;
  unitCode?: string;
  sourceDocumentType?: string;
  sourceDocumentId?: string;
  lotId?: string | null;
  idempotencyKey: string;
}): Promise<{ reservationId: string; idempotent: boolean }> {
  const response = await fetch("/api/inventory/reservations", {
    body: JSON.stringify({ action: "create", ...input }),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });
  const payload = await parseJson<{
    result: { reservationId: string; idempotent: boolean };
  }>(response);
  return payload.result;
}

export async function releaseInventoryReservation(input: {
  reservationId: string;
  status?: "released" | "consumed";
}): Promise<{ reservationId: string; status: string; idempotent: boolean }> {
  const response = await fetch("/api/inventory/reservations", {
    body: JSON.stringify({ action: "release", ...input }),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    method: "POST"
  });
  const payload = await parseJson<{
    result: { reservationId: string; status: string; idempotent: boolean };
  }>(response);
  return payload.result;
}
