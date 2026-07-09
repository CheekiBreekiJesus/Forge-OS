import type { StockMovementRequest } from "@/features/inventory-product/operations";
import type { StockCondition } from "@/domain/inventory-product-types";

export type MobileMovementKind = "receipt" | "issue" | "transfer";

export type QueuedMovementPayload = {
  itemId: string;
  warehouseId: string;
  locationId: string;
  destinationLocationId?: string;
  quantity: number;
  unitCode?: string;
  stockCondition?: StockCondition;
  reasonCode?: string;
  notes?: string;
  lotId?: string | null;
};

export type QueuedMovement = {
  localQueueId: string;
  idempotencyKey: string;
  kind: MobileMovementKind;
  payload: QueuedMovementPayload;
  createdAt: string;
  status: "pending" | "failed" | "completed";
  lastError?: string;
  attemptCount: number;
  retryable: boolean;
};

const STORAGE_PREFIX = "forgeos:inventory-mobile:queue:";
const SESSION_SCOPE_KEY = "forgeos:inventory-mobile:session-scope";

const memoryQueues = new Map<string, QueuedMovement[]>();
let memorySessionScope = "anonymous";

function readSessionScope(): string {
  if (typeof window === "undefined") return memorySessionScope;
  return window.sessionStorage.getItem(SESSION_SCOPE_KEY) ?? "anonymous";
}

export function setOfflineQueueSessionScope(scope: string): void {
  if (typeof window === "undefined") {
    const previous = memorySessionScope;
    if (previous && previous !== scope) {
      quarantineOfflineQueue(previous);
    }
    memorySessionScope = scope;
    return;
  }
  const previous = window.sessionStorage.getItem(SESSION_SCOPE_KEY);
  if (previous && previous !== scope) {
    quarantineOfflineQueue(previous);
  }
  window.sessionStorage.setItem(SESSION_SCOPE_KEY, scope);
}

function storageKey(scope: string): string {
  return `${STORAGE_PREFIX}${scope}`;
}

function readQueue(scope = readSessionScope()): QueuedMovement[] {
  if (typeof window === "undefined") {
    return [...(memoryQueues.get(scope) ?? [])];
  }
  try {
    const raw = window.localStorage.getItem(storageKey(scope));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedMovement[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(scope: string, queue: QueuedMovement[]): void {
  if (typeof window === "undefined") {
    memoryQueues.set(scope, [...queue]);
    return;
  }
  window.localStorage.setItem(storageKey(scope), JSON.stringify(queue));
}

export function listQueuedMovements(scope = readSessionScope()): QueuedMovement[] {
  return readQueue(scope).filter((entry) => entry.status !== "completed");
}

export function countPendingMovements(scope = readSessionScope()): number {
  return readQueue(scope).filter((entry) => entry.status === "pending" || entry.status === "failed").length;
}

export function enqueueMovement(
  kind: MobileMovementKind,
  payload: QueuedMovementPayload,
  idempotencyKey: string
): QueuedMovement {
  const scope = readSessionScope();
  const queue = readQueue(scope);
  const existing = queue.find((entry) => entry.idempotencyKey === idempotencyKey);
  if (existing) return existing;

  const entry: QueuedMovement = {
    attemptCount: 0,
    createdAt: new Date().toISOString(),
    idempotencyKey,
    kind,
    localQueueId:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `queue-${Date.now()}`,
    payload,
    retryable: true,
    status: "pending"
  };
  queue.push(entry);
  writeQueue(scope, queue);
  return entry;
}

export function markMovementSynced(idempotencyKey: string, scope = readSessionScope()): void {
  const queue = readQueue(scope).map((entry) =>
    entry.idempotencyKey === idempotencyKey ? { ...entry, status: "completed" as const } : entry
  );
  writeQueue(scope, queue.filter((entry) => entry.status !== "completed"));
}

export function markMovementFailed(
  idempotencyKey: string,
  errorMessage: string,
  options?: { retryable?: boolean },
  scope = readSessionScope()
): QueuedMovement | null {
  const queue = readQueue(scope);
  const entry = queue.find((row) => row.idempotencyKey === idempotencyKey);
  if (!entry) return null;
  entry.status = "failed";
  entry.lastError = errorMessage;
  entry.attemptCount += 1;
  entry.retryable = options?.retryable ?? true;
  writeQueue(scope, queue);
  return entry;
}

export function resetMovementForRetry(idempotencyKey: string, scope = readSessionScope()): void {
  const queue = readQueue(scope);
  const entry = queue.find((row) => row.idempotencyKey === idempotencyKey);
  if (!entry) return;
  entry.status = "pending";
  entry.lastError = undefined;
  writeQueue(scope, queue);
}

export function quarantineOfflineQueue(scope: string): void {
  const queue = readQueue(scope);
  if (queue.length === 0) return;
  const quarantineKey = `${storageKey(scope)}:quarantined:${Date.now()}`;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(quarantineKey, JSON.stringify(queue));
    window.localStorage.removeItem(storageKey(scope));
    return;
  }
  memoryQueues.delete(scope);
}

export function clearOfflineQueue(scope = readSessionScope()): void {
  memoryQueues.delete(scope);
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey(scope));
}

export function isBrowserOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

/** @deprecated Use payload-only queue entries; retained for legacy Dexie replay in demo mode. */
export function legacyRequestFromQueue(entry: QueuedMovement, tenantId: string, operatorId: string): StockMovementRequest {
  return {
    ...entry.payload,
    destinationLocationId: entry.payload.destinationLocationId,
    idempotencyKey: entry.idempotencyKey,
    operatorId,
    reasonCode: entry.payload.reasonCode ?? "mobile_scan",
    tenantId,
    unitOfMeasureId: entry.payload.unitCode ?? "unit"
  };
}
