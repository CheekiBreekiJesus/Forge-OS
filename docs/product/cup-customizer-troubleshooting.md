# Cup Customizer — Troubleshooting

## Route not found

- Primary: `/[locale]/quotations/customizer`
- Alias: `/[locale]/products/cup-customizer`

## No cup products in list

Seed demo data or import products with `personalizationAvailable` or SKU containing `CUP`.

## Broken product image

Demo SVG assets live under `public/demo/products/`. If missing, preview shows silhouette + amber warning.

## Artwork upload rejected

- Check file size ≤ 2 MB
- Use PNG, JPEG, WebP, or safe SVG
- See [Artwork doc](./cup-customizer-artwork.md)

## Pricing shows "Commercial data required"

Configure product commercial fields or enter labelled manual unit price override.

## Mockup generation fails

Development uses deterministic provider only. Check browser console; no API key required for local tests.

## Simulation not persisting

Confirm IndexedDB not cleared. Reset Demo Data may remove demo simulations; user-created projects should survive demo reset (see backup docs).

## Quotation duplicate

Ensure latest `convertSimulationToQuote` with draft update logic is deployed. Only one quote per simulation when quote remains draft.

## Merge conflicts after outreach integration

See `qa/cup-customizer/integration-overlap.md` for i18n merge guidance.
