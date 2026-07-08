# Inventory Ledger

The ledger is the source of truth for inventory quantities.

## Transaction Rules

- Posted transactions are immutable.
- Corrections use reversal transactions.
- Duplicate idempotency keys return the existing posted transaction.
- Transfers must contain balanced negative and positive entries.
- Negative available stock is blocked by default.
- Negative-stock overrides require a reason and must later create audit events with elevated permission.

## Supported Milestone 1 Transaction Types

- `receipt`
- `supplier_return`
- `location_transfer`
- `quality_hold`
- `quality_release`
- `adjustment_increase`
- `adjustment_decrease`
- `stock_count_adjustment`
- `reversal`

Production issue/output, vehicle loading, delivery and returns are reserved as enum values but remain non-goals for this milestone.

## Balance Projection

`buildStockBalances()` rebuilds balances from posted ledger entries plus active reservations. Dimensions:

- tenant;
- item;
- product variant;
- warehouse;
- location;
- lot;
- stock condition.

The projection exposes physical, available, reserved, work-in-progress, finished, quarantined, damaged and vehicle stock. Cached balance storage can be added later, but it must always be rebuildable from ledger entries.

## Persistence Status (Milestone 1)

- Ledger rules are implemented in `src/features/inventory-product/ledger.ts` and covered by unit tests.
- The workspace UI applies rules to **in-session demo state** only; Dexie persistence for posted transactions is **not implemented** in this checkpoint.
- Existing legacy `StockMovement` records in Dexie are unchanged and not automatically mapped to ledger entries.

