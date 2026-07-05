# JH Gomes Release Candidate — Integration Result

**Date:** 2026-07-05  
**Branch:** `integration/jh-gomes-release-candidate`  
**Worktree:** `Forge-OS-release-candidate`

## Commits integrated

| Role | SHA | Message |
|------|-----|---------|
| Base | `64a1ebd` | docs(qa): record cursor final convergence results and auth overlap |
| Auth source | `4b42cc7` | test(auth): validate Supabase activation path |
| Merge | `18b1480` | merge(integration): combine auth activation with Cursor convergence |

## Merge outcome

- **Conflicts:** None (clean auto-merge on i18n, e2e runtime helpers, acceptance tests).
- Auth-owned files merged intact: `src/proxy.ts`, `src/lib/auth/*`, OAuth routes, access pages, membership migration, send-job actor context.
- Cursor convergence preserved: Cup Customizer, table density, ExcelJS adapter, Playwright 1.61.1, no `xlsx`.

## Tooling

| Setting | Value |
|---------|-------|
| `engines.node` | `>=22 <23` |
| `packageManager` | `npm@10.9.8` |
| `.nvmrc` / `.node-version` | `22` |

## Dependencies

| Package | Version |
|---------|---------|
| `@supabase/ssr` | 0.12.0 (pinned) |
| `@supabase/supabase-js` | 2.110.0 (pinned) |
| `@playwright/test` / `playwright` | 1.61.1 |
| `exceljs` | 4.4.0 |
| `xlsx` | absent |

## Audit

- 0 high, 0 critical
- 2 moderate (`uuid@8.3.2` via `exceljs`) — documented accepted residual

## Test results

| Suite | Result |
|-------|--------|
| Unit (`npm test`) | 413 passed |
| E2E (`npm run test:e2e`) | 61 passed |
| Acceptance (`npm run test:acceptance`) | 50 passed, 1 skipped (live-ai) |
| Build (`npm run build`) | Pass |
| Validate (`npm run validate`) | Pass |
| Supabase reset (local) | Pass |
| Supabase integration | 3 passed |

## Previously failing E2E (401)

After auth merge + test session bootstrap in `e2e/helpers/runtime.ts`, these now pass:

1. `campaign-release-checkpoint.spec.ts` — suppression / re-approval
2. `campaign-review-manual-send.spec.ts` — manual send flow
3. `campaign-templates-drafts.spec.ts` — template/draft persistence
4. `lead-segmentation.spec.ts` — campaign snapshot/recipients

Cause was missing `FORGEOS_TEST_AUTH_ENABLED` synthetic session before auth activation merge. Production fail-closed behavior preserved.

## External actions still required

- Configure Google/Microsoft OAuth in hosted Supabase
- Set hosted callback URLs and site URL
- Apply migrations to approved staging (not done by this branch)
- Bootstrap first real tenant membership
- Run staging OAuth smoke test

## Hosted Supabase

**Not modified.** All migration validation used `npx supabase db reset --local --yes` only.
