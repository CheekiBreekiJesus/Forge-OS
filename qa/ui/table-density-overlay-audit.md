# Table density and overlay audit

**Branch:** `fix/table-density-and-action-overlays`  
**Date:** 2026-07-03

## Audit summary

| Route | Component | Fix applied |
|-------|-----------|-------------|
| `/leadops` | LeadOpsLeadManagementPanel | Collapsible 10/25 + pagination + portaled actions |
| `/leadops/campaigns` | LeadOpsCampaignListShell | Collapsible 10/25 + pagination |
| `/customers` | EntityTable + EntityCardList | Collapsible 10/25 + pagination + portaled actions |
| `/products` | EntityTable + EntityCardList | Same |
| `/inventory` | EntityTable + EntityCardList | Same |
| `/quotations` | EntityTable + EntityCardList | Same |
| `/production` | EntityTable + EntityCardList | Same |
| `/machines` | EntityTable + EntityCardList | Same |
| `/leadops` suppression | LeadOpsSuppressionPanel | No change (typically <10 rows; inline links) |
| `/leadops/campaigns/[id]` | LeadOpsCampaignDetailShell | Excluded (concurrent agent) |
| Dashboard | ProductionOrdersTable | Excluded (preview widget, ≤5 rows) |
| Import wizard preview | LeadOpsImportWizard | Excluded (scroll box, no row menus) |
| Module placeholders | ModulePageShell | Excluded (static readiness table) |

## LeadOps lead database

- **Before:** 25 rows/page; 271 rows = very long first page perception
- **After:** 10 collapsed / 25 expanded per page; pagination preserved; selection and filters preserved
- **Actions:** RowActionMenu via portaled DataTableActionMenu

## CRUD modules

- **Before:** Render all filtered rows
- **After:** 10 default visible rows, expand to 25, paginate when total > visible count
- **Actions:** Portaled menus escape `overflow-x-auto`

## Exclusions (by design)

- Tables with ≤10 rows: expand control hidden
- Virtualized/fixed-viewport tables: none present
- Campaign detail shell: concurrent integration work

## Clipping result

- Menus render in `document.body` with `position: fixed`
- Collision detection flips upward near bottom, left near right edge
- Table containers retain horizontal scroll
