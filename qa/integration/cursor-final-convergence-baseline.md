# Cursor Final Convergence — Baseline

**Date:** 2026-07-05  
**Worktree:** `Forge-OS-cursor-final-convergence`  
**Branch:** `integration/jh-gomes-cursor-convergence`

## Source heads

| Source | Remote ref | Head | Subject |
|--------|------------|------|---------|
| Feature convergence | `origin/integration/jh-gomes-feature-convergence-cursor` | `601b5b5` | docs(qa): record convergence result and align cup acceptance helper |
| Dependency security | `origin/integration/dependency-security-cursor` | `bd3f477` | docs(security): record dependency cursor convergence results |

## Common merge base

`213dc3e` — `chore(supabase): add local development configuration` (shared ancestor with dependency branch)

## Preflight confirmation

- Correct worktree: `Forge-OS-cursor-final-convergence`
- Correct branch: `integration/jh-gomes-cursor-convergence`
- HEAD matches expected feature base `601b5b5`
- Dependency source HEAD matches expected `bd3f477`
- Working tree clean; `git diff --check` clean
- No credentials or private customer data in working tree

## Expected file overlap

| Area | Files |
|------|-------|
| Dependencies | `package.json`, `package-lock.json` |
| Spreadsheet adapter | `src/features/shared/spreadsheet/*` (new on dependency side) |
| Lead import | `src/features/leadops/import-file-parser.ts`, `import-file-parser.test.ts` |
| Integration tests | `src/application/lead-import.integration.test.ts`, `outreach-import-send-job.integration.test.ts` |
| Data prep | `scripts/data-preparation/profile-lead-files.ts` (renamed from `.mjs`) |
| Documentation | `docs/security/*`, `qa/security/*`, `qa/performance/exceljs-bundle-review.md` |
| Possibly | `.gitignore` |

Feature-only areas (no dependency overlap expected): Cup Customizer, table density/overlays, outreach sender persistence, cup/table E2E specs.

## Dependency branch review (Phase 2)

Commits on `origin/integration/jh-gomes-outreach-supabase-7d2..origin/integration/dependency-security-cursor`:

1. `fcc5e85` fix(deps): upgrade Playwright past SSL advisory
2. `b8707ce` refactor(import): add package-neutral spreadsheet parser
3. `516487b` fix(security): remove vulnerable xlsx dependency
4. `2427ec7` test(import): cover spreadsheet parser security boundaries
5. `8044d67` perf(import): lazy-load ExcelJS behind spreadsheet adapter
6. `bd3f477` docs(security): record dependency cursor convergence results

**Confirmed absent:** OAuth routes, login UI, `proxy.ts`, auth migrations, tenant-membership implementation.

## Known 401 test failures (auth not integrated)

These outreach/campaign specs are expected to fail with HTTP 401 until the auth activation branch merges:

- `e2e/campaign-release-checkpoint.spec.ts`
- `e2e/campaign-review-manual-send.spec.ts`
- `e2e/campaign-templates-drafts.spec.ts`
- `e2e/lead-segmentation.spec.ts`

Do not weaken authentication or test assertions to mask these failures.

## Dependency approval conditions

- `@playwright/test`, `playwright`, `playwright-core` → **1.61.1**
- `xlsx` → **removed** (must not be restored in conflict resolution)
- `exceljs` → **4.4.0**, dynamically imported via spreadsheet adapter
- `npm audit` → **zero high-severity** findings
- Moderate `uuid` findings → document honestly; no npm override

## Exclusions (must not modify)

- OAuth, tenant membership, `proxy.ts`, auth callbacks, auth migrations
- Brevo sending, provider webhooks, production Supabase configuration
- Inventory ledger, product-import business logic, quotation pricing
- No migrations, email sends, or paid API calls

## Validation plan

1. Controlled merge preserving feature UI/outreach + dependency security changes
2. `npm ci`; verify Playwright/xlsx/ExcelJS graph; `npm audit`
3. `npm run lint`, `typecheck`, `test`, `build`, `validate`
4. Focused E2E: cup customizer, table density overlay, lead import wizard, acceptance 03 and 05
5. Full `test:e2e` and `test:acceptance`; classify 401 vs regression failures
6. Smoke test on isolated local DB / unused port
7. Auth overlap report vs `origin/feat/supabase-auth-membership`
8. Push `integration/jh-gomes-cursor-convergence`; do not merge to main/release/auth
