# Inventory Receiving

Milestone 1 implements a deterministic receiving foundation rather than printer, mobile or supplier integrations.

## Workflow

1. Open receipt.
2. Select supplier.
3. Scan or enter barcode.
4. Resolve item through the barcode registry.
5. Search manually when unresolved.
6. Stage unknown barcode or item proposal.
7. Enter quantity, unit, supplier reference, cost, lot, expiry and quality notes.
8. Select destination location.
9. Validate.
10. Optionally render an internal label.
11. Post immutable receipt transaction.

Unknown barcodes must not create active operational records automatically. They remain staged until an authorized user reviews and activates the mapping.

## Current Implementation

The browser demo uses synthetic local data and posts preview ledger entries in memory. Durable server persistence, real supplier data and real printer output are deferred.

