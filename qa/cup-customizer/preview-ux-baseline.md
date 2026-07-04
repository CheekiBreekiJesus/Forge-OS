# Cup Customizer Preview UX — Baseline (302c15a)

**Worktree:** `Forge-OS-cup-customizer-preview-ux`  
**Branch:** `fix/cup-customizer-preview-layout`  
**Date:** 2026-07-04

## Baseline validation

| Check | Result |
|-------|--------|
| `npm run lint` | Pass (11 warnings, 0 errors) |
| `npm run typecheck` | Pass |
| `npm test` | 297 passed |
| `npm run build` | Pending post-fix |

## Upload event path

1. Hidden `<input type="file">` in `cup-customizer-shell.tsx` → `onChange` → `uploadArtwork(file)`
2. `validateCustomizerArtwork` → `validateLocalAsset` (2 MB, MIME whitelist)
3. `state.repos.localAssets.create` with `assetType: "other"`
4. `setArtworkAssetId`, `setArtworkPreviewUrl(URL.createObjectURL(file))`
5. `CupPreview` receives `artworkDataUrl={artworkPreviewUrl}`

**Silent failure:** `uploadArtwork` returns early when `state.status !== "ready"` with no UI feedback.

## LocalAsset creation path

`profile-repositories.ts` → `createLocalAssetRepository.create` → IndexedDB `localAssets` table.

## Preview image-source path

- Artwork: blob object URL or data URL → `CupPreview` `<img style={absolute % positioning}>`
- Cup base: `resolveProductPreviewUrl(product)` → often `/demo/products/*.svg` or null → silhouette fallback

## Persistence path

Save: `customizerSimulations.create/update` with `artworkAssetId`, `mockupAssetId`, `mockupGeneration`.  
Reload: `loadSimulation` → `localAssets.getById` → `URL.createObjectURL(asset.blob)`.

## Object-URL lifecycle

- Revoke on `artworkPreviewUrl` change (effect cleanup in shell)
- **Gap:** reload path does not revoke previous URL before creating new one
- **Gap:** no centralized hook; mockup URLs never created for display

## Deterministic mockup generation path

`handleGeneratePhotorealisticMockup` → `generateDeterministicPhotorealisticMockup` → `buildPhotorealisticMockupBlob` (SVG without embedded artwork image) → `localAssets.create` → `mockupGeneration.realisticMockupAssetId` set.

## Mockup display path

**Missing.** Asset ID persisted but no `mockupPreviewUrl` state and no `<img>` for realistic mockup. User sees feedback text only.

## Layout dimensions

- Grid: `xl:grid-cols-[1.4fr_1fr]` (≥1280px)
- `CupPreview`: `max-w-xs` (~320px), `aspect-[3/4]`
- Simulations list always visible on desktop (large vertical block)
- Page header + subnav + workflow nav + stacked sections → requires ~67% zoom on 17" laptop

## Viewport behavior

- Desktop (`≥1280px`): all workflow sections visible simultaneously
- Mobile/tablet: one step at a time; preview isolated on "preview" step
- Artwork upload separated from preview panel on desktop

## Root-cause hypotheses

| Defect | Root cause | Confidence |
|--------|------------|------------|
| Upload appears to do nothing | Persistence not ready silent return; weak upload feedback | High |
| Artwork not on cup | `CupPreview` uses `%` absolute positioning on small frame; artwork may be subtle; no integrated canvas drop zone | Medium |
| Preview blank | Missing always-visible cup silhouette canvas; product image optional | High |
| Mockup button no result | **No UI loads/displays `realisticMockupAssetId`** | **Confirmed** |
| No loading/error states | Mockup generating state exists but mockup image never shown; upload lacks validating/invalid states | High |
| 67% zoom required | Vertical stacking, permanent simulations block, oversized spacing | High |
| Logo actions unclear | Single "use company logo" button; no customer stored logo; search/generate not separated | Confirmed |
