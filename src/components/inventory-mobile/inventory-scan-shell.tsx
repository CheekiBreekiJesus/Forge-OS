"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppFrame } from "@/components/app-frame";
import { LoadingState } from "@/components/crud";
import { InventoryBarcodeScanner } from "@/components/inventory-mobile/inventory-barcode-scanner";
import { InventoryItemStockPanel } from "@/components/inventory-mobile/inventory-item-stock-panel";
import { InventoryUnknownBarcodePanel } from "@/components/inventory-mobile/inventory-unknown-barcode-panel";
import {
  PendingSyncIndicator,
  RecentScanResults
} from "@/components/inventory-mobile/pending-sync-indicator";
import type { InventoryItemMaster, InventoryTransaction } from "@/domain/inventory-product-types";
import { resolveMobileBarcode } from "@/features/inventory-mobile/barcode-resolver";
import {
  buildItemStockContextFromApi,
  getDemoItemStockContext,
  getDemoItemTransactions,
  mapApiItemToMaster,
  mapMovementHistoryToTransactions
} from "@/features/inventory-mobile/server-context";
import {
  fetchMovementHistory,
  fetchStockBalances,
  fetchStockLocations,
  resolveInventoryBarcode
} from "@/lib/inventory/api-client";
import { readClientInventoryRuntimeMode } from "@/lib/inventory/runtime";
import { getInventoryMobileCopy } from "@/features/inventory-mobile/copy";
import { useOfflineMovementSync } from "@/features/inventory-mobile/use-offline-sync";
import { vibrateScanSuccess } from "@/features/inventory-mobile/scan-feedback";
import { readPreviewRole } from "@/features/crud/role-preview";
import { usePersistence, usePersistenceLoading } from "@/persistence/provider";
import type { InventoryProductSnapshot } from "@/persistence/interfaces";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { getLocalizedModuleHref } from "@/modules/config";

type InventoryScanShellProps = {
  dictionary: Dictionary;
  locale: Locale;
};

