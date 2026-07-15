# MAINT-002 — pre-existing ESLint warnings

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Confidence** | Confirmed |
| **Classification** | Pre-existing |
| **First seen** | 2026-07-09T16:01Z (run `bc-3e95ca35`) |
| **Last confirmed** | 2026-07-10T08:05Z (run `bc-0a348aea`) |
| **Status** | Open |

## Problem

13 ESLint `@typescript-eslint/no-unused-vars` warnings across 7 files. Zero errors; lint exits 0.

## Affected files

- `scripts/data-preparation/profile-lead-files.mjs`
- `src/application/campaign-draft-service.ts`
- `src/application/lead-import-service.ts`
- `src/components/settings-shell.tsx`
- `src/lib/inventory/api-client.ts`
- `src/persistence/db.ts`
- `src/persistence/interfaces.ts`

## Operational risk

None — warnings only.

## Recommended action

Low-priority cleanup when touching those modules; not a maintenance repair target.

## Ownership

Implementation agents owning affected modules
