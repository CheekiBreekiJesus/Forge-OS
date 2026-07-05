# Table density and overlay baseline

**Branch:** `fix/table-density-and-action-overlays`  
**Base commit:** `160675a`  
**Date:** 2026-07-03

## Shared table primitives

| Component | Path | Role |
|-----------|------|------|
| EntityTable | `src/components/crud/entity-table.tsx` | CRUD desktop tables |
| EntityCardList | `src/components/crud/entity-card-list.tsx` | CRUD mobile cards |
| RowActionMenu | `src/components/crud/row-action-menu.tsx` | Row actions (wraps DataTableActionMenu) |
| LeadOpsLeadManagementPanel | `src/components/leadops-lead-management-panel.tsx` | Lead database inline table |

## Pages using tables

| Module | Route | Component | Pre-fix row behavior |
|--------|-------|-----------|----------------------|
| LeadOps | `/leadops` | LeadOpsLeadManagementPanel | 25 rows/page, all pages tall |
| Customers | `/customers` | EntityTable | All filtered rows |
| Products | `/products` | EntityTable | All filtered rows |
| Inventory | `/inventory` | EntityTable | All filtered rows |
| Quotations | `/quotations` | EntityTable | All filtered rows |
| Production | `/production` | EntityTable | All filtered rows |
| Machines | `/machines` | EntityTable | All filtered rows |
| LeadOps campaigns | `/leadops/campaigns` | LeadOpsCampaignListShell | All rows |
| LeadOps suppression | `/leadops` (panel) | LeadOpsSuppressionPanel | All filtered rows |

## Pagination (pre-fix)

- LeadOps lead table only: `LEAD_PAGE_SIZE = 25`
- CRUD modules: none

## Overflow (pre-fix)

- `overflow-x-auto` on EntityTable and LeadOps table wrappers
- `overflow-x-clip` on app shell main/content

## Action menus (pre-fix)

- Custom `RowActionMenu` with `absolute z-20` inside table cells
- No React portal; clipped by overflow ancestors

## Clipping risks

| Risk | Severity | Location |
|------|----------|----------|
| overflow-x-auto clipping | High | EntityTable, LeadOps tables |
| Bottom-row menus | High | Last visible rows |
| Right-edge menus | Medium | Actions column |

## Intended shared fix

1. `useCollapsibleRows` + `CollapsibleTableViewport` — 10 collapsed / 25 expanded rows with pagination
2. `DataTableActionMenu` — portaled fixed menu with collision-aware positioning (`z-index: 30`)
3. Isolated labels in `src/components/ui/table-density-labels.ts`

## Baseline validation

Recorded before implementation changes on this branch.
