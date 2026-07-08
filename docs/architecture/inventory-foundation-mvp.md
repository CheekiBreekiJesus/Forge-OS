# Inventory Foundation MVP

## Current branch implementation (checkpoint + completion)

- Canonical domain types in `src/domain/inventory-product-types.ts`
- Deterministic ledger rules in `src/features/inventory-product/ledger.ts`
- Workflow orchestration in `src/features/inventory-product/operations.ts`
- Dexie persistence v14 in `src/persistence/db.ts` and `inventory-product-repositories.ts`
- Legacy `InventoryItem` / `StockMovement` CRUD remains in `inventory-shell.tsx` (unchanged path)
- Workspace UI at `/[locale]/inventory/{section}` with forms for receive, issue, transfer, adjust, reservations
- Supabase reconciliation migration `202607080001_inventory_foundation.sql`

## Missing / deferred (post-MVP)

- Camera barcode scanning (fields prepared only)
- Supabase runtime repository wiring (schema + integration test only)
- Production issue/output transaction types
- Full import commit from CSV staging
- Legacy-to-canonical data migration adapters

## Database changes

New PostgreSQL tables (tenant-scoped, RLS):

- `inv_item_masters`, `inv_stock_locations`, `inv_lots`
- `inv_transactions`, `inv_ledger_entries`, `inv_reservations`
- `inv_activity_log`

Existing `inventory_items`, `stock_movements`, `warehouses`, `warehouse_locations` are preserved.

## API / domain changes

Client-side repository methods (validated server-side rules in domain layer):

- `receiveStock`, `issueStock`, `transferStock`, `adjustStock`
- `createItem`, `updateItem`
- `createReservation`, `releaseReservation`
- `postTransaction`, `reverseTransaction` (existing)

## UI changes

- `inventory-workflow-panels.tsx` — responsive forms, balance grid, movement history, low-stock alerts
- New sections: `adjustments`, `reservations`
- Preview role selector gates `canPerformInventoryAction`

## Permission model

- Preview roles map to inventory roles (`owner` → `company_owner`, `warehouse_manager` → `warehouse_manager`, `sales` → `auditor`)
- ForgeOS auth permissions `inventory:view` / `inventory:manage` remain on main nav (Supabase membership)
- Ledger action matrix enforced in workflow UI via `assertInventoryPermission`

## Testing approach

- Unit: `ledger.test.ts`, `operations.test.ts`
- Dexie integration: `inventory-workflows.test.ts`, `inventory-product-persistence.test.ts`
- Supabase migration: `inventory-foundation.integration.test.ts` (when `FORGEOS_TEST_DATABASE_URL` set)
- Playwright: `e2e/inventory-foundation.spec.ts` (desktop + mobile navigation)
