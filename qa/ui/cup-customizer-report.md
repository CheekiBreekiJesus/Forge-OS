# Cup Customizer UI Report

Date: 2026-07-04  
Viewports reviewed: 390×844, 768×1024, 1440×900  
Locales: pt-PT, en  
Themes: light, dark (ForgeOS shell)

## Layout

| Viewport | Layout |
|----------|--------|
| Desktop (≥1280px) | Configuration left, preview + pricing right |
| Mobile / tablet | Step workflow with sticky Previous/Next |

## Fixes applied

- Step navigation for small screens (no horizontal page overflow from dual columns)
- Broken product image fallback message in `CupPreview`
- Commercial data required warning on pricing panel
- Stale mockup indicator when configuration changes
- `aria-live` region for save/generation feedback
- Photorealistic mockup explicit button (no dead auto-generate)
- Row action menus use existing portal-aware `RowActionMenu`

## Accessibility

- Labelled file upload (hidden input + button trigger)
- Range inputs labelled for scale/offset/rotation
- Step buttons with `aria-current="step"`
- Screen-reader live region for status messages

## Known UI limitations

- Simulations list hidden on mobile workflow steps (desktop only) — reopen via quotations or URL `?simulationId=`
- Transform sliders remain in printing step on mobile (acceptable for MVP)

## Console errors

E2E suite expects zero blocking console errors on customizer path.
