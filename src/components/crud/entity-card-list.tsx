"use client";

import type { ReactNode } from "react";
import { panelClass } from "@/components/app-frame";

type EntityCardListProps<T> = {
  rows: T[];
  rowKey: (row: T) => string;
  title: (row: T) => ReactNode;
  subtitle?: (row: T) => ReactNode;
  meta?: (row: T) => ReactNode;
  actions?: (row: T) => ReactNode;
  archivedRowClass?: (row: T) => boolean;
};

export function EntityCardList<T>({
  rows,
  rowKey,
  title,
  subtitle,
  meta,
  actions,
  archivedRowClass
}: EntityCardListProps<T>) {
  return (
    <div className="space-y-3 md:hidden">
      {rows.map((row) => {
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
}
