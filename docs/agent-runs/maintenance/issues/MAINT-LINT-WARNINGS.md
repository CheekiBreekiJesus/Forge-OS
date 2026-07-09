# MAINT-LINT-WARNINGS

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Confidence** | Confirmed |
| **Status** | Open (deferred) |
| **Subsystem** | Code quality |
| **First seen** | 2026-07-09 (run bc-20260709T140232-e5cd) |
| **Last updated** | 2026-07-09T17:06:00Z (run bc-20260709T170259-e8d9) |

## Description

13 ESLint `@typescript-eslint/no-unused-vars` warnings across data-preparation scripts, campaign/lead services, settings shell, inventory API client, and persistence modules.

## Evidence

```
npm run lint → 0 errors, 13 warnings
```

## Operational consequence

None — warnings do not block CI or builds.

## Repair decision

Deferred — cleanup is non-urgent and outside maintenance repair scope without active ownership conflict check.

## Recommended owner

Implementation agent during next touch of affected files.
