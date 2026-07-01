# Inventory Roadmap

## Milestone 1: Master Data And Ledger Foundation

Status: **foundation checkpoint shipped (preview UI + unit-tested rules; persistence deferred)**

- Product master and inventory item separation.
- Variants, references and packaging.
- Units and packaging conversions.
- Warehouses, locations, lots and stock conditions.
- Immutable ledger, reversals, idempotency and rebuildable balances.
- Reservations and stock count boundaries.
- Barcode registry, label templates, browser preview and downloadable ZPL.
- Receiving, transfer and import-staging foundations.

**Not in Milestone 1:** Dexie persistence for canonical entities, real import commit, printer integration.

## Milestone 2: Production Transformations

- Production material issue and return.
- Production output posting.
- Repacking, relabelling, flow-pack and thermoshrink confirmations.
- WIP route execution.

## Milestone 3: Warehouse Mobile And Offline Commands

- Mobile scanning workflows.
- Offline command queue.
- Conflict resolution and sync status.
- Warehouse operator UX for tablets and handhelds.

## Milestone 4: Vehicle Loading And Dispatch

- Vehicle locations as active dispatch containers.
- Loading, unloading and delivery confirmation.
- Picking and packing workflows.

## Milestone 5: Invoice Preparation And Returns

- Invoice-draft preparation.
- Customer delivery confirmation.
- Customer returns.
- Legal invoicing integration boundary.

