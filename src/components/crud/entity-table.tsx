"use client";

import type { ReactNode } from "react";
import { panelClass } from "@/components/app-frame";

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
};

export function EntityTable<T>({
  columns,
  rows,
  rowKey,
  actionsColumn,
  actionsHeader = "",
  archivedRowClass
}: EntityTableProps<T>) {
  return (
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
          {rows.map((row) => {
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
}
