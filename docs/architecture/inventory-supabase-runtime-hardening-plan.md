# Inventory Supabase Runtime Hardening — Implementation Plan

## Starting point

- Branch: `feat/inventory-supabase-runtime-hardening` from `ced4fd4`
- Canonical inventory ledger exists in IndexedDB (`inventory-product-repositories.ts`)
- Supabase `inv_*` schema and product-import RPC exist; inventory app adapters are stubbed
- Mobile barcode and product-import UI still trust preview tenant / local Dexie state

## Target architecture

```
UI (production)
  → authenticated /api/inventory/* or /api/products/import/*
  → resolveForgeOSSession()
  → permission check (inventory:view | inventory:manage | products:manage)
  → inventory-service / product-import-service
  → Supabase RPC or tenant-scoped query (service role + session tenant guard)
  → inv_activity_log audit row
  → typed JSON response
```

IndexedDB remains only for:

- offline movement queue (no trusted tenant/actor)
- optional local demo when `FORGEOS_PERSISTENCE_MODE=local` or explicit demo flag

## Work packages

### 1. Database (forward-only migration)

- `inv_barcode_records` for multi-barcode / ambiguous resolution
- `inv_write_activity_log()` helper
- `inv_available_quantity()` balance helper with reservation awareness
- `inv_post_stock_movement()` idempotent receipt/issue/transfer/adjust RPC
- `inv_create_reservation()` / `inv_release_reservation()`
- `inv_link_barcode()` with duplicate guard
- Product-import audit events on upload/approve/apply/failure (service layer)

### 2. Server application layer

- `src/application/inventory-service.ts` — reads + RPC orchestration
- `src/features/inventory/auth.ts` — view/manage permission helpers
- `src/app/api/inventory/**` — REST surface for inventory and mobile

### 3. Client runtime

- `src/lib/inventory/runtime.ts` — production vs demo detection
- `src/lib/inventory/api-client.ts` — authenticated fetch wrapper
- Refactor mobile scan shell / stock panel to call API in production
- Harden offline queue: session-scoped key, no tenant in payload, quarantine on switch

### 4. Product import

- `src/lib/product-import/api-client.ts`
- Mapping profile CRUD routes under `/api/products/import/mapping-profiles`
- Refactor `product-import-shell.tsx` to use server job state in supabase mode
- Error-report download action wired to existing endpoint

### 5. Tests

- Unit: auth, permissions, offline queue quarantine, API client mapping
- Integration: inventory RPCs (receipt, issue, transfer, adjust, reservations, barcodes, idempotency)
- Extend `test:supabase:integration` script

## Commit sequence

1. authenticated inventory repository and RPCs
2. mobile barcode server integration
3. offline queue hardening
4. Product Import API UI wiring
5. mapping profiles and error report
6. audit logging
7. tests and documentation
