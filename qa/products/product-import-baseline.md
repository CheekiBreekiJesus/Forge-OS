# Product Import — Architecture Baseline

**Branch:** `feat/jhgomes-product-data-staging`  
**Base:** `origin/feat/inventory-product-foundation`  
**Starting commit:** `f02471c` (docs(qa): record inventory checkpoint and outreach readiness)

## Preflight (Phase 1)

| Check | Result |
| --- | --- |
| Worktree | `Forge-OS-product-import` |
| Branch | `feat/jhgomes-product-data-staging` |
| Working tree | Clean |
| Private files tracked | None |
| Spreadsheet deps before work | None (`xlsx` added for this milestone) |

## Legacy Product entity (`src/domain/product-types.ts`)

Persisted in Dexie `products`. Key fields: `sku`, `name`, `category`, `basePrice`, cup/personalization metadata, outreach email fields, `active`, archive metadata.

## Canonical inventory/product types (`src/domain/inventory-product-types.ts`)

Rich model: `ProductMaster`, `ProductVariant`, `BarcodeRecord`, `PackagingConfiguration`, `ExternalReference`, `ImportBatch` / `ImportStagedRow` (demo-only today). Used as naming reference; product import uses dedicated staging types to avoid conflating with inventory opening-balance imports.

## Dexie schema (before)

Version 4. Tables: meta, CRM, quotes, products, inventoryItems, stockMovements, machines, customizerSimulations, profiles.

**After this milestone:** Version 5 adds `productImportBatches`, `productImportRows`, `productMappingProfiles`, `productSourceReferences`.

## UI entry points

| Route | Component | Purpose |
| --- | --- | --- |
| `/{locale}/products` | `ProductCatalogShell` | Legacy product CRUD |
| `/{locale}/products/import` | `ProductImportShell` | **New** staging workflow |
| `/{locale}/products/{section}` | `InventoryProductWorkspaceShell` | Canonical preview (unchanged) |

## Import staging types (new)

See `src/domain/product-import-types.ts`:

- `ProductImportBatch` — batch metadata and row counts
- `ProductImportRow` — per-row original/normalized values, conflicts, actions
- `ProductMappingProfile` — reusable column mappings
- `ProductSourceReference` — committed product provenance

## Barcode / reference / packaging / UOM

Canonical definitions in `inventory-product-types.ts`. Normalization helpers in `src/features/product-import/normalize.ts`. Full barcode/packaging persistence deferred; values kept in staged row JSON.

## Quotation / customizer usage

Quotes and customizer read legacy `Product` by `productId` / SKU. Committed imports appear in product picker after reload. No changes to quotation or customizer code required.

## Backup / reset

| Action | Product import data |
| --- | --- |
| JSON backup v3 | Includes import batches, rows, profiles, source references |
| Restore | Restores import tables with products |
| Reset Demo Data | Preserves user imports and committed products |
| Clear All Local Data | Wipes everything (strong confirmation) |

## Existing tests

- `src/features/inventory-product/ledger.test.ts` — canonical import row validation (unchanged)
- `src/persistence/*.test.ts` — product CRUD, demo reset
- New: `src/features/product-import/*.test.ts`, integration + Playwright

## Commit boundary summary

**Safe:** SKU, name, category, basePrice (with conflict review), active, source reference records.  
**Staged only:** barcodes, multi-reference, packaging, cost/margin history, classifications until canonical model persists them.  
**Never written:** inventory quantities, stock movements, ledger entries, production orders.
