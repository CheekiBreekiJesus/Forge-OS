# Product Data Staging — Implementation Plan

## Objective

Build a reviewed, tenant-scoped product import workflow for JH Gomes source files (XLS, XLSX, CSV) that stages data locally, surfaces duplicates and conflicts, and commits only safe fields to the existing **legacy Product Master** (Dexie `products` table). Inventory quantities and ledger entries must never change.

## Existing architecture (reused)

| Layer | Location | Role in import |
| --- | --- | --- |
| Legacy `Product` | `src/domain/product-types.ts` | **Commit target** — SKU, name, category, basePrice, active |
| Canonical types | `src/domain/inventory-product-types.ts` | Reference for field names, barcodes, packaging; **not persisted** yet |
| Dexie v4 | `src/persistence/db.ts` | Extended to v5 with import staging tables |
| Product repository | `src/persistence/indexeddb/product-repositories.ts` | Create/update on commit |
| Inventory ledger | `src/features/inventory-product/ledger.ts` | **Not invoked** during import |
| Backup | `src/features/backup/service.ts` | Extended to v3 with import tables |

## Persistent vs preview-only

| Entity | Persisted | Notes |
| --- | --- | --- |
| `Product` (legacy) | Yes | Commit boundary for name, SKU, category, basePrice, active |
| `ProductImportBatch` | Yes | Batch metadata and counts |
| `ProductImportRow` | Yes | Staged rows with original + normalized values |
| `ProductMappingProfile` | Yes | Reusable column mappings per source |
| `ProductSourceReference` | Yes | Provenance link product ↔ source |
| `ProductMaster`, variants, barcodes | No | Canonical preview only |
| Packaging hierarchies, price history | Staged only | Stored in row `normalizedValues` / conflicts |

## Safe integration point

1. **Parse** file in browser (SheetJS `xlsx`, no macros/formulas executed).
2. **Map** columns → canonical field keys via saved profiles.
3. **Normalize** deterministically (`src/features/product-import/normalize.ts`).
4. **Analyze** duplicates/conflicts against existing products + prior staged rows.
5. **Stage** approved rows to Dexie (`productImportRows`).
6. **Commit** selected rows via `ProductRepository.create` / `update` — never touch `inventoryItems` or `stockMovements`.

## Fields commitable now

| Canonical field | Product field | Rule |
| --- | --- | --- |
| `internalReference` | `sku` | Required; normalized trim + upper |
| `description` | `name` | Required |
| `category` | `category` | Mapped to `ProductCategory` enum |
| `salePrice` | `basePrice` | Only if Product has no price or user approves overwrite |
| `status` | `active` | active/inactive mapping |
| Source metadata | `ProductSourceReference` | Separate table |

## Fields that must remain staged

- Multiple barcodes / EAN variants
- Supplier and customer references (beyond first primary)
- Packaging hierarchy (units per carton, pallet qty)
- Purchase cost, margin, markup when not in Product model
- Customer-specific pricing sheets
- VAT rate, price date, currency (partial — stored in staged JSON)
- Product classification flags (stored on import row until variant model exists)
- Stock quantities from source files (**explicitly ignored**)

## Migration strategy

- Dexie schema v4 → v5 adds four tables without altering existing product rows.
- `ProductSourceReference` links committed products to import batches.
- Future canonical `ProductMaster` migration can read staged rows + source references.
- Legacy products are never deleted or rewritten by import.

## Test strategy

| Layer | Scope |
| --- | --- |
| Unit | Normalization, parsing, duplicate/conflict, precedence, fingerprint, EAN |
| Integration | Synthetic curated + invoice fixtures → stage → commit → reload |
| E2E | Playwright wizard flow with synthetic fixtures only |
| Acceptance | Real files locally with isolated DB name; aggregates in `qa/products/` |

## Privacy

- Private files under `JH Gomes/Databases/Products` never committed.
- Profiling output in gitignored `scripts/data-preparation/reports/`.
- QA reports contain aggregates and sanitized header names only.

## Out of scope (this milestone)

- Inventory movements, opening balances, stock quantity writes
- Production orders, warehouse transfers
- Destructive import rollback when products are referenced
- Supabase / remote persistence
