# Cup Customizer background assets

Place cup template / background images in this directory so the quotation Cup Customizer can render deterministic previews.

## Accepted formats

- PNG (recommended for photographic templates with transparency)
- WebP
- SVG (recommended for neutral vector placeholders)
- JPEG (opaque backgrounds only)

Prefer **transparent-background PNG or SVG** so artwork overlays blend naturally.

## Recommended dimensions

- **Width:** 480–960 px
- **Height:** 640–1280 px
- **Aspect ratio:** roughly 3:4 (portrait side view of a cup)

## Folder structure

```
public/assets/cup-customizer/backgrounds/
  fallback/
    default.svg          # used when no size-specific asset exists
  reusable-pp/
    250ml/default.svg
    330ml/default.svg
    430ml/default.svg
    500ml/default.svg
  paper/
    250ml/default.svg
```

Add new sizes by creating a folder named with the size slug (e.g. `330ml`) under the cup-type folder.

## Filename conventions

- Default variant: `default.<ext>`
- Future colour variants: `white.png`, `black.png`, `transparent.png`, etc.

Only use lowercase letters, numbers, and hyphens in folder and file names.

## How the frontend resolves an asset

1. Read cup type (`reusable_pp` or `paper`) and size (e.g. `330 ml`).
2. Map to a public URL such as `/assets/cup-customizer/backgrounds/reusable-pp/330ml/default.png`.
3. Try extensions in order: `svg`, `png`, `webp`, `jpg`, `jpeg`.
4. If none load, use `/assets/cup-customizer/backgrounds/fallback/default.svg`.

Identifiers are sanitized; user-supplied paths are never accepted.

## Fallback behaviour

Missing assets do **not** break the preview. The app shows the neutral fallback cup and, in development, logs a console warning listing the URLs that were tried.

## Adding a new cup size

1. Confirm the size in the product catalog or shared config (`packages/cup-customizer/config/cup-catalog.ts`).
2. Create `/<cup-type-folder>/<size-slug>/default.<ext>`.
3. Reload the customizer — no code change required if the size is already in the catalog config.

Do not commit copyrighted or externally downloaded cup photographs. Use neutral placeholders or your own licensed artwork.
