"use client";

import type { ReactNode } from "react";
import { panelClass } from "@/components/app-frame";

export type SearchAndFilterBarProps = {
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  showArchivedLabel: string;
  showArchived: boolean;
  onShowArchivedChange: (value: boolean) => void;
  filters?: ReactNode;
  actions?: ReactNode;
};

export function SearchAndFilterBar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  showArchivedLabel,
  showArchived,
  onShowArchivedChange,
  filters,
  actions
}: SearchAndFilterBarProps) {
  return (
    <div className={`${panelClass} mb-4 p-4`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <input
          aria-label={searchPlaceholder}
          className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none ring-orange-400 focus:ring-1 lg:max-w-md"
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          type="search"
          value={searchValue}
        />
        <div className="flex flex-wrap items-center gap-3">
          {filters}
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              checked={showArchived}
              onChange={(e) => onShowArchivedChange(e.target.checked)}
              type="checkbox"
            />
            {showArchivedLabel}
          </label>
          {actions}
        </div>
      </div>
    </div>
  );
}
