"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { InventoryReservation } from "@/domain/inventory-product-types";
import { hasInventoryDesktopCapability, resolveInventoryDesktopCapabilities } from "@/lib/inventory/capabilities";
import {
  createEmptyInventoryProductSnapshot,
  loadDesktopSnapshotFromSupabase
} from "@/lib/inventory/desktop-snapshot";
import {
  createDemoDesktopWorkflows,
  createSupabaseDesktopWorkflows,
  type DesktopWorkflowHandlers
} from "@/lib/inventory/desktop-workflows";
import {
  fetchInventoryItems,
  fetchMovementHistory,
  fetchStockBalances,
  fetchStockLocations
} from "@/lib/inventory/api-client";
import { readClientInventoryRuntimeMode, type InventoryRuntimeMode } from "@/lib/inventory/runtime";
import type { InventoryProductSnapshot } from "@/persistence/interfaces";
import { usePersistence } from "@/persistence/provider";

type LoadState =
  | { status: "idle" }
  | { status: "loaded"; snapshot: InventoryProductSnapshot }
  | { status: "error"; message: string };

export type InventoryWorkspaceData = {
  mode: InventoryRuntimeMode;
  snapshot: InventoryProductSnapshot;
  tenantId: string;
  loading: boolean;
  error: string | null;
  capabilities: ReadonlySet<import("@/lib/inventory/capabilities").InventoryDesktopCapability>;
  canPersistLabels: boolean;
  refresh: () => Promise<InventoryProductSnapshot | null>;
  setSnapshot: (snapshot: InventoryProductSnapshot) => void;
  workflows: DesktopWorkflowHandlers;
};

export function useInventoryWorkspaceData(): InventoryWorkspaceData {
  const runtimeMode = readClientInventoryRuntimeMode();
  const isSupabase = runtimeMode === "supabase";
  const { notifyDataChanged, state: persistenceState, tenantId } = usePersistence();
  const [loadState, setLoadState] = useState<LoadState>({ status: "idle" });
  const sessionReservationsRef = useRef<InventoryReservation[]>([]);

  const reloadSnapshot = useCallback(async (): Promise<InventoryProductSnapshot> => {
    if (isSupabase) {
      const snapshot = await loadDesktopSnapshotFromSupabase({
        fetchBalances: fetchStockBalances,
        fetchItems: fetchInventoryItems,
        fetchLocations: fetchStockLocations,
        fetchMovementHistory,
        sessionReservations: sessionReservationsRef.current,
        tenantId
      });
      return snapshot;
    }

    if (persistenceState.status !== "ready") {
      return createEmptyInventoryProductSnapshot();
    }

    let snapshot = await persistenceState.repos.inventoryProduct.getSnapshot(tenantId);
    if (snapshot.items.length === 0 && hasInventoryDesktopCapability(runtimeMode, "seed_demo")) {
      await persistenceState.repos.inventoryProduct.seedDemoFoundation(tenantId);
      snapshot = await persistenceState.repos.inventoryProduct.getSnapshot(tenantId);
    }
    return snapshot;
  }, [isSupabase, persistenceState, runtimeMode, tenantId]);

  const refresh = useCallback(async () => {
    const snapshot = await reloadSnapshot();
    setLoadState({ status: "loaded", snapshot });
    notifyDataChanged();
    return snapshot;
  }, [notifyDataChanged, reloadSnapshot]);

  useEffect(() => {
    if (!isSupabase && persistenceState.status !== "ready") {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const snapshot = await reloadSnapshot();
        if (cancelled) return;
        queueMicrotask(() => {
          if (!cancelled) {
            setLoadState({ status: "loaded", snapshot });
          }
        });
      } catch (error) {
        if (cancelled) return;
        queueMicrotask(() => {
          if (!cancelled) {
            setLoadState({
              status: "error",
              message: error instanceof Error ? error.message : "Failed to load inventory workspace."
            });
          }
        });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [isSupabase, persistenceState.status, reloadSnapshot]);

  const setSnapshot = useCallback((snapshot: InventoryProductSnapshot) => {
    setLoadState({ status: "loaded", snapshot });
  }, []);

  const onReservationCreated = useCallback((reservation: InventoryReservation) => {
    sessionReservationsRef.current = [...sessionReservationsRef.current, reservation];
  }, []);

  const onReservationReleased = useCallback((reservationId: string) => {
    sessionReservationsRef.current = sessionReservationsRef.current.map((reservation) =>
      reservation.id === reservationId ? { ...reservation, status: "released" } : reservation
    );
  }, []);

  const workflows = useMemo<DesktopWorkflowHandlers>(() => {
    if (isSupabase) {
      return createSupabaseDesktopWorkflows({
        onReservationCreated,
        onReservationReleased,
        reloadSnapshot: async () => {
          const snapshot = await reloadSnapshot();
          setLoadState({ status: "loaded", snapshot });
          notifyDataChanged();
          return snapshot;
        }
      });
    }

    if (persistenceState.status !== "ready") {
      return {
        async createReservation() {
          throw new Error("Persistence is not ready.");
        },
        async releaseReservation() {
          throw new Error("Persistence is not ready.");
        },
        async runWorkflow() {
          throw new Error("Persistence is not ready.");
        }
      };
    }

    return createDemoDesktopWorkflows({
      notifyDataChanged,
      persistenceState,
      reloadSnapshot: async () => {
        const snapshot = await reloadSnapshot();
        setLoadState({ status: "loaded", snapshot });
        return snapshot;
      },
      tenantId
    });
  }, [
    isSupabase,
    notifyDataChanged,
    onReservationCreated,
    onReservationReleased,
    persistenceState,
    reloadSnapshot,
    tenantId
  ]);

  const snapshot =
    loadState.status === "loaded" ? loadState.snapshot : createEmptyInventoryProductSnapshot();
  const error = loadState.status === "error" ? loadState.message : null;
  const loading =
    loadState.status === "idle" &&
    (isSupabase || persistenceState.status === "ready" || persistenceState.status === "loading");

  return {
    canPersistLabels: hasInventoryDesktopCapability(runtimeMode, "label_persist"),
    capabilities: resolveInventoryDesktopCapabilities(runtimeMode),
    error,
    loading,
    mode: runtimeMode,
    refresh,
    setSnapshot,
    snapshot,
    tenantId,
    workflows
  };
}
