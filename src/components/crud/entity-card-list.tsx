"use client";

import { useMemo, useState, type ReactNode } from "react";
import { panelClass } from "@/components/app-frame";
import { CollapsibleTableViewport } from "@/components/ui/collapsible-table-viewport";
import {
  sliceRowsForViewport,
  totalPagesForViewport,
  useCollapsibleRows
} from "@/features/ui/use-collapsible-rows";
import type { Locale } from "@/i18n/config";

type EntityCardListProps<T> = {
  rows: T[];
  rowKey: (row: T) => string;
  title: (row: T) => ReactNode;
  subtitle?: (row: T) => ReactNode;
  meta?: (row: T) => ReactNode;
  actions?: (row: T) => ReactNode;
  archivedRowClass?: (row: T) => boolean;
  locale: Locale;
  enableCollapsibleViewport?: boolean;
};

export function EntityCardList<T>({
  rows,
  rowKey,
  title,
  subtitle,
  meta,
  actions,
  archivedRowClass,
  locale,
  enableCollapsibleViewport = true
}: EntityCardListProps<T>) {
  const [page, setPage] = useState(1);
  const collapsible = useCollapsibleRows({
    totalRows: rows.length,
    locale
  });

  const pages = totalPagesForViewport(rows.length, collapsible.visibleRowCount);
  const effectivePage = Math.min(page, pages);
  const showPagination =
    enableCollapsibleViewport && rows.length > collapsible.visibleRowCount;

  const visibleRows = useMemo(() => {
    if (!enableCollapsibleViewport || rows.length <= 10) return rows;
    return sliceRowsForViewport(rows, effectivePage, collapsible.visibleRowCount);
  }, [collapsible.visibleRowCount, effectivePage, enableCollapsibleViewport, rows]);

  const cards = (
    <div className="space-y-3 md:hidden">
      {visibleRows.map((row) => {
        const archived = archivedRowClass?.(row) ?? false;
        return (
          <article
            className={`${panelClass} p-4 ${archived ? "opacity-60" : ""}`}
            data-testid={`entity-card-${rowKey(row)}`}
            key={rowKey(row)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-100">{title(row)}</div>
                {subtitle ? <div className="mt-1 text-sm text-slate-400">{subtitle(row)}</div> : null}
                {meta ? <div className="mt-2 text-xs text-slate-500">{meta(row)}</div> : null}
              </div>
              {actions ? <div className="shrink-0">{actions(row)}</div> : null}
            </div>
          </article>
        );
      })}
    </div>
  );

  if (!enableCollapsibleViewport || rows.length <= 10) {
    return cards;
  }

  return (
    <div className="md:hidden">
      <CollapsibleTableViewport
        controlsId={`${collapsible.controlsId}-cards`}
        expanded={collapsible.expanded}
        labels={collapsible.labels}
        onToggleExpanded={collapsible.toggleExpanded}
        showExpandControl={collapsible.showExpandControl}
        showingTotal={collapsible.showingTotal}
        showingVisible={visibleRows.length}
        tableId="entity-card-viewport"
      >
        {cards}
      </CollapsibleTableViewport>
      {showPagination ? (
        <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
          <span>{effectivePage} / {pages}</span>
          <div className="flex gap-2">
            <button
              className="rounded border border-slate-700 px-3 py-1 disabled:opacity-50"
              disabled={effectivePage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              ←
            </button>
            <button
              className="rounded border border-slate-700 px-3 py-1 disabled:opacity-50"
              disabled={effectivePage >= pages}
              onClick={() => setPage((current) => Math.min(pages, current + 1))}
              type="button"
            >
              →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
