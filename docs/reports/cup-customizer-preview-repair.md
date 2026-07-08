# Cup Customizer Preview Repair — Implementation Report

Date: 2026-07-07

## 1. Summary of the original problem

The Cup Customizer preview showed a generic white cup silhouette with artwork positioned incorrectly. Product catalog images pointed at missing `/demo/products/*.svg` files, so the live preview often fell back to an empty shell while saved “mockup” assets used a separate procedural SVG that did not include the uploaded logo or local cup templates.

There was **no AI image-generation pipeline** in this feature; the broken experience came from missing assets, disconnected preview layers, and legacy configuration options (wrap/front/back, free-text sizes, duplicated material labels).

## 2. Root cause

| Issue | Cause |
|-------|--------|
| Generic white cup | `CupPreview` relied on product `imageUrl` paths with no files under `public/` |
| Logo misplaced | Artwork overlay used fixed CSS percentages unrelated to cup template or print band |
| Misleading “mockup” | `buildMockupAssetBlob()` drew its own cup shape and ignored uploaded artwork |
| Confusing options | Hardcoded `PP` / `Paper` / `Reusable` materials; free-text cup size/type; `wrap` / `front` / `back` print areas |
| Stale exports | No preview staleness indicator when configuration changed after generation |

## 3. Files modified

| Path | Change |
|------|--------|
| `packages/cup-customizer/config/cup-catalog.ts` | **New** — cup types, sizes, normalization |
| `packages/cup-customizer/config/print-area.ts` | **New** — `deg_180` / `deg_360` + legacy mapping |
| `packages/cup-customizer/config/background-assets.ts` | **New** — public URL resolver |
| `packages/cup-customizer/config/*.test.ts` | **New** — unit tests |
| `packages/cup-customizer/rendering/cup-preview.tsx` | Rewritten layered preview |
| `packages/cup-customizer/rendering/preview-export.ts` | **New** — deterministic SVG export |
| `packages/cup-customizer/rendering/ink-coverage.ts` | **New** — approximate ink estimate |
| `packages/cup-customizer/rendering/preview-export.test.ts` | **New** |
| `packages/cup-customizer/index.ts` | Expanded exports |
| `src/components/cup-customizer-shell.tsx` | New dropdowns, preview flow, export |
| `src/i18n/dictionaries.ts` | Updated customizer types |
| `src/i18n/locales/en.ts` | pt/en labels |
| `src/i18n/locales/pt-PT.ts` | pt-PT labels |
| `src/persistence/customizer-integration.test.ts` | `deg_360` print area |
| `public/assets/cup-customizer/backgrounds/**` | **New** templates + README |

## 4. Architecture — local background assets

```
Browser preview
  └─ CupPreview
       ├─ resolveCupBackgroundAssets(cupType, cupSize)
       ├─ HEAD-fetch candidate URLs (svg → png → webp → jpg)
       ├─ fallback → /assets/cup-customizer/backgrounds/fallback/default.svg
       ├─ printable band clip (width from 180°/360°)
       └─ artwork layer (scale, offsets, rotation)

Save / quotation export
  └─ buildPreviewExportBlob()
       └─ SVG with background + clipped artwork + metadata
       └─ stored in IndexedDB LocalAsset → Quote.mockupAssetId
```

Configuration is centralized in `packages/cup-customizer/config/` and consumed by both the shell and tests.

## 5. Asset directory (add backgrounds here)

```
public/assets/cup-customizer/backgrounds/
```

> Note: This repo uses Next.js root `public/`, not `apps/web/public/`.

## 6. Filename and folder conventions

```
public/assets/cup-customizer/backgrounds/<cup-type>/<size-slug>/default.<ext>
```

- Cup type folders: `reusable-pp`, `paper`
- Size slugs: `250ml`, `330ml`, `430ml`, `500ml`
- Default variant: `default.svg` (or `.png`, `.webp`, `.jpg`)
- Fallback: `fallback/default.svg`

See `public/assets/cup-customizer/backgrounds/README.md` for full instructions.

## 7. Reusable PP sizes implemented

Dropdown options (internal config `REUSABLE_PP_SIZES_ML`):

- 250 ml
- 330 ml
- 430 ml
- 500 ml

Internal cup type value: `reusable_pp`  
Material value (auto-derived): `polypropylene`

## 8. Paper-cup sizes — source

| Size | Source |
|------|--------|
| **250 ml** | `src/demo/seed.ts` (`JHG-CUP-PAPER-250`), `supabase/seed.sql` |

No other paper-cup SKUs exist in the catalog. Additional paper sizes require product-catalog confirmation before adding to `PAPER_CUP_SIZES_ML`.

