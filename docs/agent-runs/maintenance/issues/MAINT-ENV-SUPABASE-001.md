# MAINT-ENV-SUPABASE-001 — Supabase integration tests skipped in cloud pod

| Field | Value |
|-------|-------|
| **Status** | open |
| **Severity** | Low |
| **Confidence** | Confirmed |
| **Classification** | environmental |
| **First seen** | 2026-07-09T11:02Z (prior run) |
| **Last seen** | 2026-07-10T02:04Z (run `bc-65f8b9f4`) |

## Evidence

Cloud maintenance pod has no local Postgres. `npm run test:supabase:integration` not executed.

Hosted outreach migration static check passed:

```bash
npm run outreach:hosted:migration:check  # PASS
```

## Recommended action

Run `npm run test:supabase:integration` in CI or a maintenance environment with local Postgres when outreach/inventory persistence changes land.

## Repair decision

No code repair. Environment limitation.
