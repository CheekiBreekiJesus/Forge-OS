# Cup Customizer

ForgeOS module for JH Gomes personalized cup configuration, preview, and estimate quotations.

## Architecture

```
src/app/[locale]/quotations/customizer/page.tsx   # Primary route
src/app/[locale]/products/cup-customizer/page.tsx # Products alias (same shell)
src/components/cup-customizer-shell.tsx         # UI orchestration
packages/cup-customizer/                        # Pricing + preview package
src/features/cup-customizer/                      # Upload, workflow, mockup logic
src/persistence/indexeddb/customizer-repositories.ts
```

Import alias: `@cup-customizer` → `packages/cup-customizer`.

## User workflow

1. Open customizer from Quotations, Products, Customers, or Quick Create
2. Select cup product and quantity
3. Configure printing (colours, print area)
4. Upload artwork and adjust position/scale/rotation
5. Review deterministic preview (offline, immediate)
6. Optionally generate realistic mockup (explicit action, gated)
7. Save simulation (IndexedDB, tenant-scoped)
8. Create or update draft quotation (idempotent)

## Supported products

Demo catalog cups with SKUs containing `CUP` or `personalizationAvailable`:

- 250 ml, 330 ml, 500 ml PP cups (synthetic demo assets under `public/demo/products/`)

## Persistence

- Table: `customizerSimulations`
- Artwork: `LocalAsset` blobs (private, local)
- Mockups: SVG assets in `LocalAsset` (`mockupAssetId`, optional `mockupGeneration.realisticMockupAssetId`)

## Data privacy

- Never commit customer artwork
- No automatic external upload
- Outbound email must not embed blob URLs

## Related docs

- [Specification](./cup-customizer-specification.md)
- [Artwork](./cup-customizer-artwork.md)
- [Mockups](./cup-customizer-mockups.md)
- [Quotations](./cup-customizer-quotations.md)
- [Troubleshooting](./cup-customizer-troubleshooting.md)
- [Recovery plan](./cup-customizer-recovery-plan.md)
