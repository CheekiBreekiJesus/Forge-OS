# Product Master

ForgeOS separates commercial products from physical stock.

## Product Master

A product represents something quoted, ordered or sold. It may point to:

- a directly sellable inventory item;
- a product variant;
- a future production-route output.

## Inventory Item Master

An inventory item represents anything physically stocked, consumed or produced. It carries the stock-tracking, lot-tracking and expiry policies.

## Product Variant

Variants represent standard, customer-specific, printed, repacked, relabelled, flow-packed or thermoshrunk sale configurations. They link to output items, packaging, label templates, customer-specific metadata and selling units.

## External References

Supplier, customer, legacy, accounting, catalogue and other references are modeled separately so reference history is not lost when products or variants change.

## Persistence Status (Milestone 1)

- Commercial catalog continues to use `src/domain/product-types.ts` with Dexie repositories.
- Canonical `ProductMaster`, `ProductVariant`, and `InventoryItemMaster` types exist for future migration; the nested product workspace displays synthetic demo data only.
- Adapters from legacy SKU records to canonical masters are documented but not implemented.

