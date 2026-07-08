# Draft personalization fix summary

**Branch:** `feat/email-outreach-mvp-integration`

## Fixed

- Sender identity editable and persisted in Settings (separate from user profile)
- Campaigns bind `senderProfileId` at creation
- Salutation resolver (`Exmos. Senhores,` for institutional contacts)
- Organization display (`Município de …`)
- Category PT localization and category-specific body lines
- Recipient website removed from body
- Demo sender detection blocks approval
- Draft preview metadata and manual overrides
- Sender refresh action for draft campaigns

## Tests

- `src/features/leadops/draft-personalization.test.ts`
- `src/application/draft-personalization.integration.test.ts`

## Baseline

See `qa/outreach/draft-personalization-baseline.md`.
