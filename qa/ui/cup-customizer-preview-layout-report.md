# Cup Customizer Preview Layout — Visual QA Report

**Date:** 2026-07-04  
**Branch:** `fix/cup-customizer-preview-layout`

## Viewports reviewed

| Viewport | Canvas | Upload overlay | Upload works | Mockup visible | Horizontal overflow | Save visible |
|----------|--------|----------------|--------------|----------------|---------------------|--------------|
| 1366×768 | Yes | Yes | Yes | Yes | No (internal scroll OK) | Yes |
| 1440×900 | Yes | Yes | Yes | Yes | No | Yes |
| 1920×1080 | Yes | Yes | Yes | Yes | No | Yes |
| 390×844 | Yes (preview step) | Yes | Yes | Yes | No | Yes (sticky nav) |
| 768×1024 | Yes | Yes | Yes | Yes | No | Yes |

## PT-PT / EN

- Feature-local i18n keys added under `customizerModule`.
- No internal enum strings exposed in PT-PT UI.

## Themes

- Light/dark: uses existing AppFrame slate/orange tokens; canvas readable in both.

## Fixes applied

- `CupDesignCanvas` always shows cup silhouette.
- Mockup tab displays persisted SVG asset.
- Artwork pipeline with decode validation and aria-live feedback.
- Compact preview column with design/mockup tabs.

## Errors found during QA

- None blocking after mockup display and canvas fixes.

## Remaining limitations

- Simulations list collapsed by default on desktop (expand with + control).
- Company logo requires Settings upload first.
