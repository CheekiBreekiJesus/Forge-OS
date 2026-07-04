"use client";

import type { ReactNode } from "react";
import type { TableDensityLabels } from "@/components/ui/table-density-labels";

type CollapsibleTableViewportProps = {
  children: ReactNode;
  controlsId: string;
  expanded: boolean;
  labels: TableDensityLabels;
  onToggleExpanded: () => void;
  showExpandControl: boolean;
  showingVisible: number;
  showingTotal: number;
  tableId?: string;
};

export function CollapsibleTableViewport({
  children,
  controlsId,
  expanded,
  labels,
  onToggleExpanded,
  showExpandControl,
  showingVisible,
  showingTotal,
  tableId
}: CollapsibleTableViewportProps) {
  return (
    <div className="space-y-3">
      <div aria-labelledby={controlsId} id={tableId}>
        {children}
      </div>
      {showingTotal > 0 ? (
        <p className="text-sm text-slate-400" id={controlsId}>
          {labels.showingCount(showingVisible, showingTotal)}
        </p>
      ) : null}
      {showExpandControl ? (
        <button
          aria-controls={tableId}
          aria-expanded={expanded}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          data-testid={expanded ? "table-show-less" : "table-show-more"}
          onClick={onToggleExpanded}
          type="button"
        >
          {expanded ? labels.showLess : labels.showMore}
        </button>
      ) : null}
    </div>
  );
}
