# Cup Customizer Integration

Date: 2026-06-30

## Discovery

No standalone external cup customizer package or hosted JH Gomes customizer API was found in the ForgeOS repository or deployment configuration. The JH Gomes website exposes a marketing `/personalizar` page for end customers, but it is not integrated as an API for ForgeOS quotation pricing.

ForgeOS therefore reuses the existing **operational pricing rules** from `src/demo/operational-seed.ts` and `src/demo/operational-workflows.ts` inside `packages/cup-customizer/`.

## Package layout

| Path | Responsibility |
|------|----------------|
| `packages/cup-customizer/pricing/engine.ts` | `estimateCupPricing`, `resolveQuotationRuleForProduct` |
| `packages/cup-customizer/rendering/cup-preview.tsx` | Local-only `CupPreview` React component |
| `packages/cup-customizer/adapters/forgeos.ts` | `createForgeOSCustomizerBridge` facade |
| `src/features/cup-customizer/` | ForgeOS feature module: configuration, pricing, mockup export, upload validation |

Import alias: `@cup-customizer` → `packages/cup-customizer/index.ts`.

## Persistence

- Domain types: `src/domain/customizer-types.ts`
- IndexedDB table: `customizerSimulations` (Dexie schema v4)
- Repository: `src/persistence/indexeddb/customizer-repositories.ts`
- Quote linkage: `Quote.simulationId`, `Quote.isEstimate`, `Quote.mockupAssetId`
- Conversion: `convertSimulationToQuote()` creates a tenant-scoped quote and marks the simulation `converted`

## UI routes

| Route | Shell |
|-------|-------|
| `/[locale]/quotations` | `quotations-shell.tsx` |
| `/[locale]/quotations/customizer` | `cup-customizer-shell.tsx` |

Sub-navigation tabs live in `quotations-subnav.tsx` under the quotations layout.

## Pricing behaviour

All customizer output is labelled **Estimate** (`isEstimate: true`). Assumptions from the quotation engine are persisted on the simulation and copied into quote notes on conversion. Manual unit price overrides are supported in the UI and passed to `estimateCupPricing`.

## Artwork and preview

- Artwork uploads use `LocalAsset` with `validateLocalAsset`
- Preview artwork uses blob/data URLs only (never embedded in outbound email HTML)
- Company logo and product image shortcuts populate the `CupPreview` overlay
- Saved simulations generate a tenant-local SVG mockup asset and store it in `CustomizerSimulation.mockupAssetId`
- Quote conversion copies `mockupAssetId` to the generated quote so LeadOps/outreach can reference an internal mockup
- Artwork transform fields are persisted on the simulation: `artworkScale`, `artworkOffsetX`, `artworkOffsetY`, and `artworkRotation`
- Product image previews resolve catalog `imageUrl`, `thumbnailUrl`, then `image`; missing local demo image files fall back to the built-in cup preview with a visible unavailable-image message

## Entry points

- Quotations header and row action “Open in customizer”
- Product catalog row action “Customize” (`?productId=`)
- Customers header and row action (`?customerId=`)
- Quick create menu and command palette (`#create`)
- Lead workspace media panel (optional mockup placeholder)

## Tests

- `src/persistence/customizer-integration.test.ts`
- `src/features/cup-customizer/configuration.test.ts`
- `src/features/cup-customizer/pricing.test.ts`
- `src/features/cup-customizer/artwork-upload.test.ts`
- `src/features/onboarding/checklist.test.ts`
- `src/features/notifications/local-notifications.test.ts`
- `e2e/cup-customizer.spec.ts`

## Current limitations

- The generated SVG mockup is a local operational reference, not a print-ready production proof.
- Real uploaded artwork remains private in IndexedDB `LocalAsset`; outbound email must not embed blob URLs or local paths.
- Demo product preview assets live under `public/demo/products/`; missing files still fall back to the built-in cup shell with a visible message.
- There is still no external JH Gomes customizer API contract in the repository.

## Future hosted integration

A future JH Gomes website customizer could replace or augment `estimateCupPricing` by implementing the same adapter types in `packages/cup-customizer/domain/types.ts` without changing ForgeOS simulation persistence.
