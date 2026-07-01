# Campaign Builder

Date: 2026-07-01

## Purpose

Campaign Builder prepares reviewable marketing campaign packages for manufacturing products without connecting to live advertising platforms.

## Fields

Campaigns store:

- Objective
- Selected products
- Selected audiences
- Channels
- Target regions
- Budget metadata
- Dates
- Offer text
- Landing page URL
- Call to action
- Campaign concept
- Approval and export state

## Generation

Copy generation currently uses deterministic local templates in `src/features/marketing/campaign-generation.ts`. It uses selected products, selected audiences, campaign fields, and the Brand Kit. It does not invent prices, discounts, delivery guarantees, certifications, or customer names.

## Review

Generated variants start in `pending_review`. Export packages include approved variants and approved assets.

## Export

Campaigns can export:

- JSON review package.
- CSV copy sheet.

Provider payload previews are included as disabled previews only.
