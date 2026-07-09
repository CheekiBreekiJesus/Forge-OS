# MAINT-LINT-WARNINGS — ESLint unused variable warnings

| Field | Value |
|-------|-------|
| Status | Open (deferred) |
| Severity | Low |
| Confidence | Confirmed |
| Last updated | 2026-07-09T14:02Z |

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

## Recommended action

Batch cleanup in a dedicated chore PR when no active agent owns these files.

## Reproduction

```bash
npm run lint
```
