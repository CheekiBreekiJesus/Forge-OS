# MAINT-001 — ESLint unused-variable warnings

| Field | Value |
|-------|-------|
| Severity | Low |
| Confidence | Confirmed |
| Classification | Pre-existing |
| First seen | 2026-07-10T12:01Z |
| Last seen | 2026-07-10T13:03Z |
| Status | Open (deferred) |

## Evidence

`npm run lint` reports 13 warnings, 0 errors:

- `scripts/data-preparation/profile-lead-files.mjs`
- `src/application/campaign-draft-service.ts`
- `src/application/lead-import-service.ts`
- `src/components/settings-shell.tsx`
- `src/lib/inventory/api-client.ts`
- `src/persistence/db.ts`
- `src/persistence/interfaces.ts`

## Reproduction

```bash
npm run lint
```

## Repair decision

Deferred — cosmetic cleanup; no runtime impact. Not in scope for hourly maintenance unless touched by active work.

## Owner

Implementation agent on next touch of affected files.
