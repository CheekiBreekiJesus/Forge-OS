# Cup Customizer Preview UX — Summary

**Branch:** `fix/cup-customizer-preview-layout`  
**Base:** `302c15a`

## Root causes fixed

1. **Upload appeared silent** — persistence-not-ready returned without feedback; pipeline now surfaces validating/loaded/invalid states.
2. **Mockup not visible** — `realisticMockupAssetId` was persisted but never loaded into a preview URL; preview panel now renders `cup-mockup-image`.
3. **Blank preview** — replaced minimal `CupPreview` card with `CupDesignCanvas` (SVG cup silhouette + semi-transparent upload overlay).
4. **Layout** — compact `56/44` grid, sticky preview column, collapsible simulations drawer, desktop breakpoint at `1024px`.

## New modules

- `packages/cup-customizer/rendering/cup-design-canvas.tsx`
- `src/features/cup-customizer/artwork-pipeline.ts`
- `src/features/cup-customizer/customer-logos.ts`
- `src/features/cup-customizer/logo-providers.ts`
- `src/features/cup-customizer/marketing-assets.ts`
- `src/components/cup-customizer-preview-panel.tsx`

## Validation

| Command | Result |
|---------|--------|
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm test` | 310 passed |
| `npm run build` | See build log |

## Remaining limitations

- Customer logo registry uses meta-table links; no CRM UI to register logos yet (tests use registry API).
- Logo search/generation providers return `not_configured` outside test/mock env.
- Deterministic mockup is SVG-based, not photorealistic print proof.
- PNG export download not wired; marketing asset saved as local blob only.
