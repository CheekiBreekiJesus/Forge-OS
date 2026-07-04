# Playwright Remediation Result

Date: 2026-07-04  
Branch: `fix/playwright-audit-remediation`  
Base commit: `24c7f3d` (`docs(security): triage dependency audit findings`)

## Advisory resolved

| Field | Value |
|-------|-------|
| Advisory | [GHSA-7mvr-c777-76hp](https://github.com/advisories/GHSA-7mvr-c777-76hp) |
| Title | Playwright downloads browsers without verifying SSL certificate authenticity |
| Status | **Resolved** |

## Version change

| Package | Before | After |
|---------|--------|-------|
| `@playwright/test` | `1.53.1` (exact pin) | `^1.61.1` (resolved `1.61.1`) |
| `playwright` | `1.53.1` | `1.61.1` |
| `playwright-core` | `1.53.1` | `1.61.1` |

## package.json change

```diff
-    "@playwright/test": "1.53.1",
+    "@playwright/test": "^1.61.1",
```

Command: `npm install --save-dev @playwright/test@1.61.1`

## Lockfile impact

Minimal targeted churn — **3 packages changed**:

- `node_modules/@playwright/test` → 1.61.1
- `node_modules/playwright` → 1.61.1
- `node_modules/playwright-core` → 1.61.1

Incidental lockfile metadata adjustment on `@types/node` peer flag (no version change). No other dependencies upgraded.

## Browser installation

```
npx playwright install chromium
```

Succeeded. Downloaded Chrome for Testing 149.0.7827.55 (chromium v1228) and headless shell.

## npm audit

| When | High findings |
|------|---------------|
| Before | 3 (`playwright`, `@playwright/test`, `xlsx`) |
| After | 1 (`xlsx` only) |

Playwright no longer appears in `npm audit` output.

## Validation

| Command | Result |
|---------|--------|
| `npm run lint` | Pass (11 pre-existing warnings, 0 errors) |
| `npm run typecheck` | Pass |
| `npm test` | Pass — 299 passed, 3 skipped |
| `npm run build` | Pass |

### Targeted E2E (all pass)

| Spec | Tests |
|------|-------|
| `e2e/outreach-workflow.spec.ts` | 3 passed |
| `e2e/acceptance/03-leads-import-outreach.spec.ts` | 5 passed |
| `e2e/profile-email-branding.spec.ts` | 4 passed |
| `e2e/acceptance/01-settings-and-profiles.spec.ts` | 6 passed |

### Full E2E (`npm run test:e2e`)

**40 passed, 4 failed** (44 total)

Failed specs (console audit `expect(errors).toEqual([])`):

- `e2e/campaign-release-checkpoint.spec.ts` — 401 Unauthorized console errors
- `e2e/campaign-review-manual-send.spec.ts` — 401 Unauthorized
- `e2e/campaign-templates-drafts.spec.ts` — 401 Unauthorized
- `e2e/lead-segmentation.spec.ts` — 401 Unauthorized

These failures are **not attributed to the Playwright upgrade**: functional assertions passed; failures are strict console-error checks against `401` responses from auth-related endpoints on the OAuth foundation base. No Playwright API or test-harness compatibility changes were required. Out of scope for this remediation (auth/OAuth not modified).

CI runs e2e with `FORGEOS_TEST_AUTH_ENABLED` and related env vars (`.github/workflows/ci.yml`); local full-suite run used `FORGEOS_E2E=true` only.

## Compatibility fixes

**None.** No source, config, or test code changes were required for Playwright 1.61.1.

## Warnings observed

- `NO_COLOR` / `FORCE_COLOR` Node warnings during Playwright runs (cosmetic).
- Next.js single-worktree dev lock: sequential e2e runs may require stopping leftover `next dev` processes between suites on Windows.

## Remaining findings

| Package | Advisories | Severity |
|---------|------------|----------|
| ~~`xlsx@0.18.5`~~ | ~~GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9~~ | **Cleared** on `integration/dependency-security-remediation` |

See `qa/security/dependency-integration-result.md` for combined Playwright + ExcelJS integration.

## Related documents

- `qa/security/playwright-remediation-baseline.md`
- `qa/security/npm-audit-triage.md`
- `docs/security/dependency-remediation-plan.md`
