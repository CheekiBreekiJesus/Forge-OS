import { useCallback, useMemo, useState } from "react";
import {
  getTableDensityLabels,
  type TableDensityLabels
} from "@/components/ui/table-density-labels";
import type { Locale } from "@/i18n/config";

export const COLLAPSED_ROW_COUNT = 10;
export const EXPANDED_ROW_COUNT = 25;
export const MAX_EXPANDED_ROW_COUNT = 50;

export type UseCollapsibleRowsOptions = {
  totalRows: number;
  collapsedRowCount?: number;
  expandedRowCount?: number;
  maxExpandedRowCount?: number;
  initiallyExpanded?: boolean;
  locale: Locale;
};

export type UseCollapsibleRowsResult = {
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
  toggleExpanded: () => void;
  visibleRowCount: number;
  showExpandControl: boolean;
  labels: TableDensityLabels;
  showingVisible: number;
  showingTotal: number;
  controlsId: string;
};

export function resolveVisibleRowCount(
  totalRows: number,
  expanded: boolean,
  collapsedRowCount = COLLAPSED_ROW_COUNT,
  expandedRowCount = EXPANDED_ROW_COUNT,
  maxExpandedRowCount = MAX_EXPANDED_ROW_COUNT
): number {
  if (totalRows <= collapsedRowCount) return totalRows;
  const target = expanded
    ? Math.min(expandedRowCount, maxExpandedRowCount)
    : collapsedRowCount;
  return Math.min(target, totalRows);
}

export function useCollapsibleRows({
  totalRows,
  collapsedRowCount = COLLAPSED_ROW_COUNT,
  expandedRowCount = EXPANDED_ROW_COUNT,
  maxExpandedRowCount = MAX_EXPANDED_ROW_COUNT,
  initiallyExpanded = false,
  locale
}: UseCollapsibleRowsOptions): UseCollapsibleRowsResult {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  const visibleRowCount = useMemo(
    () =>
      resolveVisibleRowCount(
        totalRows,
        expanded,
        collapsedRowCount,
        expandedRowCount,
        maxExpandedRowCount
      ),
    [collapsedRowCount, expanded, expandedRowCount, maxExpandedRowCount, totalRows]
  );

  const showExpandControl = totalRows > collapsedRowCount;
  const labels = useMemo(() => getTableDensityLabels(locale), [locale]);

  const toggleExpanded = useCallback(() => {
    setExpanded((current) => !current);
  }, []);

  return {
    expanded,
    setExpanded,
    toggleExpanded,
    visibleRowCount,
    showExpandControl,
    labels,
    showingVisible: visibleRowCount,
    showingTotal: totalRows,
    controlsId: "table-density-controls"
  };
}

export function sliceRowsForViewport<T>(
  rows: T[],
  page: number,
  visibleRowCount: number
): T[] {
  const start = Math.max(0, (page - 1) * visibleRowCount);
  return rows.slice(start, start + visibleRowCount);
}

export function totalPagesForViewport(count: number, visibleRowCount: number): number {
  if (count === 0) return 1;
  return Math.max(1, Math.ceil(count / visibleRowCount));
}
