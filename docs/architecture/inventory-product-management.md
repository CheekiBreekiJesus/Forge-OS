# Inventory And Product Management Architecture

ForgeOS treats commercial products and physical inventory items as separate concepts.

## Existing Entities Reused

- `Product` in `src/domain/product-types.ts` remains the current commercial catalog record used by Outreach, quotations and the existing product CRUD page.
- `InventoryItem` and `StockMovement` in `src/domain/operations-types.ts` remain the existing lightweight local CRUD model.
- Dexie local persistence remains the MVP storage mechanism until Supabase runtime persistence is wired.

## New Milestone 1 Foundation

The Milestone 1 domain types live in `src/domain/inventory-product-types.ts`.

The deterministic business rules live in `src/features/inventory-product/ledger.ts`.

This layer introduces:

- canonical inventory item master records;
- product master records and variants;
- packaging configurations and unit conversions;
- warehouses, locations, lots and stock conditions;
- immutable inventory transactions and ledger entries;
- rebuildable stock-balance projections;
- reservations and stock-count adjustment boundaries;
- barcode registry and resolver;
- label template, ZPL rendering and mock print history;
- staged import row validation;
- preview permission policy.

## Replacement And Migration Direction

Current `Product` and `InventoryItem` records are not deleted or rewritten in this milestone. They are treated as early MVP records that can be mapped into the canonical model later.

Future migration should add explicit adapters:

- existing product SKU to `ProductMaster.productCode`;
- existing inventory SKU to `InventoryItemMaster.internalReference`;
- existing `StockMovement` rows to opening-balance ledger transactions if production data ever exists locally;
- existing product customizer data to `ProductVariant` and `PackagingConfiguration`.

## Tenant Boundary

All new domain records include `tenantId`. Local UI remains preview-only and must not be presented as production tenant security. Production enforcement still requires backend authentication, authorization and row-level tenant checks.

## Persistence Status (Milestone 1 checkpoint)

| Data | Storage |
|---|---|
| Legacy `Product` / `InventoryItem` CRUD | Dexie (existing repositories) |
| Canonical `inventory-product-types` entities | In-memory demo state only (`createInventoryProductDemoState`) |
| Workspace ledger transactions | React session state; not in backup/restore |
| Import CSV templates | Git-tracked documentation under `docs/data-templates/` |

Next milestone step: versioned Dexie repositories for ledger entries and masters, with backup/restore tests.

