# Table density and overlay visual QA report

**Branch:** `fix/table-density-and-action-overlays`  
**Date:** 2026-07-03

## Routes reviewed

| Route | Viewport | Theme | Language | Row behavior | Menu behavior |
|-------|----------|-------|----------|--------------|---------------|
| `/pt-PT/leadops` | 1440×900 | Dark | PT-PT | 10 default, expand 25 | Portaled, not clipped |
| `/en/leadops` | 1440×900 | Dark | EN | 10 default, expand 25 | Portaled |
| `/pt-PT/customers` | 390×844 | Dark | PT-PT | Compact when >10 | Portaled on cards/desktop |
| `/pt-PT/products` | 1024×768 | Dark | PT-PT | Compact when >10 | Portaled |
| `/pt-PT/leadops/campaigns` | 1440×900 | Dark | PT-PT | Collapsible when >10 | N/A (link actions) |

## Defects found (pre-fix)

1. LeadOps database rendered 25 rows per page by default — page excessively long with 271+ records
2. Row action menus clipped inside `overflow-x-auto` containers on bottom rows

## Fixes made

1. Shared `useCollapsibleRows` + `CollapsibleTableViewport`
2. LeadOps default page size 10, expanded 25
3. EntityTable/EntityCardList integrated collapsible viewport + pagination
4. `DataTableActionMenu` with portal + collision positioning

## Remaining exclusions

- `leadops-campaign-detail-shell.tsx` — concurrent outreach integration
- Central i18n dictionaries — isolated `table-density-labels.ts` used instead
- Suppression panel — low row counts, inline actions only

## Console errors

None observed during targeted review paths.
