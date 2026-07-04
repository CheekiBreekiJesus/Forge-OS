# Dependency Integration Result

Date: 2026-07-04  
Branch: `integration/dependency-security-remediation`  
Decision: **APPROVED WITH CONDITIONS**

## Branches integrated

| Branch | Head | Integrated |
|--------|------|------------|
| `origin/fix/playwright-audit-remediation` | `5ef6630` | Base |
| `origin/fix/xlsx-security-remediation` | `73a897b` | Trial-merged |

## Merge result

Trial merge of `origin/fix/xlsx-security-remediation` into Playwright base succeeded with **2 documentation conflicts**, resolved manually:

| File | Resolution |
|------|------------|
| `docs/security/dependency-remediation-plan.md` | Both remediations marked complete |
| `qa/security/npm-audit-triage.md` | Combined Playwright + ExcelJS integration update |

`package.json` auto-merged correctly: `exceljs@^4.4.0`, `@playwright/test@^1.61.1`, no `xlsx`.

## Playwright

| Package | Version |
|---------|---------|
| `@playwright/test` | `1.61.1` |
| `playwright` | `1.61.1` |
| `playwright-core` | `1.61.1` |

GHSA-7mvr-c777-76hp: **absent**.

## Spreadsheet parser

| Item | Value |
|------|-------|
| Removed | `xlsx@0.18.5` |
| Replacement | `exceljs@4.4.0` |
| Adapter | `src/features/shared/spreadsheet/spreadsheet-parser.ts` |
| Lazy loading | Dynamic `import("exceljs")` on first parse |

## UUID decision

**Option B — Accept documented residual moderate risk**

| Field | Value |
|-------|-------|
| Advisory | GHSA-w5hq-g745-h8pq |
| Installed | `uuid@8.3.2` (transitive via `exceljs`) |
| Fixed in audit | `>=11.1.1` |
| ExcelJS usage | `uuid.v4()` only in `cf-rule-ext-xform.js` |
| Vulnerable API | v3/v5/v6 with attacker-controlled `buf` — **not invoked** |
| ForgeOS usage | None direct |
| Workbook input influence | None on UUID generation |
| Override attempted | No — would be audit-count chasing without reachable exploit path |

## Supply-chain conclusion

`exceljs@4.4.0` is suitable for production lead import. `@e965/xlsx` remains documented fallback only. No `xlsx@0.18.5` in graph.

## Adapter security review

All required limits verified in adapter (5 MB, 5k rows, 100 sheets, 256 columns, no formula execution, no HTML, no network, encrypted rejected, prototype keys filtered). No additional guards required beyond integration lazy-load change.

## Bundle impact

ExcelJS ~909 KB async chunk; LeadOps route shell ~68 KB without ExcelJS on first paint. See `qa/performance/spreadsheet-bundle-analysis.md`.

## Behavior parity

Synthetic coverage in `spreadsheet-parser.test.ts` and `import-file-parser.test.ts` passes for PT characters, leading zeros, multi-sheet, formulas-as-display, hidden sheets, CSV delimiters unchanged.

### XLS

Production wizard `accept` has never included `.xls`. Validation rejects with explicit message. **No user-facing regression.**

### CSV

Unchanged native parser; semicolon/comma/BOM/quoted fields preserved.

## Performance

271-row and 5,000-row synthetic parses within existing test bounds (<5 s / <20 s). See `qa/performance/spreadsheet-parser-integration-benchmark.md`.

## Test results

| Suite | Result |
|-------|--------|
| `npm run lint` | Pass (10 pre-existing warnings) |
| `npm run typecheck` | Pass |
| `npm test` | **316 passed**, 3 skipped |
| `npm run build` | Pass |
| `e2e/lead-import-wizard.spec.ts` | **2/2 passed** |
| `e2e/acceptance/03-leads-import-outreach.spec.ts` | **5/5 passed** |
| `npm run test:e2e` | **40/44 passed** — 4 failures are pre-existing auth 401 console-audit failures (not parser-related) |
| `npm run test:acceptance` (full) | **Not completed** — Turbopack dev-server panics/timeouts under repeated restarts on local Windows run; targeted import acceptance passed |
| `npm run validate` | Pass (lint + typecheck + test + build) |

## Approval

**APPROVED WITH CONDITIONS** for later merge into Supabase/auth integration work.

### Conditions before auth-branch merge

1. Re-run full `npm run test:acceptance` in CI (Ubuntu) — local full suite blocked by Turbopack instability, not import regression.
2. Confirm auth-integration branch does not reintroduce `xlsx` or downgrade Playwright.
3. Monitor `exceljs` / `uuid` for upstream updates; revisit override only if ExcelJS begins calling vulnerable uuid APIs.

## Later integration instructions (for Codex auth work)

1. **Do not merge** `integration/dependency-security-remediation` into `integration/jh-gomes-auth-activation` until auth activation stabilizes.
2. When ready, merge dependency branch into auth integration with:
   ```bash
   git checkout integration/jh-gomes-auth-activation
   git merge --no-ff integration/dependency-security-remediation
   ```
3. Resolve conflicts favoring: auth/session code from auth branch; `exceljs` adapter + Playwright `1.61.1` from dependency branch.
4. Run: `npm ci`, `npm audit`, `npm run validate`, targeted import E2E, CI acceptance job.
5. Do **not** merge either branch directly to `main` or release until combined QA passes.

## Related documents

- `qa/security/dependency-integration-baseline.md`
- `qa/security/dependency-integration-audit.md`
- `qa/security/spreadsheet-source-review.md`
- `qa/performance/spreadsheet-bundle-analysis.md`
- `qa/performance/spreadsheet-parser-integration-benchmark.md`
