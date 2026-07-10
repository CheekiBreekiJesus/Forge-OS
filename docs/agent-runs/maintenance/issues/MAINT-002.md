# MAINT-002 — Pre-existing ESLint unused-variable warnings

| Field | Value |
|-------|-------|
| **ID** | MAINT-002 |
| **Severity** | Low |
| **Confidence** | Confirmed |
| **Classification** | pre-existing |
| **First seen** | 2026-07-10T14:01Z |
| **Last confirmed** | 2026-07-10T17:05Z |
| **Owner** | implementation agents (low priority) |

## Summary

13 ESLint `@typescript-eslint/no-unused-vars` warnings across 7 files. Zero errors; lint exits 0.

## Affected files

- `scripts/data-preparation/profile-lead-files.mjs`
- `src/application/campaign-draft-service.ts`
- `src/application/lead-import-service.ts`
- `src/components/settings-shell.tsx`
- `src/lib/inventory/api-client.ts`
- `src/persistence/db.ts`
- `src/persistence/interfaces.ts`

## Recommended action

Clean up unused imports/variables in a focused chore PR when convenient.

## Repair decision

**Defer** — cosmetic; no runtime impact.
