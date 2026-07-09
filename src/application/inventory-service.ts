import type { ForgeOSSession } from "@/lib/auth/types";
import { createSupabaseServiceClient } from "@/lib/supabase/service-client";
import { PersistenceError } from "@/persistence/interfaces";
import {
  requireInventoryManagePermission,
  requireInventoryViewPermission,
  requireMobileMovementPermission,
  requireProductManagementPermission
} from "@/features/inventory/auth";
import type { MobileMovementKind } from "@/features/inventory-mobile/offline-queue";

export type InventoryItemSummary = {
  id: string;
  tenantId: string;
  internalReference: string;
  itemType: string;
  name: string;
  description: string;
  baseUnitCode: string;
  sku: string | null;
  barcode: string | null;
  minimumStock: number;
  preferredStock: number;
  defaultLocationId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StockLocationSummary = {
  id: string;
  tenantId: string;
  warehouseId: string;
  code: string;
  name: string;
  locationType: string;
  active: boolean;
};

export type StockBalanceSummary = {
  itemId: string;
  locationId: string;
  warehouseId: string;
  stockCondition: string;
  physicalStock: number;
  reservedStock: number;
  availableStock: number;
};

export type MovementHistoryEntry = {
  transactionId: string;
  transactionType: string;
  occurredAt: string;
  operatorId: string;
  reasonCode: string;
  notes: string;
  itemId: string;
  locationId: string;
  quantityDelta: number;
  stockCondition: string;
};

export type BarcodeResolveResult =
  | { status: "resolved"; item: InventoryItemSummary; normalizedValue: string; scannedValue: string }
  | { status: "unknown"; normalizedValue: string; scannedValue: string }
  | {
      status: "ambiguous";
      normalizedValue: string;
      scannedValue: string;
      matches: Array<{ itemId: string; itemName: string; barcodeRecordId: string }>;
    };

function mapItem(row: Record<string, unknown>): InventoryItemSummary {
  return {
    active: Boolean(row.active),
    barcode: typeof row.barcode === "string" ? row.barcode : null,
    baseUnitCode: String(row.base_unit_code ?? "unit"),
    createdAt: String(row.created_at ?? ""),
    defaultLocationId: typeof row.default_location_id === "string" ? row.default_location_id : null,
    description: String(row.description ?? ""),
    id: String(row.id),
    internalReference: String(row.internal_reference),
    itemType: String(row.item_type),
    minimumStock: Number(row.minimum_stock ?? 0),
    name: String(row.name),
    preferredStock: Number(row.preferred_stock ?? 0),
    sku: typeof row.sku === "string" ? row.sku : null,
    tenantId: String(row.tenant_id),
    updatedAt: String(row.updated_at ?? "")
  };
}

function normalizeBarcode(value: string): string {
  return value.trim().toUpperCase();
}

export async function listInventoryItems(session: ForgeOSSession): Promise<InventoryItemSummary[]> {
  requireInventoryViewPermission(session);
  const client = createSupabaseServiceClient();
  const { data, error } = await client
    .from("inv_item_masters")
    .select(
      "id, tenant_id, internal_reference, item_type, name, description, base_unit_code, sku, barcode, minimum_stock, preferred_stock, default_location_id, active, created_at, updated_at"
    )
    .eq("tenant_id", session.tenantId)
    .eq("active", true)
    .order("internal_reference");

  if (error) throw new PersistenceError("unavailable", "Failed to list inventory items.");
  return (data ?? []).map((row) => mapItem(row as Record<string, unknown>));
}

export async function getInventoryItem(
  session: ForgeOSSession,
  itemId: string
): Promise<InventoryItemSummary | null> {
  requireInventoryViewPermission(session);
  const client = createSupabaseServiceClient();
  const { data, error } = await client
    .from("inv_item_masters")
    .select(
      "id, tenant_id, internal_reference, item_type, name, description, base_unit_code, sku, barcode, minimum_stock, preferred_stock, default_location_id, active, created_at, updated_at"
    )
    .eq("tenant_id", session.tenantId)
    .eq("id", itemId)
    .maybeSingle();

  if (error) throw new PersistenceError("unavailable", "Failed to load inventory item.");
  return data ? mapItem(data as Record<string, unknown>) : null;
}

export async function listStockLocations(session: ForgeOSSession): Promise<StockLocationSummary[]> {
  requireInventoryViewPermission(session);
  const client = createSupabaseServiceClient();
  const { data, error } = await client
    .from("inv_stock_locations")
    .select("id, tenant_id, warehouse_id, code, name, location_type, active")
    .eq("tenant_id", session.tenantId)
    .eq("active", true)
    .order("code");

  if (error) throw new PersistenceError("unavailable", "Failed to list stock locations.");
  return (data ?? []).map((row) => ({
    active: Boolean(row.active),
    code: String(row.code),
    id: String(row.id),
    locationType: String(row.location_type),
    name: String(row.name),
    tenantId: String(row.tenant_id),
    warehouseId: String(row.warehouse_id)
  }));
}

export async function listStockBalances(
  session: ForgeOSSession,
  itemId?: string
): Promise<StockBalanceSummary[]> {
  requireInventoryViewPermission(session);
  const client = createSupabaseServiceClient();

  let entryQuery = client
    .from("inv_ledger_entries")
    .select("item_id, location_id, warehouse_id, stock_condition, quantity_delta")
    .eq("tenant_id", session.tenantId);

  if (itemId) entryQuery = entryQuery.eq("item_id", itemId);

  const { data: entries, error: entryError } = await entryQuery;
  if (entryError) throw new PersistenceError("unavailable", "Failed to load stock balances.");

  let reservationQuery = client
    .from("inv_reservations")
    .select("item_id, location_id, quantity")
    .eq("tenant_id", session.tenantId)
    .eq("status", "active");

  if (itemId) reservationQuery = reservationQuery.eq("item_id", itemId);

  const { data: reservations, error: reservationError } = await reservationQuery;
  if (reservationError) throw new PersistenceError("unavailable", "Failed to load reservations.");

  const physical = new Map<string, StockBalanceSummary>();
  for (const row of entries ?? []) {
    const key = `${row.item_id}:${row.location_id}:${row.stock_condition}`;
    const existing = physical.get(key) ?? {
      availableStock: 0,
      itemId: String(row.item_id),
      locationId: String(row.location_id),
      physicalStock: 0,
      reservedStock: 0,
      stockCondition: String(row.stock_condition),
      warehouseId: String(row.warehouse_id)
    };
    existing.physicalStock += Number(row.quantity_delta);
    physical.set(key, existing);
  }

  const reservedByKey = new Map<string, number>();
  for (const row of reservations ?? []) {
    const locationId = row.location_id ? String(row.location_id) : "*";
    const key = `${row.item_id}:${locationId}`;
    reservedByKey.set(key, (reservedByKey.get(key) ?? 0) + Number(row.quantity));
  }

  return [...physical.values()].map((balance) => {
    const reserved =
      (reservedByKey.get(`${balance.itemId}:${balance.locationId}`) ?? 0) +
      (reservedByKey.get(`${balance.itemId}:*`) ?? 0);
    return {
      ...balance,
      availableStock: balance.physicalStock - reserved,
      reservedStock: reserved
    };
  });
}

export async function listMovementHistory(
  session: ForgeOSSession,
  itemId: string,
  limit = 50
): Promise<MovementHistoryEntry[]> {
  requireInventoryViewPermission(session);
  const client = createSupabaseServiceClient();
  const { data, error } = await client
    .from("inv_ledger_entries")
    .select(
      "transaction_id, item_id, location_id, quantity_delta, stock_condition, inv_transactions!inner(transaction_type, occurred_at, operator_id, reason_code, notes)"
    )
    .eq("tenant_id", session.tenantId)
    .eq("item_id", itemId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new PersistenceError("unavailable", "Failed to load movement history.");

  return (data ?? []).map((row) => {
    const tx = Array.isArray(row.inv_transactions) ? row.inv_transactions[0] : row.inv_transactions;
    return {
      itemId: String(row.item_id),
      locationId: String(row.location_id),
      notes: String(tx?.notes ?? ""),
      occurredAt: String(tx?.occurred_at ?? ""),
      operatorId: String(tx?.operator_id ?? ""),
      quantityDelta: Number(row.quantity_delta),
      reasonCode: String(tx?.reason_code ?? ""),
      stockCondition: String(row.stock_condition),
      transactionId: String(row.transaction_id),
      transactionType: String(tx?.transaction_type ?? "")
    };
  });
}

export async function resolveBarcode(
  session: ForgeOSSession,
  scannedValue: string
): Promise<BarcodeResolveResult> {
  requireMobileMovementPermission(session, "scan");
  const normalized = normalizeBarcode(scannedValue);
  if (!normalized) {
    return { normalizedValue: "", scannedValue, status: "unknown" };
  }

  const client = createSupabaseServiceClient();
  const { data: barcodeRows, error: barcodeError } = await client
    .from("inv_barcode_records")
    .select("id, item_id, normalized_value")
    .eq("tenant_id", session.tenantId)
    .eq("normalized_value", normalized)
    .eq("status", "active");

  if (barcodeError) throw new PersistenceError("unavailable", "Barcode lookup failed.");

  const itemIds = new Set<string>();
  for (const row of barcodeRows ?? []) itemIds.add(String(row.item_id));

  if (itemIds.size === 0) {
    const { data: itemMatch, error: itemError } = await client
      .from("inv_item_masters")
      .select(
        "id, tenant_id, internal_reference, item_type, name, description, base_unit_code, sku, barcode, minimum_stock, preferred_stock, default_location_id, active, created_at, updated_at"
      )
      .eq("tenant_id", session.tenantId)
      .eq("barcode", scannedValue.trim())
      .eq("active", true);

    if (itemError) throw new PersistenceError("unavailable", "Barcode lookup failed.");
    if ((itemMatch ?? []).length === 1) {
      return {
        item: mapItem(itemMatch![0] as Record<string, unknown>),
        normalizedValue: normalized,
        scannedValue,
        status: "resolved"
      };
    }
    if ((itemMatch ?? []).length > 1) {
      return {
        matches: itemMatch!.map((row) => ({
          barcodeRecordId: String(row.id),
          itemId: String(row.id),
          itemName: String(row.name)
        })),
        normalizedValue: normalized,
        scannedValue,
        status: "ambiguous"
      };
    }
    return { normalizedValue: normalized, scannedValue, status: "unknown" };
  }

  const { data: items, error: itemsError } = await client
    .from("inv_item_masters")
    .select(
      "id, tenant_id, internal_reference, item_type, name, description, base_unit_code, sku, barcode, minimum_stock, preferred_stock, default_location_id, active, created_at, updated_at"
    )
    .eq("tenant_id", session.tenantId)
    .in("id", [...itemIds])
    .eq("active", true);

  if (itemsError) throw new PersistenceError("unavailable", "Barcode lookup failed.");

  const activeItems = (items ?? []).map((row) => mapItem(row as Record<string, unknown>));
  if (activeItems.length === 0) {
    return { normalizedValue: normalized, scannedValue, status: "unknown" };
  }
  if (activeItems.length > 1) {
    return {
      matches: activeItems.map((item) => ({
        barcodeRecordId: (barcodeRows ?? []).find((row) => String(row.item_id) === item.id)?.id?.toString() ?? item.id,
        itemId: item.id,
        itemName: item.name
      })),
      normalizedValue: normalized,
      scannedValue,
      status: "ambiguous"
    };
  }

  return {
    item: activeItems[0]!,
    normalizedValue: normalized,
    scannedValue,
    status: "resolved"
  };
}

export type PostStockMovementInput = {
  session: ForgeOSSession;
  kind: MobileMovementKind | "adjust_increase" | "adjust_decrease";
  itemId: string;
  warehouseId: string;
  locationId: string;
  quantity: number;
  unitCode?: string;
  stockCondition?: string;
  destinationLocationId?: string;
  destinationStockCondition?: string;
  lotId?: string | null;
  reasonCode?: string;
  notes?: string;
  allowNegative?: boolean;
  overrideReason?: string;
  idempotencyKey: string;
};

export async function postStockMovement(input: PostStockMovementInput): Promise<{
  transactionId: string;
  idempotencyKey: string;
  idempotent: boolean;
}> {
  const action =
    input.kind === "receipt"
      ? "receive"
      : input.kind === "issue"
        ? "issue"
        : input.kind === "transfer"
          ? "transfer"
          : "receive";
  requireMobileMovementPermission(input.session, action);
  if (input.kind.startsWith("adjust")) {
    requireInventoryManagePermission(input.session);
  }

  const client = createSupabaseServiceClient();
  const { data, error } = await client.rpc("inv_post_stock_movement", {
    p_allow_negative: input.allowNegative ?? false,
    p_destination_location_id: input.destinationLocationId ?? null,
    p_destination_stock_condition: input.destinationStockCondition ?? "available",
    p_idempotency_key: input.idempotencyKey,
    p_item_id: input.itemId,
    p_location_id: input.locationId,
    p_lot_id: input.lotId ?? null,
    p_movement_kind: input.kind,
    p_notes: input.notes ?? "",
    p_operator_id: input.session.userId,
    p_override_reason: input.overrideReason ?? null,
    p_quantity: input.quantity,
    p_reason_code: input.reasonCode ?? "mobile",
    p_stock_condition: input.stockCondition ?? "available",
    p_tenant_id: input.session.tenantId,
    p_unit_code: input.unitCode ?? "unit",
    p_warehouse_id: input.warehouseId
  });

  if (error) {
    const message = error.message.includes("insufficient")
      ? "Insufficient available stock."
      : error.message;
    throw new PersistenceError("invalid_transition", message);
  }

  const payload = data as { transaction_id: string; idempotency_key: string; idempotent?: boolean };
  return {
    idempotencyKey: payload.idempotency_key,
    idempotent: Boolean(payload.idempotent),
    transactionId: payload.transaction_id
  };
}

export async function linkBarcodeToItem(input: {
  session: ForgeOSSession;
  itemId: string;
  scannedValue: string;
}): Promise<{ barcodeRecordId: string; normalizedValue: string }> {
  requireProductManagementPermission(input.session);
  const client = createSupabaseServiceClient();
  const { data, error } = await client.rpc("inv_link_barcode", {
    p_item_id: input.itemId,
    p_operator_id: input.session.userId,
    p_scanned_value: input.scannedValue,
    p_tenant_id: input.session.tenantId
  });

  if (error) {
    throw new PersistenceError("invalid_transition", error.message);
  }

  const payload = data as { barcode_record_id: string; normalized_value: string };
  return {
    barcodeRecordId: payload.barcode_record_id,
    normalizedValue: payload.normalized_value
  };
}

export async function createReservation(input: {
  session: ForgeOSSession;
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
  requireInventoryManagePermission(input.session);
  const client = createSupabaseServiceClient();
  const { data, error } = await client.rpc("inv_create_reservation", {
    p_idempotency_key: input.idempotencyKey,
    p_item_id: input.itemId,
    p_location_id: input.locationId,
    p_lot_id: input.lotId ?? null,
    p_operator_id: input.session.userId,
    p_quantity: input.quantity,
    p_source_document_id: input.sourceDocumentId ?? input.idempotencyKey,
    p_source_document_type: input.sourceDocumentType ?? "manual",
    p_tenant_id: input.session.tenantId,
    p_unit_code: input.unitCode ?? "unit",
    p_warehouse_id: input.warehouseId
  });

  if (error) throw new PersistenceError("invalid_transition", error.message);
  const payload = data as { reservation_id: string; idempotent?: boolean };
  return { idempotent: Boolean(payload.idempotent), reservationId: payload.reservation_id };
}

export async function releaseReservation(input: {
  session: ForgeOSSession;
  reservationId: string;
  status?: "released" | "consumed";
}): Promise<{ reservationId: string; status: string; idempotent: boolean }> {
  requireInventoryManagePermission(input.session);
  const client = createSupabaseServiceClient();
  const { data, error } = await client.rpc("inv_release_reservation", {
    p_operator_id: input.session.userId,
    p_reservation_id: input.reservationId,
    p_status: input.status ?? "released",
    p_tenant_id: input.session.tenantId
  });

  if (error) throw new PersistenceError("invalid_transition", error.message);
  const payload = data as { reservation_id: string; status: string; idempotent?: boolean };
  return {
    idempotent: Boolean(payload.idempotent),
    reservationId: payload.reservation_id,
    status: payload.status
  };
}

export async function writeProductImportAudit(input: {
  session: ForgeOSSession;
  activityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const client = createSupabaseServiceClient();
  const { error } = await client.rpc("inv_write_activity_log", {
    p_activity_type: input.activityType,
    p_entity_id: input.entityId,
    p_entity_type: "prod_import_job",
    p_metadata: input.metadata ?? {},
    p_operator_id: input.session.userId,
    p_tenant_id: input.session.tenantId
  });
  if (error) throw new PersistenceError("unavailable", "Failed to write audit log.");
}
