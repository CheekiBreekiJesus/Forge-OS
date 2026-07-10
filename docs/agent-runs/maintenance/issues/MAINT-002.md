# MAINT-002 — Pre-existing ESLint unused-variable warnings

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Confidence** | Confirmed |
| **Classification** | Pre-existing |
| **First seen** | 2026-07-09T16:01Z (run `bc-3e95ca35`) |
| **Last confirmed** | 2026-07-10T14:05Z (run `bc-91906189`) |
| **Status** | Open |

## Problem

`npm run lint` reports 13 warnings (0 errors) for unused variables across:

- `scripts/data-preparation/profile-lead-files.mjs`
- `src/application/campaign-draft-service.ts`
- `src/application/lead-import-service.ts`
- `src/components/settings-shell.tsx`
- `src/lib/inventory/api-client.ts`
- `src/persistence/db.ts`
- `src/persistence/interfaces.ts`

## Evidence

```bash
npm run lint
```

## Operational risk

None (warnings only; CI passes).

## Recommended action

Defer to implementation agent for cleanup when touching affected modules; not maintenance scope unless lint errors appear.

## Ownership

Platform / module owners
