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
import { getInventoryMobileCopy } from "@/features/inventory-mobile/copy";
import {
  getItemStockContext,
  listItemTransactions
} from "@/features/inventory-mobile/item-context";
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

type ScanView = "scanner" | "item" | "unknown";

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
  const [recentScans, setRecentScans] = useState<Array<{ code: string; itemName: string; at: string }>>([]);
  const [statusMessage, setStatusMessage] = useState(mobileCopy.scanner.scanStatus.idle);

  const operatorId = useMemo(() => `mobile:${readPreviewRole()}`, []);

  const inventoryProduct =
    state.status === "ready" ? state.repos.inventoryProduct : null;

  const onSynced = useCallback(() => {
    notifyDataChanged();
  }, [notifyDataChanged]);

  const { failedEntries, pendingCount, refresh, syncQueue, syncing } = useOfflineMovementSync(
    tenantId,
    inventoryProduct,
    onSynced
  );

  useEffect(() => {
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
        setTransactions(listItemTransactions(next, tenantId, resolvedItem.id));
      }
    }

    void loadSnapshot();
    return () => {
      cancelled = true;
    };
  }, [resolvedItem, state, tenantId]);

  const reloadSnapshot = useCallback(async () => {
    if (state.status !== "ready") return;
    let next = await state.repos.inventoryProduct.getSnapshot(tenantId);
    if (next.items.length === 0) {
      await state.repos.inventoryProduct.seedDemoFoundation(tenantId);
      next = await state.repos.inventoryProduct.getSnapshot(tenantId);
    }
    setSnapshot(next);
    if (resolvedItem) {
      setTransactions(listItemTransactions(next, tenantId, resolvedItem.id));
    }
  }, [resolvedItem, state, tenantId]);

  const itemContext = useMemo(() => {
    if (!snapshot || !resolvedItem) return null;
    return getItemStockContext(snapshot, tenantId, resolvedItem.id);
  }, [resolvedItem, snapshot, tenantId]);

  const handleCodeDetected = useCallback(
    async (code: string) => {
      if (state.status !== "ready" || !snapshot) return;
      setResolving(true);
      setStatusMessage(mobileCopy.scanner.scanStatus.resolving);
      try {
        const result = resolveMobileBarcode(snapshot, tenantId, code);
        vibrateScanSuccess();
        if (result.status === "resolved") {
          setResolvedItem(result.item);
          setBarcodeValue(result.normalizedCode);
          setTransactions(listItemTransactions(snapshot, tenantId, result.item.id));
          setRecentScans((current) =>
            [{ at: new Date().toISOString(), code: result.normalizedCode, itemName: result.item.name }, ...current].slice(0, 5)
          );
          setView("item");
          setStatusMessage(mobileCopy.scanner.scanStatus.detected);
          return;
        }
        setUnknownCode(result.scannedValue);
        setView("unknown");
      } finally {
        setResolving(false);
      }
    },
    [mobileCopy.scanner.scanStatus.detected, mobileCopy.scanner.scanStatus.resolving, snapshot, state.status, tenantId]
  );

  function handleRescan() {
    setView("scanner");
    setResolvedItem(null);
    setBarcodeValue("");
    setUnknownCode("");
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
      setTransactions(listItemTransactions(snapshot, tenantId, item.id));
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
          onSync={() => void syncQueue()}
          pendingCount={pendingCount}
          syncing={syncing}
        />

        {loading || !snapshot ? (
          <LoadingState message={dictionary.inventoryModule.loading} />
        ) : state.status !== "ready" ? (
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
        ) : view === "unknown" ? (
          <InventoryUnknownBarcodePanel
            copy={mobileCopy}
            inventoryProduct={state.repos.inventoryProduct}
            items={snapshot.items}
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
            inventoryProduct={state.repos.inventoryProduct}
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
