# CI and Script Audit

**Audit date:** 2026-07-05  
**Action:** No CI modifications in this branch.

---

## `package.json` scripts

| Script | Purpose | Issues |
|--------|---------|--------|
| `dev` | Next dev | OK |
| `build` | Production build | OK |
| `start` | Production serve | OK |
| `lint` | ESLint | OK |
| `typecheck` | tsc --noEmit | OK |
| `test` | Vitest src | OK |
| `test:supabase:integration` | SQL integration | Not in CI |
| `test:e2e` | Playwright | **Windows-only pretest** (PowerShell) |
| `test:acceptance` | Acceptance Playwright | **Windows-only pretest** |
| `validate` | lint+typecheck+test+build | Exists ✓; no e2e |
| `test:customer-pc*` | PowerShell scripts | **Windows-only** — blocks Linux CI |
| `outreach:hosted:migration:check` | Migration validator | Not in CI |
| `ai:*` | AI tooling | Not in CI |
| `agent:*` | Maintenance orchestrator | Not in CI |

### Duplicated commands

- `pretest:e2e` and `pretest:acceptance` both call `prepare-playwright-tests.ps1` with different ports (3012 vs 3001) — intentional but should have cross-platform wrapper.

### Missing recommended commands

| Command | Purpose |
|---------|---------|
| `validate:full` | `validate` + e2e subset + migration check |
| `validate:security` | `npm audit` + dependency review script |
| `validate:release` | full + supabase integration + acceptance |

---

## `.github/workflows/ci.yml`

| Check | Present | Notes |
|-------|---------|-------|
| lint | ✓ | |
| typecheck | ✓ | |
| unit tests | ✓ | |
| build | ✓ | |
| Playwright e2e subset | ✓ | 3 specs |
| Supabase integration test | ✗ | Needs PostgreSQL service |
| `npm audit` / security job | ✗ | 3 high vulnerabilities reported locally |
| Migration validation | ✗ | `outreach:hosted:migration:check` not run |
| Concurrency cancellation | ✗ | No `concurrency:` block |
| Artifact retention | ✗ | No Playwright report upload |
| Acceptance config | ✗ | Only default playwright.config |
| Cross-platform pretest | ✗ | PowerShell prepare script |

### Hardcoded ports

| Location | Port |
|----------|------|
| `pretest:e2e` | 3012 |
| `pretest:acceptance` | 3001 |
| Dev default | 3000 |
| `private-import-acceptance.ts` | 3002 |

Document port matrix in deployment docs.

### Branches triggering CI

```yaml
branches: release/**, integration/**
```

`chore/repository-hygiene` will not CI on push until PR opened — OK.

---

## Scripts referencing removed files

No scripts reference clearly deleted paths detected. `prepare-playwright-tests.ps1` exists and is used.

---

## Windows-only commands blocking Linux CI

| Script | Impact |
|--------|--------|
| `scripts/qa/prepare-playwright-tests.ps1` | e2e pretest |
| `scripts/customer-pc/*.ps1` | customer PC validation |
| CI uses `npx playwright install` directly — **bypasses pretest on Linux** |

**Risk:** CI may not match local Windows e2e prep. Add `scripts/qa/prepare-playwright-tests.mjs` cross-platform twin.

---

## Recommendations

### NOW (documentation)

- Document `validate` vs full release validation in README ✓

### AFTER convergence

1. Add `concurrency: group: ci-${{ github.ref }}` with cancel-in-progress
2. Add `validate:security` job with `npm audit --audit-level=high`
3. Add PostgreSQL service for `test:supabase:integration`
4. Add `outreach:hosted:migration:check` to CI
5. Cross-platform Playwright prepare script
6. Upload Playwright report artifact (7-day retention)
7. Add `validate:release` meta-script for pre-deploy

---

## Workflow files inventory

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | Main validation |

No separate security, deploy, or migration workflows.
