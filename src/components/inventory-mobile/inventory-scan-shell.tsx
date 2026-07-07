"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { AppFrame } from "@/components/app-frame";
import { LoadingState } from "@/components/crud";
import { InventoryBarcodeScanner } from "@/components/inventory-mobile/inventory-barcode-scanner";
import { InventoryItemStockPanel } from "@/components/inventory-mobile/inventory-item-stock-panel";
import { InventoryUnknownBarcodePanel } from "@/components/inventory-mobile/inventory-unknown-barcode-panel";
import type { InventoryItem, StockMovement } from "@/domain/operations-types";
import {
  createSkuBarcodeResolver,
  type BarcodeResolveResult
} from "@/features/inventory-mobile/barcode-resolver";
import { getInventoryMobileCopy } from "@/features/inventory-mobile/copy";
import { useInventory } from "@/persistence/hooks";
import { usePersistence, usePersistenceLoading } from "@/persistence/provider";
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
  const { items, loading: dataLoading, reload } = useInventory(false);
  const [view, setView] = useState<ScanView>("scanner");
  const [resolving, setResolving] = useState(false);
  const [resolvedItem, setResolvedItem] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [unknownCode, setUnknownCode] = useState("");
  const [statusMessage, setStatusMessage] = useState(mobileCopy.scanner.scanStatus.idle);

  const resolver = useMemo(() => {
    if (state.status !== "ready") return null;
    return createSkuBarcodeResolver((tid) => state.repos.inventory.list(tid));
  }, [state]);

  const loadMovements = useCallback(
    async (itemId: string) => {
      if (state.status !== "ready") return;
      const rows = await state.repos.inventory.listMovements(tenantId, itemId);
      setMovements(rows);
    },
    [state, tenantId]
  );

  const handleCodeDetected = useCallback(
    async (code: string) => {
      if (!resolver || state.status !== "ready") return;
      setResolving(true);
      setStatusMessage(mobileCopy.scanner.scanStatus.resolving);
      try {
        const result: BarcodeResolveResult = await resolver.resolve(tenantId, code);
        if (result.status === "resolved") {
          setResolvedItem(result.item);
          setView("item");
          await loadMovements(result.item.id);
          setStatusMessage(mobileCopy.scanner.scanStatus.detected);
          return;
        }
        if (result.status === "ambiguous") {
          setUnknownCode(result.scannedValue);
          setView("unknown");
          return;
        }
        setUnknownCode(result.scannedValue);
        setView("unknown");
      } finally {
        setResolving(false);
      }
    },
    [loadMovements, mobileCopy.scanner.scanStatus.detected, mobileCopy.scanner.scanStatus.resolving, resolver, state.status, tenantId]
  );

  function handleRescan() {
    setView("scanner");
    setResolvedItem(null);
    setUnknownCode("");
    setMovements([]);
    setStatusMessage(mobileCopy.scanner.scanStatus.idle);
  }

  async function handlePosted(item: InventoryItem) {
    notifyDataChanged();
    await reload();
    setResolvedItem(item);
    await loadMovements(item.id);
  }

  function handleManualItemSelect(item: InventoryItem) {
    setResolvedItem(item);
    setView("item");
    void loadMovements(item.id);
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

        {loading || (dataLoading && view === "scanner") ? (
          <LoadingState message={dictionary.inventoryModule.loading} />
        ) : state.status !== "ready" ? (
          <LoadingState message={dictionary.inventoryModule.loading} />
        ) : view === "scanner" ? (
          <InventoryBarcodeScanner
            copy={mobileCopy}
            onCodeDetected={(code) => void handleCodeDetected(code)}
            paused={resolving}
          />
        ) : view === "unknown" ? (
          <InventoryUnknownBarcodePanel
            copy={mobileCopy}
            items={items}
            onRescan={handleRescan}
            onSelectItem={handleManualItemSelect}
            scannedCode={unknownCode}
          />
        ) : resolvedItem ? (
          <InventoryItemStockPanel
            copy={mobileCopy}
            inventoryRepo={state.repos.inventory}
            item={resolvedItem}
            locale={locale}
            movements={movements}
            onPosted={(item) => void handlePosted(item)}
            onRescan={handleRescan}
            tenantId={tenantId}
          />
        ) : null}
      </div>
    </AppFrame>
  );
}
