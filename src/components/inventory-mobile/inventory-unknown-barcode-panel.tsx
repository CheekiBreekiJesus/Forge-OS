"use client";

import { useMemo, useState } from "react";
import type { InventoryItemMaster } from "@/domain/inventory-product-types";
import { inputClassName } from "@/components/crud";
import type { InventoryMobileCopy } from "@/features/inventory-mobile/copy";
import {
  assertInventoryPermission,
  mapPreviewRoleToInventoryRole
} from "@/features/inventory-product/operations";
import { linkBarcodeToItem } from "@/features/inventory-mobile/movement-service";
import { linkInventoryBarcode } from "@/lib/inventory/api-client";
import { readClientInventoryRuntimeMode } from "@/lib/inventory/runtime";
import { readPreviewRole } from "@/features/crud/role-preview";
import type { InventoryProductRepository } from "@/persistence/interfaces";

type InventoryUnknownBarcodePanelProps = {
  copy: InventoryMobileCopy;
  scannedCode: string;
  items: InventoryItemMaster[];
  tenantId: string;
  operatorId: string;
  inventoryProduct?: InventoryProductRepository;
  onRescan: () => void;
  onSelectItem: (item: InventoryItemMaster) => void;
  onBarcodeLinked: () => void;
};

export function InventoryUnknownBarcodePanel({
  copy,
  inventoryProduct,
  items,
  onBarcodeLinked,
  onRescan,
  onSelectItem,
  operatorId,
  scannedCode,
  tenantId
}: InventoryUnknownBarcodePanelProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [linking, setLinking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const previewRole = useMemo(() => readPreviewRole(), []);
  const canLink = useMemo(() => {
    try {
      assertInventoryPermission(mapPreviewRoleToInventoryRole(previewRole), "manage_products");
      return true;
    } catch {
      return false;
    }
  }, [previewRole]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items.filter((item) => item.active).slice(0, 8);
    return items
      .filter((item) => item.active)
      .filter((item) => `${item.name} ${item.internalReference}`.toLowerCase().includes(query))
      .slice(0, 12);
  }, [items, search]);

  const selected = filtered.find((item) => item.id === selectedId) ?? null;

  async function handleLinkBarcode() {
    if (!selected || linking) return;
    if (!canLink) {
      setError(copy.unknown.linkPermissionDenied);
      return;
    }
    setLinking(true);
    setError(null);
    setMessage(null);
    try {
      if (readClientInventoryRuntimeMode() === "supabase") {
        await linkInventoryBarcode({ itemId: selected.id, scannedValue: scannedCode });
      } else {
        if (!inventoryProduct) throw new Error(copy.unknown.linkFailure);
        await linkBarcodeToItem(inventoryProduct, {
          itemId: selected.id,
          operatorId,
          scannedValue: scannedCode,
          tenantId
        });
      }
      setMessage(copy.unknown.linkSuccess);
      onBarcodeLinked();
    } catch (linkError) {
      setError(linkError instanceof Error ? linkError.message : copy.unknown.linkFailure);
    } finally {
      setLinking(false);
    }
  }

  return (
    <div className="space-y-4" data-testid="inventory-unknown-barcode">
      <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
        <h2 className="text-lg font-bold">{copy.unknown.title}</h2>
        <p className="mt-1 text-sm">{copy.unknown.message}</p>
        <p className="mt-3 text-sm">
          {copy.unknown.scannedCode}: <span className="font-mono font-semibold">{scannedCode}</span>
        </p>
        <p className="mt-3 text-xs text-[var(--forge-text-muted)]">{copy.unknown.registrationNote}</p>
      </div>

      <button
        className="min-h-11 w-full rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-4 py-2 text-sm font-semibold"
        onClick={onRescan}
        type="button"
      >
        {copy.scanner.controls.rescan}
      </button>

      <div className="space-y-3 rounded-xl border border-[var(--forge-border)] bg-[var(--forge-surface)] p-4">
        <label className="block text-sm font-semibold">{copy.unknown.searchPlaceholder}</label>
        <input
          className={inputClassName}
          data-testid="unknown-barcode-search"
          onChange={(event) => setSearch(event.target.value)}
          value={search}
        />
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--forge-text-muted)]">{copy.unknown.noSearchResults}</p>
        ) : (
          <ul className="space-y-2">
            {filtered.map((item) => (
              <li key={item.id}>
                <button
                  className={`w-full rounded-lg border px-3 py-3 text-left text-sm ${
                    selectedId === item.id
                      ? "border-[var(--forge-accent-orange)] bg-[var(--forge-accent-orange-soft)]"
                      : "border-[var(--forge-border)] bg-[var(--forge-surface-muted)]"
                  }`}
                  onClick={() => setSelectedId(item.id)}
                  type="button"
                >
                  <div className="font-semibold">{item.name}</div>
                  <div className="font-mono text-xs text-[var(--forge-text-muted)]">
                    {item.internalReference}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
        <button
          className="min-h-12 w-full rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface-muted)] px-4 py-3 text-base font-semibold text-[var(--forge-text-secondary)] disabled:opacity-50"
          disabled={!selected}
          onClick={() => selected && onSelectItem(selected)}
          type="button"
        >
          {copy.unknown.useSelected}
        </button>
        <p className="text-xs text-[var(--forge-text-muted)]">{copy.unknown.sessionOnly}</p>
        {canLink ? (
          <button
            className="min-h-12 w-full rounded-lg bg-[var(--forge-accent-orange)] px-4 py-3 text-base font-semibold text-white disabled:opacity-50"
            data-testid="link-barcode-button"
            disabled={!selected || linking}
            onClick={() => void handleLinkBarcode()}
            type="button"
          >
            {copy.unknown.linkBarcode}
          </button>
        ) : (
          <p className="text-xs text-[var(--forge-text-muted)]">{copy.unknown.linkPermissionDenied}</p>
        )}
        {message ? <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p> : null}
        {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      </div>
    </div>
  );
}
