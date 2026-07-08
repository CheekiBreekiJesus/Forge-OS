# Cup Customizer Diagnostic

Date: 2026-07-01

## Scope

Repair and complete the existing ForgeOS Cup Customizer path without replacing it with a separate implementation.

## Confirmed implementation

- Route: `src/app/[locale]/quotations/customizer/page.tsx`
- Shell: `src/components/cup-customizer-shell.tsx`
- Shared package: `packages/cup-customizer/`
- Persistence: `src/persistence/indexeddb/customizer-repositories.ts`
- Domain types: `src/domain/customizer-types.ts`
- Quotation linkage: `Quote.simulationId`, `Quote.mockupAssetId`, `Quote.isEstimate`
- LeadOps mockup entry point: `src/components/leadops-detail-workspace.tsx`

## Findings

- The repository already has a reusable customizer package and simulation persistence. Rebuilding from scratch is unnecessary.
- Product demo records can point to relative image paths that are not present under `public/`, so the preview needs a broken-image fallback.
- Saved simulations had `mockupAssetId` in the domain but the UI did not generate or persist a mockup asset during save/quote conversion.
- The preview supported only coarse left/center/right positioning; scale, offset, and rotation were not persisted.
- Existing smoke tests covered route presence and save feedback but not the end-to-end save-to-quotation path.

## Repair direction

- Keep the existing `packages/cup-customizer` adapter/pricing/rendering boundary.
- Persist artwork transform fields on `CustomizerConfiguration`.
- Generate a tenant-local SVG mockup asset on save/quote conversion and retain the reference on simulations and quotes.
- Keep uploaded artwork in `LocalAsset`; never expose local paths or blob URLs outside the app.
- Add a visible fallback state when product image assets cannot be loaded.

## Remaining limitations

- The generated mockup is an operational estimate artifact, not a production print proof.
- There is no confirmed external hosted JH Gomes customizer API in the repository.
- Product image seed assets should be supplied later if visual product-specific previews are required.
