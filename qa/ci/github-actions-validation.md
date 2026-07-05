# GitHub Actions Validation

**Date:** 2026-07-05  
**Branch:** `integration/jh-gomes-release-candidate`

## Workflows updated

| Workflow | Node | Changes |
|----------|------|---------|
| `.github/workflows/ci.yml` | 22 | Version print step, concurrency group |
| `.github/workflows/supabase-integration.yml` | 22 | Version print step, concurrency, push triggers for `integration/**` and auth paths |

## CI job sequence (validate)

1. `actions/checkout@v4`
2. `actions/setup-node@v4` with `node-version: "22"`, `cache: npm`
3. Print `node --version` and `npm --version`
4. `npm ci` (strict, no `--legacy-peer-deps`)
5. `npm run lint`
6. `npm run typecheck`
7. `npm test`
8. `npm run build`
9. `npx playwright install chromium --with-deps`
10. `npm run test:e2e -- e2e/outreach-workflow.spec.ts e2e/campaign-send-job-simulation.spec.ts e2e/acceptance/03-leads-import-outreach.spec.ts`

## Supabase integration job sequence

1. Checkout, Node 22, version print
2. `npm ci`
3. `npm run test:supabase:integration` against service Postgres on port 5432

## Concurrency

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

## Local CI-faithful check (Docker)

Verified on `node:22-bookworm`:

- `npm ci` — pass
- `npm run lint` — pass (14 warnings, 0 errors)
- `npm run typecheck` — pass
- `npm test` — 410 passed, 3 skipped (supabase integration without DB URL in unit job)
- `npm run build` — pass

## Local Windows check

| Step | Result |
|------|--------|
| `npm run validate` | Pass |
| `npm run test:e2e` | 61 passed |
| `npm run test:acceptance` | 50 passed, 1 skipped (live-ai) |
| `npx supabase db reset --local --yes` | Pass |
| `npm run test:supabase:integration` | 3 passed |
