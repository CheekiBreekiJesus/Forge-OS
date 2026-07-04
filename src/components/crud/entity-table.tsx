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

export type EntityTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

type EntityTableProps<T> = {
  columns: EntityTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  actionsColumn?: (row: T) => ReactNode;
  actionsHeader?: string;
  archivedRowClass?: (row: T) => boolean;
  locale: Locale;
  enableCollapsibleViewport?: boolean;
};

export function EntityTable<T>({
  columns,
  rows,
  rowKey,
  actionsColumn,
  actionsHeader = "",
  archivedRowClass,
  locale,
  enableCollapsibleViewport = true
}: EntityTableProps<T>) {
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

  const table = (
    <div className={`${panelClass} hidden overflow-x-auto md:block`}>
      <table className="min-w-full text-left text-sm">
        <thead className="text-slate-400">
          <tr>
            {columns.map((col) => (
              <th className={`px-3 py-2 font-medium ${col.className ?? ""}`} key={col.key}>
                {col.header}
              </th>
            ))}
            {actionsColumn ? (
              <th className="px-3 py-2 text-right font-medium">{actionsHeader}</th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => {
            const archived = archivedRowClass?.(row) ?? false;
            return (
              <tr
                className={`border-t border-slate-800 ${archived ? "opacity-60" : ""}`}
                data-testid={`entity-row-${rowKey(row)}`}
                key={rowKey(row)}
              >
                {columns.map((col) => (
                  <td className={`px-3 py-3 ${col.className ?? ""}`} key={col.key}>
                    {col.render(row)}
                  </td>
                ))}
                {actionsColumn ? (
                  <td className="px-3 py-3 text-right">{actionsColumn(row)}</td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (!enableCollapsibleViewport || rows.length <= 10) {
    return table;
  }

  return (
    <div className="hidden md:block">
      <CollapsibleTableViewport
        controlsId={collapsible.controlsId}
        expanded={collapsible.expanded}
        labels={collapsible.labels}
        onToggleExpanded={collapsible.toggleExpanded}
        showExpandControl={collapsible.showExpandControl}
        showingTotal={collapsible.showingTotal}
        showingVisible={visibleRows.length}
        tableId="entity-table-viewport"
      >
        {table}
      </CollapsibleTableViewport>
      {showPagination ? (
        <div className="mt-3 flex items-center justify-end gap-2 text-sm text-slate-400">
          <button
            className="rounded border border-slate-700 px-3 py-1 disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            type="button"
          >
            ←
          </button>
          <span>
            {effectivePage} / {pages}
          </span>
          <button
            className="rounded border border-slate-700 px-3 py-1 disabled:opacity-50"
            disabled={effectivePage >= pages}
            onClick={() => setPage((current) => Math.min(pages, current + 1))}
            type="button"
          >
            →
          </button>
        </div>
      ) : null}
    </div>
  );
}
