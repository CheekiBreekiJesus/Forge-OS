# Compact table behavior

ForgeOS tables use a shared compact viewport to keep long lists from dominating page height.

## Defaults

| State | Visible rows per page |
|-------|----------------------|
| Collapsed (default) | 10 |
| Expanded | 25 |
| Maximum non-virtualized | 50 |

## Controls

- Count label: `Showing {visible} of {total}` / `A mostrar {visible} de {total}`
- **Show more** / **Mostrar mais** — increases visible rows to expanded limit
- **Show less** / **Mostrar menos** — returns to collapsed limit
- Control hidden when total rows ≤ 10

## Pagination

- Pagination remains for the full filtered result set
- Page size follows collapsed/expanded visible row count
- Expanding does **not** load or render all database records
- Page index is clamped safely when page size changes

## Preserved state

- Filters and search
- Row selection
- Sort order (where applicable)

## Virtualized tables

No virtualized data grids exist today. If added, adjust viewport height instead of slicing row data.

## Implementation

- Hook: `src/features/ui/use-collapsible-rows.ts`
- Wrapper: `src/components/ui/collapsible-table-viewport.tsx`
- Labels: `src/components/ui/table-density-labels.ts` (isolated from central i18n)

## Exceptions

- Dashboard preview widgets (hard caps)
- Import preview scroll boxes
- Tables that always have ≤10 rows
- `leadops-campaign-detail-shell.tsx` (managed by outreach integration branch)

## Integration

Import `useCollapsibleRows` and `CollapsibleTableViewport`, pass `locale`, slice or paginate data with `visibleRowCount`. Do not edit central i18n dictionaries for these labels.
