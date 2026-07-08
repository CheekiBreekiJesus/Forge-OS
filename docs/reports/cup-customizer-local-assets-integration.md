# Cup Customizer Local Assets Integration

Date: 2026-07-08

## 1. Summary

Integrated reusable PP cup PNG assets and day/night scene backgrounds into the ForgeOS Cup Customizer layered preview. The preview now renders:

1. Scene background (`day` or `night`)
2. Size-specific reusable PP cup image
3. Customer artwork overlay

Paper cups remain in domain configuration but are hidden from the current customizer UI via `CUP_CUSTOMIZER_SHOW_PAPER_CUPS = false`.

## 2. Source asset paths

| Asset | Source |
|-------|--------|
| 250 ml cup | `C:\Users\J35U5\Desktop\JH Gomes\cup-customizer\reuse-PP-cups\250ml.png` |
| 330 ml cup | `C:\Users\J35U5\Desktop\JH Gomes\cup-customizer\reuse-PP-cups\330ml.png` |
| 430 ml cup | `C:\Users\J35U5\Desktop\JH Gomes\cup-customizer\reuse-PP-cups\430ml.png` |
| 500 ml cup | `C:\Users\J35U5\Desktop\JH Gomes\cup-customizer\reuse-PP-cups\500ml.png` |
| Day scene | `C:\Users\J35U5\Desktop\JH Gomes\cup-customizer\backgrounds\day.png` |
| Night scene | `C:\Users\J35U5\Desktop\JH Gomes\cup-customizer\backgrounds\night.png` |

Original source files were copied only; nothing was moved or deleted from the external folders.

## 3. Destination asset paths

```
public/assets/cup-customizer/cups/reusable-pp/250ml.png
public/assets/cup-customizer/cups/reusable-pp/330ml.png
public/assets/cup-customizer/cups/reusable-pp/430ml.png
public/assets/cup-customizer/cups/reusable-pp/500ml.png
public/assets/cup-customizer/backgrounds/day.png
public/assets/cup-customizer/backgrounds/night.png
```

Browser URLs:

- `/assets/cup-customizer/cups/reusable-pp/{250ml,330ml,430ml,500ml}.png`
- `/assets/cup-customizer/backgrounds/day.png`
- `/assets/cup-customizer/backgrounds/night.png`

## 4. Asset dimensions and alpha-channel validation

Validation script: `node scripts/cup-customizer/validate-assets.mjs`

| Asset | Dimensions | Format | Real transparency | Notes |
|-------|------------|--------|-------------------|-------|
| 250 ml cup | 1254 × 1254 | PNG RGB | **No** | Opaque light background baked into corners (`cornerAlpha: 255`) |
| 330 ml cup | 1254 × 1254 | PNG RGB | **No** | Opaque light background baked into corners (`cornerAlpha: 255`) |
| 430 ml cup | 1024 × 1024 | PNG RGBA | **Yes** | ~75.7% fully transparent pixels |
| 500 ml cup | 1024 × 1024 | PNG RGBA | **Yes** | ~70.6% fully transparent pixels |
| Day scene | 1254 × 1254 | PNG RGB | N/A (opaque scene) | Expected |
| Night scene | 1254 × 1254 | PNG RGB | N/A (opaque scene) | Expected |

All files decoded successfully. Aspect ratio is 1:1 for every asset.

## 5. Assets with baked backgrounds

**Asset blockers:**

- `250ml.png` — no alpha channel; light grey/white background is baked into the image pixels.
- `330ml.png` — no alpha channel; light grey/white background is baked into the image pixels.

No deterministic correction was applied. Safe alpha extraction without affecting frosted-cup pixels was not possible without re-exporting the source artwork.

## 6. Cup-size asset mapping

| Internal size | Label | Asset path |
|---------------|-------|------------|
| `250` | 250 ml | `/assets/cup-customizer/cups/reusable-pp/250ml.png` |
| `330` | 330 ml | `/assets/cup-customizer/cups/reusable-pp/330ml.png` |
| `430` | 430 ml | `/assets/cup-customizer/cups/reusable-pp/430ml.png` |
| `500` | 500 ml | `/assets/cup-customizer/cups/reusable-pp/500ml.png` |

Configuration source: `packages/cup-customizer/config/visual-assets.ts`

## 7. Day/night background mapping

| Internal value | pt-PT | English | Asset path |
|----------------|-------|---------|------------|
| `day` | Dia | Day | `/assets/cup-customizer/backgrounds/day.png` |
| `night` | Noite | Night | `/assets/cup-customizer/backgrounds/night.png` |

Default: `day`

## 8. Layer architecture

```
CupPreview (square frame, aspect-square)
  z-0  scene background     object-cover, centred
  z-10 reusable PP cup image object-contain, bottom-seated per size
  z-20 print-band guide       dashed overlay
  z-30 artwork clip + logo   scale / offset / rotation preserved
```

