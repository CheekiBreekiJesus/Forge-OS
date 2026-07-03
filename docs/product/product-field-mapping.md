# Product Field Mapping

Canonical field keys map source columns to normalized import values. Aliases include Portuguese and English header variants.

## Identity

| Key | Example source headers |
| --- | --- |
| `internalReference` | Referência, reference, SKU |
| `description` | Descrição, name |
| `category` | Família, category |
| `status` | Estado, active |

## Commercial (staged + partial commit)

| Key | Commit to Product Master |
| --- | --- |
| `salePrice` | `basePrice` (with conflict review) |
| `purchaseCost` | Staged only |
| `vatRate` | Staged only |

## Logistics (staged only)

`baseUnit`, `saleUnit`, `unitsPerPackage`, `packagesPerCarton`, `weight`, `dimensions`

## Traceability (staged only)

`barcode`, `ean`, `supplierReference`, `customerReference`

Mapping profiles are persisted in Dexie `productMappingProfiles` per tenant.
