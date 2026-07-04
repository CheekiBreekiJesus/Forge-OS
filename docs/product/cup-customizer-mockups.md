# Cup Customizer — Mockups

## Deterministic preview (required)

`CupPreview` component renders immediately from:

- Product image or silhouette fallback
- Artwork blob/data URL
- Transform settings

This is the **source of truth** for customization. Works offline.

## Operational SVG mockup (on save)

`buildMockupAssetBlob()` generates a tenant-local SVG when saving or converting to quotation. Stored as `mockupAssetId`.

## Photorealistic mockup (optional, gated)

User must click **Generate realistic mockup**. No automatic paid API call.

### Development / test

- Provider: `deterministic`
- Output: enhanced SVG with disclaimer text
- No live Abacus or paid image API

### Production (future)

- Server-side provider when `ABACUS_API_KEY` or `FORGEOS_AI_IMAGE_PROVIDER` configured
- API keys never exposed to browser
- Fail safely when unavailable

## Stale mockups

When artwork, quantity, product, or configuration fingerprint changes after generation, UI shows stale status. Previous mockup is retained until user regenerates.

## Labelling

All photorealistic outputs must display:

> AI-generated visualization — final production appearance may vary.
