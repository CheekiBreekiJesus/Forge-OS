# Outreach latest summary — draft personalization

**Date:** 2026-07-03  
**Branch:** `feat/email-outreach-mvp-integration`

## Change

Fixed manual email MVP draft personalization and sender-profile persistence.

## Validation

| Check | Result |
|-------|--------|
| `npm run typecheck` | Pass |
| `npm test` | 244 passed |
| `npm run lint` | Pass (warnings only) |

## Acceptance example

`Tábua` / `Municipality` / `geral@example.invalid` → `Exmos. Senhores,`, `Município de Tábua`, persisted synthetic sender, no `Municipality`, no recipient website line.

## Docs

- `docs/email-outreach/sender-profiles.md`
- `docs/email-outreach/draft-personalization.md`
- `docs/email-outreach/manual-send.md`
- `qa/outreach/draft-personalization-baseline.md`
- `qa/outreach/draft-personalization-summary.md`
