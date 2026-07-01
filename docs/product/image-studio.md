# Image Studio

Date: 2026-07-01

## Purpose

Image Studio creates local preview assets and stores review metadata for product and campaign images.

## Supported Local Actions

- Upload local image files into local asset storage.
- Create marketing asset metadata linked to products and campaigns.
- Generate deterministic SVG preview images through the mock provider.
- Approve reviewed assets.
- Assign an approved asset as a product marketing asset.

## Asset Review

Assets are not automatically considered production-ready. Approval is explicit and stored separately from generation.

## Future Work

Live image generation requires a server-side provider adapter, tenant-level enablement, provider credentials outside Git, cost controls, and explicit review before use.