const EMPTY_SNAPSHOT: InventoryProductSnapshot = {
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

type ScanView = "scanner" | "item" | "unknown" | "ambiguous";

export function InventoryScanShell({ dictionary, locale }: InventoryScanShellProps) {
  const mobileCopy = getInventoryMobileCopy(locale);
  const loading = usePersistenceLoading();
  const { state, tenantId, notifyDataChanged } = usePersistence();
  const [snapshot, setSnapshot] = useState<InventoryProductSnapshot | null>(null);
  const [view, setView] = useState<ScanView>("scanner");
  const [resolving, setResolving] = useState(false);
  const [resolvedItem, setResolvedItem] = useState<InventoryItemMaster | null>(null);
  const [barcodeValue, setBarcodeValue] = useState("");
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [unknownCode, setUnknownCode] = useState("");
  const [ambiguousMatchCount, setAmbiguousMatchCount] = useState(0);
  const [recentScans, setRecentScans] = useState<Array<{ code: string; itemName: string; at: string }>>([]);
  const [statusMessage, setStatusMessage] = useState(mobileCopy.scanner.scanStatus.idle);

  const runtimeMode = readClientInventoryRuntimeMode();
  const isDemoRuntime = runtimeMode === "demo";
  const operatorId = useMemo(
    () => (isDemoRuntime ? `mobile:${readPreviewRole()}` : "authenticated"),
    [isDemoRuntime]
  );
  const sessionScope = useMemo(
    () => (isDemoRuntime ? `demo:${tenantId}` : "supabase-session"),
    [isDemoRuntime, tenantId]
  );

  const inventoryProduct =
    state.status === "ready" ? state.repos.inventoryProduct : null;

  const onSynced = useCallback(() => {
    notifyDataChanged();
  }, [notifyDataChanged]);

  const { failedEntries, pendingCount, refresh, retryFailedSync, syncQueue, syncing } = useOfflineMovementSync(
    sessionScope,
    inventoryProduct,
    onSynced,
    isDemoRuntime ? operatorId : undefined,
    isDemoRuntime ? tenantId : undefined
  );

  useEffect(() => {
    if (!isDemoRuntime) return;
    if (state.status !== "ready") return;
    const repos = state.repos;
    let cancelled = false;

    async function loadSnapshot() {
      let next = await repos.inventoryProduct.getSnapshot(tenantId);
      if (next.items.length === 0) {
        await repos.inventoryProduct.seedDemoFoundation(tenantId);
        next = await repos.inventoryProduct.getSnapshot(tenantId);
      }
      if (cancelled) return;
      setSnapshot(next);
      if (resolvedItem) {
        setTransactions(getDemoItemTransactions(next, tenantId, resolvedItem.id));
      }
    }

    void loadSnapshot();
    return () => {
      cancelled = true;
    };
  }, [isDemoRuntime, resolvedItem, state, tenantId]);

  const [apiItemContext, setApiItemContext] = useState<ReturnType<typeof buildItemStockContextFromApi> | null>(null);

  const reloadApiContext = useCallback(async (itemId: string) => {
    const [locations, balances, movements] = await Promise.all([
      fetchStockLocations(),
      fetchStockBalances(itemId),
      fetchMovementHistory(itemId)
    ]);
    const item = await fetch(`/api/inventory/items/${encodeURIComponent(itemId)}`, {
      credentials: "include"
    }).then(async (response) => {
      const payload = (await response.json()) as { item?: { id: string } };
      if (!response.ok || !payload.item) throw new Error("Item not found.");
      return payload.item as import("@/application/inventory-service").InventoryItemSummary;
    });
    setApiItemContext(
      buildItemStockContextFromApi({ balances, item, locations, tenantId: "server" })
    );
    setTransactions(mapMovementHistoryToTransactions(movements, "server"));
  }, []);

  const reloadSnapshot = useCallback(async () => {
    if (!isDemoRuntime) {
      if (resolvedItem) await reloadApiContext(resolvedItem.id);
      return;
    }
    if (state.status !== "ready") return;
    let next = await state.repos.inventoryProduct.getSnapshot(tenantId);
    if (next.items.length === 0) {
      await state.repos.inventoryProduct.seedDemoFoundation(tenantId);
      next = await state.repos.inventoryProduct.getSnapshot(tenantId);
    }
    setSnapshot(next);
    if (resolvedItem) {
      setTransactions(getDemoItemTransactions(next, tenantId, resolvedItem.id));
    }
  }, [isDemoRuntime, reloadApiContext, resolvedItem, state, tenantId]);

  const demoSnapshot = snapshot ?? EMPTY_SNAPSHOT;

  const itemContext = useMemo(() => {
    if (!resolvedItem) return null;
    if (!isDemoRuntime) return apiItemContext;
    if (!snapshot) return null;
    return getDemoItemStockContext(demoSnapshot, tenantId, resolvedItem.id);
  }, [apiItemContext, demoSnapshot, isDemoRuntime, resolvedItem, snapshot, tenantId]);

  const handleCodeDetected = useCallback(
    async (code: string) => {
      setResolving(true);
      setStatusMessage(mobileCopy.scanner.scanStatus.resolving);
      try {
        if (!isDemoRuntime) {
          const result = await resolveInventoryBarcode(code);
          vibrateScanSuccess();
          if (result.status === "resolved") {
            const item = mapApiItemToMaster(result.item, "server");
            setResolvedItem(item);
            setBarcodeValue(result.normalizedValue);
            await reloadApiContext(item.id);
            setRecentScans((current) =>
              [{ at: new Date().toISOString(), code: result.normalizedValue, itemName: item.name }, ...current].slice(0, 5)
            );
            setView("item");
            setStatusMessage(mobileCopy.scanner.scanStatus.detected);
            return;
          }
          if (result.status === "ambiguous") {
            setUnknownCode(result.scannedValue);
            setAmbiguousMatchCount(result.matches.length);
            setView("ambiguous");
            setStatusMessage(mobileCopy.ambiguous.message);
            return;
          }
          setUnknownCode(result.scannedValue);
          setView("unknown");
          return;
        }

        if (state.status !== "ready" || !snapshot) return;
        const result = resolveMobileBarcode(demoSnapshot, tenantId, code);
        vibrateScanSuccess();
        if (result.status === "resolved") {
          setResolvedItem(result.item);
          setBarcodeValue(result.normalizedCode);
          setTransactions(getDemoItemTransactions(demoSnapshot, tenantId, result.item.id));
          setRecentScans((current) =>
            [{ at: new Date().toISOString(), code: result.normalizedCode, itemName: result.item.name }, ...current].slice(0, 5)
          );
          setView("item");
          setStatusMessage(mobileCopy.scanner.scanStatus.detected);
          return;
        }
        if (result.status === "ambiguous") {
          setUnknownCode(result.scannedValue);
          setAmbiguousMatchCount(result.barcodes.length);
          setView("ambiguous");
          setStatusMessage(mobileCopy.ambiguous.message);
          return;
        }
        setUnknownCode(result.scannedValue);
        setView("unknown");
      } finally {
        setResolving(false);
      }
    },
    [isDemoRuntime, demoSnapshot, mobileCopy.ambiguous.message, mobileCopy.scanner.scanStatus.detected, mobileCopy.scanner.scanStatus.resolving, reloadApiContext, snapshot, state.status, tenantId]
  );

  function handleRescan() {
    setView("scanner");
    setResolvedItem(null);
    setBarcodeValue("");
    setUnknownCode("");
    setAmbiguousMatchCount(0);
    setTransactions([]);
    setStatusMessage(mobileCopy.scanner.scanStatus.idle);
  }

  async function handlePosted() {
    notifyDataChanged();
    await reloadSnapshot();
    refresh();
  }

  async function handleBarcodeLinked() {
    await reloadSnapshot();
    if (unknownCode) {
      await handleCodeDetected(unknownCode);
    }
  }

  function handleManualItemSelect(item: InventoryItemMaster) {
    setResolvedItem(item);
    setBarcodeValue(unknownCode);
    setView("item");
    if (snapshot) {
      setTransactions(getDemoItemTransactions(snapshot, tenantId, item.id));
    }
  }

  return (
    <AppFrame
      activeModule="inventory"
      dictionary={dictionary}
      locale={locale}
      supplementalRoute="inventory/scan"
    >
      <div className="mx-auto max-w-lg space-y-4 px-1 pb-8">
        <header className="space-y-2">
          <Link
            className="inline-flex min-h-10 items-center text-sm font-semibold text-[var(--forge-accent-orange)]"
            href={getLocalizedModuleHref(locale, "inventory")}
          >
            ← {mobileCopy.scanner.backToInventory}
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{mobileCopy.scanner.title}</h1>
          <p className="text-sm text-[var(--forge-text-secondary)]">{mobileCopy.scanner.description}</p>
          {resolving ? (
            <p className="text-sm font-medium text-[var(--forge-text-secondary)]">{statusMessage}</p>
          ) : null}
        </header>

        <PendingSyncIndicator
          copy={mobileCopy}
          failedEntries={failedEntries}
          onRetryFailed={() => void retryFailedSync()}
          onSync={() => void syncQueue()}
          pendingCount={pendingCount}
          syncing={syncing}
        />

        {isDemoRuntime && (loading || !snapshot) ? (
          <LoadingState message={dictionary.inventoryModule.loading} />
        ) : !isDemoRuntime && resolving && view === "scanner" ? (
          <LoadingState message={dictionary.inventoryModule.loading} />
        ) : state.status !== "ready" && isDemoRuntime ? (
          <LoadingState message={dictionary.inventoryModule.loading} />
        ) : view === "scanner" ? (
          <>
            <InventoryBarcodeScanner
              copy={mobileCopy}
              onCodeDetected={(code) => void handleCodeDetected(code)}
              paused={resolving}
            />
            <RecentScanResults copy={mobileCopy} locale={locale} scans={recentScans} />
          </>
        ) : view === "ambiguous" ? (
          <section
            className="space-y-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4"
            data-testid="inventory-ambiguous-barcode"
          >
            <h2 className="text-lg font-semibold">{mobileCopy.ambiguous.title}</h2>
            <p className="text-sm">
              <span className="font-medium">{mobileCopy.ambiguous.scannedCode}: </span>
              <span className="font-mono">{unknownCode}</span>
            </p>
            <p className="text-sm text-[var(--forge-text-secondary)]">{mobileCopy.ambiguous.message}</p>
            <p className="text-sm font-medium">
              {ambiguousMatchCount} {mobileCopy.ambiguous.matchCount}
            </p>
            <button
              className="min-h-11 w-full rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-4 py-2 text-sm font-semibold"
              onClick={handleRescan}
              type="button"
            >
              {mobileCopy.ambiguous.rescan}
            </button>
          </section>
        ) : view === "unknown" ? (
          <InventoryUnknownBarcodePanel
            copy={mobileCopy}
            inventoryProduct={inventoryProduct ?? undefined}
            items={isDemoRuntime && snapshot ? demoSnapshot.items : []}
            onBarcodeLinked={() => void handleBarcodeLinked()}
            onRescan={handleRescan}
            onSelectItem={handleManualItemSelect}
            operatorId={operatorId}
            scannedCode={unknownCode}
            tenantId={tenantId}
          />
        ) : resolvedItem && itemContext ? (
          <InventoryItemStockPanel
            barcodeValue={barcodeValue}
            context={itemContext}
            copy={mobileCopy}
            inventoryProduct={inventoryProduct}
            locale={locale}
            onPosted={() => void handlePosted()}
            onRescan={handleRescan}
            operatorId={operatorId}
            tenantId={tenantId}
            transactions={transactions}
          />
        ) : null}
      </div>
    </AppFrame>
  );
}
