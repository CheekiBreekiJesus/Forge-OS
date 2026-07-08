"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { InventoryProductRepository } from "@/persistence/interfaces";
import {
  countPendingMovements,
  isBrowserOnline,
  listQueuedMovements,
  markMovementFailed,
  markMovementSynced,
  resetMovementForRetry
} from "@/features/inventory-mobile/offline-queue";
import { postMobileMovement } from "@/features/inventory-mobile/movement-service";

export function useOfflineMovementSync(
  tenantId: string,
  inventoryProduct: InventoryProductRepository | null,
  onSynced?: () => void
) {
  const [syncing, setSyncing] = useState(false);
  const [queueVersion, setQueueVersion] = useState(0);

  const pendingCount = useMemo(() => {
    void queueVersion;
    return countPendingMovements(tenantId);
  }, [queueVersion, tenantId]);

  const failedEntries = useMemo(() => {
    void queueVersion;
    return listQueuedMovements(tenantId).filter((entry) => entry.status === "failed");
  }, [queueVersion, tenantId]);

  const refresh = useCallback(() => {
    setQueueVersion((value) => value + 1);
  }, []);

  const syncQueue = useCallback(async (options?: { retryFailed?: boolean }) => {
    if (!inventoryProduct || !isBrowserOnline() || syncing) return;
    if (options?.retryFailed) {
      for (const entry of listQueuedMovements(tenantId).filter((row) => row.status === "failed")) {
        resetMovementForRetry(tenantId, entry.idempotencyKey);
      }
    }
    const queue = listQueuedMovements(tenantId).filter((entry) => entry.status !== "failed");
    if (queue.length === 0) {
      refresh();
      return;
    }

    setSyncing(true);
    try {
      for (const entry of queue) {
        try {
          await postMobileMovement(inventoryProduct, tenantId, entry.kind, entry.request);
          markMovementSynced(tenantId, entry.idempotencyKey);
        } catch (error) {
          markMovementFailed(
            tenantId,
            entry.idempotencyKey,
            error instanceof Error ? error.message : "Synchronization failed."
          );
        }
      }
      onSynced?.();
    } finally {
      setSyncing(false);
      refresh();
    }
  }, [inventoryProduct, onSynced, refresh, syncing, tenantId]);

  useEffect(() => {
    function handleOnline() {
      void syncQueue();
    }
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [syncQueue]);

  useEffect(() => {
    if (!inventoryProduct || !isBrowserOnline()) return;
    const timer = window.setTimeout(() => {
      void syncQueue();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [inventoryProduct, syncQueue]);

  const retryFailedSync = useCallback(() => syncQueue({ retryFailed: true }), [syncQueue]);

  return { failedEntries, pendingCount, refresh, retryFailedSync, syncQueue, syncing };
}
