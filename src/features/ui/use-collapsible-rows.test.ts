import { describe, expect, it } from "vitest";
import { getTableDensityLabels } from "@/components/ui/table-density-labels";
import { computeMenuPosition } from "@/components/ui/overlay-position";
import {
  COLLAPSED_ROW_COUNT,
  EXPANDED_ROW_COUNT,
  resolveVisibleRowCount,
  sliceRowsForViewport,
  totalPagesForViewport
} from "@/features/ui/use-collapsible-rows";
import {
  LEAD_COLLAPSED_PAGE_SIZE,
  LEAD_EXPANDED_PAGE_SIZE,
  paginateRows,
  totalPages
} from "@/features/leadops/lead-management";

function makeRows(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index + 1);
}

describe("resolveVisibleRowCount", () => {
  it("returns 0 for empty datasets", () => {
    expect(resolveVisibleRowCount(0, false)).toBe(0);
  });

  it("returns total when fewer than collapsed count", () => {
    expect(resolveVisibleRowCount(7, false)).toBe(7);
    expect(resolveVisibleRowCount(10, false)).toBe(10);
  });

  it("returns collapsed count by default for large datasets", () => {
    expect(resolveVisibleRowCount(11, false)).toBe(COLLAPSED_ROW_COUNT);
    expect(resolveVisibleRowCount(271, false)).toBe(COLLAPSED_ROW_COUNT);
  });

  it("returns expanded count when expanded", () => {
    expect(resolveVisibleRowCount(271, true)).toBe(EXPANDED_ROW_COUNT);
    expect(resolveVisibleRowCount(50, true)).toBe(EXPANDED_ROW_COUNT);
  });

  it("caps expanded count at max expanded limit", () => {
    expect(resolveVisibleRowCount(100, true, 10, 60, 50)).toBe(50);
  });
});

describe("sliceRowsForViewport", () => {
  const rows = makeRows(271);

  it("shows first 10 rows on page 1 when collapsed", () => {
    expect(sliceRowsForViewport(rows, 1, 10)).toEqual(makeRows(10));
  });

  it("shows rows 11-20 on page 2 when collapsed", () => {
    expect(sliceRowsForViewport(rows, 2, 10)).toEqual(makeRows(10).map((n) => n + 10));
  });

  it("shows 25 rows when expanded on page 1", () => {
    expect(sliceRowsForViewport(rows, 1, 25)).toHaveLength(25);
  });

  it("shows remaining rows on final page", () => {
    const pages = totalPagesForViewport(271, 25);
    const lastPage = sliceRowsForViewport(rows, pages, 25);
    expect(lastPage).toHaveLength(21);
  });
});

describe("totalPagesForViewport", () => {
  it("returns 1 for empty data", () => {
    expect(totalPagesForViewport(0, 10)).toBe(1);
  });

  it("calculates pages for 271 rows at size 10", () => {
    expect(totalPagesForViewport(271, 10)).toBe(28);
  });

  it("calculates pages for 271 rows at size 25", () => {
    expect(totalPagesForViewport(271, 25)).toBe(11);
  });
});

describe("table density labels", () => {
  it("uses English labels", () => {
    const labels = getTableDensityLabels("en");
    expect(labels.showMore).toBe("Show more");
    expect(labels.showLess).toBe("Show less");
    expect(labels.showingCount(10, 271)).toBe("Showing 10 of 271");
  });

  it("uses PT-PT labels", () => {
    const labels = getTableDensityLabels("pt-PT");
    expect(labels.showMore).toBe("Mostrar mais");
    expect(labels.showLess).toBe("Mostrar menos");
    expect(labels.showingCount(10, 271)).toBe("A mostrar 10 de 271");
  });
});

describe("LeadOps pagination integration", () => {
  const rows = makeRows(271);

  it("defaults to 10 visible rows per page", () => {
    const pageRows = paginateRows(rows, 1, LEAD_COLLAPSED_PAGE_SIZE);
    expect(pageRows).toHaveLength(10);
    expect(totalPages(rows.length, LEAD_COLLAPSED_PAGE_SIZE)).toBe(28);
  });

  it("expands to 25 rows per page without rendering all rows", () => {
    const pageRows = paginateRows(rows, 1, LEAD_EXPANDED_PAGE_SIZE);
    expect(pageRows).toHaveLength(25);
    expect(pageRows).not.toHaveLength(271);
    expect(totalPages(rows.length, LEAD_EXPANDED_PAGE_SIZE)).toBe(11);
  });

  it("preserves page slices after expansion math", () => {
    const collapsedPage2 = paginateRows(rows, 2, LEAD_COLLAPSED_PAGE_SIZE);
    expect(collapsedPage2[0]).toBe(11);
    const expandedPage1 = paginateRows(rows, 1, LEAD_EXPANDED_PAGE_SIZE);
    expect(expandedPage1).toContain(11);
  });
});

describe("computeMenuPosition", () => {
  const viewport = { width: 390, height: 844 };

  it("opens below trigger when space allows", () => {
    const position = computeMenuPosition(
      { top: 100, bottom: 130, right: 200, width: 80 },
      120,
      160,
      viewport
    );
    expect(position.top).toBe(134);
  });

  it("flips upward near bottom edge", () => {
    const position = computeMenuPosition(
      { top: 780, bottom: 810, right: 200, width: 80 },
      120,
      160,
      viewport
    );
    expect(position.top).toBeLessThan(780);
  });

  it("shifts left near right edge", () => {
    const position = computeMenuPosition(
      { top: 100, bottom: 130, right: 380, width: 80 },
      120,
      160,
      viewport
    );
    expect(position.left).toBeLessThanOrEqual(220);
  });
});