**Conflict note:** Seed includes `reusable-cups` at **400 ml** (`JHG-CUP-REUSE-400`). That category maps to `reusable_pp` in the customizer; 400 ml is not in the required dropdown and normalizes to **330 ml** (default clamp). A dedicated 400 ml option would need product-owner confirmation.

## 9. Print-area value mappings

| Legacy value | Normalized |
|--------------|------------|
| `front`, `back`, `frente`, `verso`, `half`, `half_wrap` | `deg_180` |
| `wrap`, `full`, `full_wrap`, `full-wrap`, `volta-completa` | `deg_360` |

Display labels:

| Internal | English | pt-PT |
|----------|---------|-------|
| `deg_180` | 180° | 180º |
| `deg_360` | 360° | 360º |

## 10. Material / type normalization

| UI label (pt-PT) | UI label (en) | `cupType` | `material` |
|------------------|---------------|-----------|------------|
| Copo reutilizável em PP | Reusable PP cup | `reusable_pp` | `polypropylene` |
| Copo de papel | Paper cup | `paper` | `paper` |

Removed separate “PP” / “Reusable” / “Paper” material dropdown. Material is read-only and derived from cup type.

Product categories map as:

- `personalized-cups`, `reusable-cups` → `reusable_pp`
- `paper-cups` → `paper`

## 11. Ink-coverage estimation

**Implemented** (client-side, approximate):

- Module: `packages/cup-customizer/rendering/ink-coverage.ts`
- Samples artwork alpha in an off-screen canvas within the printable band width
- Shown as `~N%` with tooltip explaining it is not production ink consumption

## 12. Tests executed and results

| Command | Result |
|---------|--------|
| `npm run typecheck` | **Pass** |
| `npm run lint` | **Pass** (0 errors; pre-existing warnings in unrelated files) |
| `npx vitest run packages/cup-customizer` | **17/17 pass** |
| `npm test` (full `src` suite) | **282/282 pass** (3 skipped) |

Playwright E2E (`e2e/cup-customizer.spec.ts`) was **not run** in this session (requires `npm run test:e2e` with Playwright prep on port 3012).

### New unit coverage

- Reusable PP sizes including 430 ml
- Verified paper size 250 ml
- Print-area normalization (front/back → 180°, wrap → 360°)
- Background path generation and sanitization
- Fallback URL when asset missing
- Preview export embeds transforms and wider band for 360°

## 13. Remaining limitations

- Placeholder cup SVGs are neutral vectors, not photographic mockups.
- 430 ml reusable PP is in the customizer config but has no matching product SKU in `seed.ts` yet.
- Only **250 ml** paper cup is catalog-verified.
- Ink coverage ignores rotation/clipping precision for complex SVG artwork.
- Pricing still resolves primarily via the 330 ml PP quotation rule (`personalizedCupQuotationRules[0]`).
- Outreach email cup-mockup blocks remain placeholders (unchanged).

## 14. Manual validation steps

1. Open `/pt-PT/quotations/customizer`.
2. Select **Copo reutilizável em PP**.
3. Select **250 ml** — background should load from `/assets/cup-customizer/backgrounds/reusable-pp/250ml/default.svg`.
4. Upload a transparent PNG logo.
5. Select **180º**.
6. Adjust scale, horizontal offset, vertical offset, rotation — artwork moves inside dashed print band.
7. Click **Gerar pré-visualização** — stale warning clears.
8. Switch to **360º** — print band widens.
9. Switch to **330 ml** — background path updates.
10. Switch to **Copo de papel** — only **250 ml** size available.
11. Rename/delete a background file — fallback cup appears with missing-asset message (dev console warning).

## 15. Database migration / configuration

**No database migration required.** IndexedDB simulations store `configuration.printArea` and `cupType` as strings; legacy values are normalized on load via `normalizeConfiguration()`.

**Optional follow-up:** Add product rows for 430 ml PP and additional paper sizes when confirmed; drop SVG templates into the matching `public/assets/cup-customizer/backgrounds/` folders.

---

## Acceptance criteria checklist

| Criterion | Status |
|-----------|--------|
| No broken generic AI mockup | ✅ Deterministic local preview |
| Artwork on cup template | ✅ Layered preview + export |
| Documented background directory | ✅ `public/assets/cup-customizer/backgrounds/` |
| Safe fallback for missing assets | ✅ |
| Print area 180° / 360° only | ✅ |
| Legacy front/back compatible | ✅ |
| Reusable PP as single cup type | ✅ |
| PP sizes 250/330/430/500 dropdown | ✅ |
| Paper sizes from verified refs | ✅ (250 ml) |
| Cup size is dropdown | ✅ |
| pt-PT and en translations | ✅ |
| Quotation integration preserved | ✅ |
| Tests pass | ✅ (unit + typecheck + lint) |
| Implementation report | ✅ This document |
