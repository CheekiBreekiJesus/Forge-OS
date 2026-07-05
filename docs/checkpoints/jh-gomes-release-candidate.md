# JH Gomes Release Candidate Checkpoint

**Date:** 2026-07-05  
**Branch:** `integration/jh-gomes-release-candidate`

## Purpose

Single integration branch combining:

1. Cursor feature convergence (cup customizer, table UI, outreach verification)
2. Dependency security remediation (Playwright 1.61.1, xlsx removal, ExcelJS)
3. Supabase auth activation (OAuth, membership, proxy route protection)

## Integration lineage

```text
integration/jh-gomes-cursor-convergence @ 64a1ebd
  + integration/jh-gomes-auth-activation @ 4b42cc7
  → integration/jh-gomes-release-candidate
```

## CI repair

- Node 22 standardized in repo and GitHub Actions
- npm 10.9.8 pinned via `packageManager`
- `package-lock.json` regenerated for Linux `npm ci`
- `@emnapi/runtime@1.11.2` / `@emnapi/core@1.11.2` lockfile gap resolved

## Validation summary

| Check | Status |
|-------|--------|
| Auth merge | Complete |
| Unit tests | Pass |
| E2E | Pass (61) |
| Acceptance | Pass (50 + 1 skipped) |
| Build | Pass |
| Local Supabase migrations | Pass |
| Supabase integration tests | Pass |
| npm audit high/critical | None |

## Deployment gate

Before JH Gomes staging:

1. Apply `supabase/migrations/202607040001_auth_membership_status_permissions.sql` to approved staging
2. Configure OAuth providers and redirect URLs
3. Bootstrap tenant membership for authorized users
4. Set `FORGEOS_PERSISTENCE_MODE=supabase` in deployment environment

## References

- `qa/integration/release-candidate-baseline.md`
- `qa/integration/release-candidate-result.md`
- `qa/ci/node-lockfile-repair.md`
- `qa/ci/github-actions-validation.md`
- `docs/deployment/supabase-auth-activation.md`