Export SVG (`buildPreviewExportSvg`) follows the same order: scene → cup → clipped artwork.

## 9. Cup placement configuration

Per-size placement lives in `CUP_PLACEMENT_BY_SIZE` inside `visual-assets.ts`. Relative cup widths differ by size (56% → 68%) so visible size differences are preserved instead of normalizing all cups to one height.

## 10. Artwork clipping approach

Artwork is clipped to a size-specific printable region derived from `CUP_PLACEMENT_BY_SIZE[size].artworkRegion` and multiplied by the 180°/360° band width from `printableWidthFraction()`. Existing transform controls (`artworkScale`, offsets, rotation, position) are unchanged.

## 11. How paper cups are hidden

`CUP_CUSTOMIZER_SHOW_PAPER_CUPS = false` in `visual-assets.ts` filters the cup-type dropdown through `visibleCupTypesInCustomizer()`. Domain constants (`PAPER_CUP_SIZES_ML`, paper product records, legacy SVG paths) are untouched.

## 12. How paper cups can later be re-enabled

Set `CUP_CUSTOMIZER_SHOW_PAPER_CUPS = true` in `packages/cup-customizer/config/visual-assets.ts`. The UI will again expose the paper cup type and existing paper domain sizes.

## 13. Files modified

| Path | Change |
|------|--------|
| `public/assets/cup-customizer/cups/reusable-pp/*.png` | **Added** cup assets |
| `public/assets/cup-customizer/backgrounds/day.png` | **Added** |
| `public/assets/cup-customizer/backgrounds/night.png` | **Added** |
| `packages/cup-customizer/config/visual-assets.ts` | **New** central asset config |
| `packages/cup-customizer/config/visual-assets.test.ts` | **New** |
| `packages/cup-customizer/rendering/cup-preview.tsx` | Layered scene/cup/artwork preview |
| `packages/cup-customizer/rendering/cup-preview-layer.test.ts` | **New** |
| `packages/cup-customizer/rendering/preview-export.ts` | Square layered SVG export |
| `packages/cup-customizer/rendering/preview-export.test.ts` | Updated |
| `packages/cup-customizer/index.ts` | Export visual asset helpers |
| `src/components/cup-customizer-shell.tsx` | Scene selector, paper hidden, export wiring |
| `src/domain/customizer-types.ts` | `previewScene` field |
| `src/i18n/dictionaries.ts` | Scene label types |
| `src/i18n/locales/en.ts` | English labels |
| `src/i18n/locales/pt-PT.ts` | pt-PT labels |
| `e2e/cup-customizer.spec.ts` | Scene preview smoke test |
| `scripts/cup-customizer/validate-assets.mjs` | **New** validation script |

## 14. Tests executed

| Command | Result |
|---------|--------|
| `node scripts/cup-customizer/validate-assets.mjs` | **Ran** — exit code 1 due to 250 ml / 330 ml baked backgrounds (expected blocker report) |
| `npm run typecheck` | **Pass** |
| `npm run lint` | **Pass** (0 errors; pre-existing warnings elsewhere) |
| `npx vitest run packages/cup-customizer` | **28/28 pass** |
| `npm test` | **282/282 pass** (3 skipped) |
| Asset HEAD requests on `http://localhost:3000` | **200** for cup and day scene |
| `npx playwright test e2e/cup-customizer.spec.ts --grep "scene preview"` | **Could not run** — Playwright webServer failed because another `next dev` instance is already bound to the project directory |

## 15. Real test results

- Unit and integration tests for catalog, visual assets, preview export, and layer ordering all passed.
- Local dev server already running on port 3000 successfully served copied PNG assets with HTTP 200.
- Playwright smoke test was added but not executed in this session due to the port/process conflict described above.

## 16. Manual validation results

Automated browser QA for the full 20-step manual checklist was **not completed** in this session because Playwright could not start its dedicated test server. Recommended manual path:

1. `npm run dev`
2. Open `/pt-PT/quotations/customizer`
3. Confirm only reusable PP cup type, four sizes, Day/Night selector, layered preview, artwork transforms, and quotation save flow.

## 17. Remaining limitations

- `250ml.png` and `330ml.png` need re-export with real alpha transparency for clean scene compositing.
- Cup canvases use two different square sizes (1254 px and 1024 px); placement offsets compensate in CSS but do not alter source files.
- Legacy per-size SVG backgrounds under `public/assets/cup-customizer/backgrounds/reusable-pp/` remain for backward compatibility but are no longer used by the live layered preview.
- `previewScene` is persisted on simulations but excluded from pricing signatures and stale-preview detection.

## 18. Asset corrections still required

Re-export these source files with transparent backgrounds, then replace the copies under `public/assets/cup-customizer/cups/reusable-pp/`:

- `250ml.png`
- `330ml.png`

Until then, those two sizes will show a baked light halo over the day/night scene.
