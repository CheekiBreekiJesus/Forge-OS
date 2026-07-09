"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { InventoryProductRepository } from "@/persistence/interfaces";
import { postInventoryMobileMovement } from "@/lib/inventory/api-client";
import { readClientInventoryRuntimeMode } from "@/lib/inventory/runtime";
import {
  countPendingMovements,
  isBrowserOnline,
  listQueuedMovements,
  markMovementFailed,
  markMovementSynced,
  resetMovementForRetry,
  setOfflineQueueSessionScope
} from "@/features/inventory-mobile/offline-queue";
import { postMobileMovement } from "@/features/inventory-mobile/movement-service";

export function useOfflineMovementSync(
  sessionScope: string,
  inventoryProduct: InventoryProductRepository | null,
  onSynced?: () => void,
  demoOperatorId?: string,
  demoTenantId?: string
) {
  const [syncing, setSyncing] = useState(false);
  const [queueVersion, setQueueVersion] = useState(0);
  const runtimeMode = readClientInventoryRuntimeMode();

  useEffect(() => {
    if (sessionScope) setOfflineQueueSessionScope(sessionScope);
  }, [sessionScope]);

  const pendingCount = useMemo(() => {
    void queueVersion;
    return countPendingMovements();
  }, [queueVersion]);

  const failedEntries = useMemo(() => {
    void queueVersion;
    return listQueuedMovements().filter((entry) => entry.status === "failed");
  }, [queueVersion]);

  const refresh = useCallback(() => {
    setQueueVersion((value) => value + 1);
  }, []);

  const syncQueue = useCallback(async (options?: { retryFailed?: boolean }) => {
    if (!isBrowserOnline() || syncing) return;
    if (options?.retryFailed) {
      for (const entry of listQueuedMovements().filter((row) => row.status === "failed" && row.retryable)) {
        resetMovementForRetry(entry.idempotencyKey);
      }
    }
    const queue = listQueuedMovements().filter((entry) => entry.status === "pending");
    if (queue.length === 0) {
      refresh();
      return;
    }

    setSyncing(true);
    try {
      for (const entry of queue) {
        try {
          if (runtimeMode === "supabase") {
            await postInventoryMobileMovement({
              destinationLocationId: entry.payload.destinationLocationId,
              idempotencyKey: entry.idempotencyKey,
              itemId: entry.payload.itemId,
              kind: entry.kind,
              locationId: entry.payload.locationId,
              notes: entry.payload.notes,
              quantity: entry.payload.quantity,
              reasonCode: entry.payload.reasonCode,
              stockCondition: entry.payload.stockCondition,
              unitCode: entry.payload.unitCode,
              warehouseId: entry.payload.warehouseId
            });
          } else if (inventoryProduct && demoTenantId && demoOperatorId) {
            await postMobileMovement(
              inventoryProduct,
              demoTenantId,
              entry.kind,
              {
                ...entry.payload,
                destinationLocationId: entry.payload.destinationLocationId,
                idempotencyKey: entry.idempotencyKey,
                operatorId: demoOperatorId,
                reasonCode: entry.payload.reasonCode ?? "mobile_scan",
                tenantId: demoTenantId,
                unitOfMeasureId: entry.payload.unitCode ?? "unit"
              }
            );
          } else {
            throw new Error("Demo inventory repository is not available.");
          }
          markMovementSynced(entry.idempotencyKey);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Synchronization failed.";
          const retryable = !message.toLowerCase().includes("forbidden");
          markMovementFailed(entry.idempotencyKey, message, { retryable });
        }
      }
      onSynced?.();
    } finally {
      setSyncing(false);
      refresh();
    }
  }, [demoOperatorId, demoTenantId, inventoryProduct, onSynced, refresh, runtimeMode, syncing]);

  useEffect(() => {
    function handleOnline() {
      void syncQueue();
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [syncQueue]);

  useEffect(() => {
    if (!isBrowserOnline()) return;
    const timer = window.setTimeout(() => {
      void syncQueue();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [syncQueue]);

  const retryFailedSync = useCallback(() => syncQueue({ retryFailed: true }), [syncQueue]);

  return { failedEntries, pendingCount, refresh, retryFailedSync, syncQueue, syncing };
}
