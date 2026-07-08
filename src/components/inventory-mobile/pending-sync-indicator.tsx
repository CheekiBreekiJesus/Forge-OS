"use client";

import type { InventoryMobileCopy } from "@/features/inventory-mobile/copy";
import type { QueuedMovement } from "@/features/inventory-mobile/offline-queue";
import { isBrowserOnline } from "@/features/inventory-mobile/offline-queue";

type PendingSyncIndicatorProps = {
  copy: InventoryMobileCopy;
  pendingCount: number;
  failedEntries: QueuedMovement[];
  syncing: boolean;
  onSync: () => void;
  onRetryFailed?: () => void;
};

export function PendingSyncIndicator({
  copy,
  failedEntries,
  onRetryFailed,
  onSync,
  pendingCount,
  syncing
}: PendingSyncIndicatorProps) {
  if (pendingCount === 0 && failedEntries.length === 0 && isBrowserOnline()) {
    return null;
  }

  return (
    <div className="space-y-2" data-testid="pending-sync-indicator">
      {!isBrowserOnline() ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          {copy.offline.offlineNotice}
        </p>
      ) : null}
      {pendingCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm">
          <span>
            {copy.offline.pendingTitle}: {pendingCount} {copy.offline.pendingCount}
          </span>
          <button
            className="min-h-10 rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-3 py-1 text-sm font-semibold disabled:opacity-50"
            disabled={syncing || !isBrowserOnline()}
            onClick={onSync}
            type="button"
          >
            {syncing ? copy.offline.syncing : copy.offline.syncNow}
          </button>
        </div>
      ) : null}
      {failedEntries.length > 0 ? (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm">
          <p className="font-semibold">{copy.offline.failedTitle}</p>
          <ul className="mt-2 space-y-1">
            {failedEntries.map((entry) => (
              <li key={entry.idempotencyKey}>
                <span className="font-mono text-xs">{entry.kind}</span>
                {entry.lastError ? <span> — {entry.lastError}</span> : null}
              </li>
            ))}
          </ul>
          <button
            className="mt-2 min-h-10 rounded-lg border border-[var(--forge-border)] bg-[var(--forge-surface)] px-3 py-1 text-sm font-semibold"
            onClick={onRetryFailed ?? onSync}
            type="button"
          >
            {copy.offline.retry}
          </button>
        </div>
      ) : null}
    </div>
  );
}

type RecentScanResultsProps = {
  copy: InventoryMobileCopy;
  scans: Array<{ code: string; itemName: string; at: string }>;
  locale: string;
};

export function RecentScanResults({ copy, locale, scans }: RecentScanResultsProps) {
  if (scans.length === 0) return null;
  return (
    <section className="rounded-xl border border-[var(--forge-border)] bg-[var(--forge-surface)] p-4" data-testid="recent-scan-results">
      <h3 className="text-sm font-semibold">{copy.item.recentScans}</h3>
      <ul className="mt-2 space-y-2">
        {scans.map((scan) => (
          <li className="text-sm" key={`${scan.code}-${scan.at}`}>
            <span className="font-mono">{scan.code}</span>
            <span className="text-[var(--forge-text-muted)]"> · {scan.itemName}</span>
            <span className="block text-xs text-[var(--forge-text-muted)]">
              {new Date(scan.at).toLocaleString(locale)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
