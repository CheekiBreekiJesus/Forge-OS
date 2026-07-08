import type { StockMovementRequest } from "@/features/inventory-product/operations";

export type MobileMovementKind = "receipt" | "issue" | "transfer";

export type QueuedMovement = {
  idempotencyKey: string;
  tenantId: string;
  kind: MobileMovementKind;
  request: StockMovementRequest;
  createdAt: string;
  status: "pending" | "failed";
  lastError?: string;
  attemptCount: number;
};

const STORAGE_PREFIX = "forgeos:inventory-mobile:queue:";

const memoryQueues = new Map<string, QueuedMovement[]>();

function storageKey(tenantId: string): string {
  return `${STORAGE_PREFIX}${tenantId}`;
}

function readQueue(tenantId: string): QueuedMovement[] {
  if (typeof window === "undefined") {
    return [...(memoryQueues.get(tenantId) ?? [])];
  }
  try {
    const raw = window.localStorage.getItem(storageKey(tenantId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedMovement[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(tenantId: string, queue: QueuedMovement[]): void {
  if (typeof window === "undefined") {
    memoryQueues.set(tenantId, [...queue]);
    return;
  }
  window.localStorage.setItem(storageKey(tenantId), JSON.stringify(queue));
}

export function listQueuedMovements(tenantId: string): QueuedMovement[] {
  return readQueue(tenantId);
}

export function countPendingMovements(tenantId: string): number {
  return readQueue(tenantId).filter((entry) => entry.status === "pending" || entry.status === "failed").length;
}

export function enqueueMovement(
  tenantId: string,
  kind: MobileMovementKind,
  request: StockMovementRequest
): QueuedMovement {
  const queue = readQueue(tenantId);
  const existing = queue.find((entry) => entry.idempotencyKey === request.idempotencyKey);
  if (existing) return existing;

  const entry: QueuedMovement = {
    attemptCount: 0,
    createdAt: new Date().toISOString(),
    idempotencyKey: request.idempotencyKey,
    kind,
    request,
    status: "pending",
    tenantId
  };
  queue.push(entry);
  writeQueue(tenantId, queue);
  return entry;
}

export function markMovementSynced(tenantId: string, idempotencyKey: string): void {
  const queue = readQueue(tenantId).filter((entry) => entry.idempotencyKey !== idempotencyKey);
  writeQueue(tenantId, queue);
}

export function markMovementFailed(
  tenantId: string,
  idempotencyKey: string,
  errorMessage: string
): QueuedMovement | null {
  const queue = readQueue(tenantId);
  const entry = queue.find((row) => row.idempotencyKey === idempotencyKey);
  if (!entry) return null;
  entry.status = "failed";
  entry.lastError = errorMessage;
  entry.attemptCount += 1;
  writeQueue(tenantId, queue);
  return entry;
}

export function resetMovementForRetry(tenantId: string, idempotencyKey: string): void {
  const queue = readQueue(tenantId);
  const entry = queue.find((row) => row.idempotencyKey === idempotencyKey);
  if (!entry) return;
  entry.status = "pending";
  entry.lastError = undefined;
  writeQueue(tenantId, queue);
}

export function clearOfflineQueue(tenantId: string): void {
  memoryQueues.delete(tenantId);
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey(tenantId));
}

export function isBrowserOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}
