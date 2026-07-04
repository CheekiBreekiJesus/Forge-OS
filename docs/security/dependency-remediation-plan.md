# Dependency Remediation Plan

Date: 2026-07-04  
Branch: `chore/dependency-audit-triage`  
Base commit: `cf97561`  
Related triage: `qa/security/npm-audit-triage.md`

This document plans remediation for the three high-severity `npm audit` findings. **No dependency changes were applied on the triage branch.**

## Summary table

| Finding | Package | Dependency path | Runtime exposure | Fix available | Breaking risk | Recommended action |
|---------|---------|-----------------|------------------|---------------|---------------|-------------------|
| GHSA-7mvr-c777-76hp | `playwright@1.53.1` | `forge-os` → `@playwright/test@1.53.1` → `playwright@1.53.1` | Dev/CI only (browser install) | Yes (`playwright` ≥ 1.55.1) | Low | **Option A:** bump `@playwright/test` to `1.61.1` |
| GHSA-7mvr-c777-76hp | `@playwright/test@1.53.1` | `forge-os` → `@playwright/test@1.53.1` | Test/CI only | Yes (`1.61.1`) | Low | Same as above (single upgrade) |
| GHSA-4r6h-8v6p-xvw6 | `xlsx@0.18.5` | `forge-os` → `xlsx@0.18.5` | **Production client** (lead import) | No on npm `xlsx` | Medium–High | **Option C** then **A:** vetted replacement (`@e965/xlsx@0.20.3` or `exceljs`) |
| GHSA-5pgg-2g8v-p4x9 | `xlsx@0.18.5` | `forge-os` → `xlsx@0.18.5` | **Production client** (lead import) | No on npm `xlsx` | Medium–High | Same as prototype pollution row |

---

## Recommended remediation order

1. **Playwright** — low risk, clears two audit nodes, restores CI/dev supply-chain integrity.
2. **`xlsx`** — higher application risk; requires parser migration and import-wizard regression tests.

---

## Finding A — Playwright / `@playwright/test` (GHSA-7mvr-c777-76hp)

### OPTION A — Safest non-breaking direct upgrade (recommended)

| Field | Detail |
|-------|--------|
| Change | `@playwright/test`: `1.53.1` → `1.61.1` (minimum fix: `1.55.1`) |
| Lockfile | Updates `node_modules/@playwright/test` and transitive `playwright` / `playwright-core` |
| Breaking risk | **Low** — minor version; API used by ForgeOS is stable (`test`, `expect`, `chromium`, `devices`) |
| Regression tests | `npm run test:e2e` (or CI subset), `npm run test:acceptance` if used locally |
| CI | Verify `npx playwright install chromium --with-deps` on Ubuntu runner |
| Agent | **Composer** |

`package.json` currently **pins** `1.53.1` exactly; bump the pin or adopt `^1.61.1`.

### OPTION B — Parent dependency upgrade

Not applicable — `@playwright/test` is already the direct parent of `playwright`.

### OPTION C — Package replacement

Not recommended — no equivalent E2E runner is required; upgrade is sufficient.

### OPTION D — Temporary mitigation

| Mitigation | When to use |
|------------|-------------|
| Pin browser cache in CI (`PLAYWRIGHT_BROWSERS_PATH`) from a trusted prior install | Short-term if upgrade blocked |
| Document that `playwright install` must run only on trusted networks | Does not fix audit; operational only |

Use only if Option A is temporarily blocked.

---

## Finding B — `xlsx` (GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9)

### Context

- **Production exposure:** client-side parsing in `src/features/leadops/import-file-parser.ts`.
- **npm registry:** `xlsx` latest is `0.18.5`; advisories fixed in SheetJS releases **not published to the stale npm package**.
- **`npm audit fix`:** unavailable (`fixAvailable: false`).

### OPTION A — Direct upgrade via alternate distribution (preferred if approved)

| Field | Detail |
|-------|--------|
| Change | Replace `xlsx@^0.18.5` with `@e965/xlsx@0.20.3` (community mirror publishing post-fix SheetJS) |
| Import change | Likely `import * as XLSX from "@e965/xlsx"` (verify types/export parity) |
| Lockfile | Remove `xlsx`, add `@e965/xlsx` |
| Breaking risk | **Low–medium** — API intended to be compatible; verify `read`, `utils.sheet_to_json`, `write` in tests |
| Regression tests | `src/features/leadops/import-file-parser.test.ts`, `lead-import.integration.test.ts`, `outreach-import-send-job.integration.test.ts`, e2e `03-leads-import-outreach.spec.ts` |
| Agent | **Codex** — supply-chain and license review before merge |

**Review gates for Codex:**

- Confirm package provenance and maintenance status of `@e965/xlsx`.
- Confirm patched version addresses both GHSA entries.
- Re-run `npm audit` after swap.

### OPTION B — Parent dependency upgrade

Not applicable — `xlsx` is a direct production dependency with no parent to bump on npm.

### OPTION C — Package replacement with `exceljs` (recommended if Option A rejected)

| Field | Detail |
|-------|--------|
| Change | `xlsx` → `exceljs@^4.4.0` |
| Code impact | Refactor `import-file-parser.ts`: `ExcelJS.Workbook.xlsx.load(buffer)`, iterate worksheet rows, preserve sheet-selection logic |
| Also update | Tests, `scripts/data-preparation/profile-lead-files.mjs` |
| Breaking risk | **Medium** — API rewrite; behavior must be re-validated for multi-sheet workbooks, empty cells, Portuguese CSV delimiters unchanged |
| Regression tests | Same as Option A plus manual multi-sheet `.xlsx` fixtures |
| Agent | **Codex** |

### OPTION D — Temporary mitigation (no safe fix on npm `xlsx`)

| Mitigation | Limitation |
|------------|------------|
| Keep 5 MB / 5000 row caps | Reduces DoS window, does not fix parser bugs |
| Move parsing to server API route with timeout + size limits | Requires new endpoint, auth, tenant scoping — **architecture change** |
| Disable `.xlsx` import until replacement ships | Acceptable short-term for internal demo; document operator workaround (CSV export) |
| Web Worker offload for parse | Improves UX under ReDoS; does not remove vulnerability |

Combine **disable or server-move** with Option A/C for production deployments handling untrusted spreadsheets.

---

## Lockfile expectations

| Remediation | Expected lockfile delta |
|-------------|-------------------------|
| Playwright bump | `@playwright/test`, `playwright`, `playwright-core` version hashes |
| `@e965/xlsx` swap | Remove `xlsx` entry; add `@e965/xlsx` |
| `exceljs` migration | Remove `xlsx`; add `exceljs` and its transitive deps (larger tree) |

Do **not** run `npm audit fix --force` — it may jump unrelated packages.

---

## Agent assignment

| Finding | Composer-safe? | Codex review required? |
|---------|----------------|------------------------|
| Playwright SSL | **Yes** — version bump + e2e smoke | No (unless e2e flakes) |
| `xlsx` prototype pollution | Partial — can bump lockfile after package choice | **Yes** — parser choice, imports, license |
| `xlsx` ReDoS | Partial | **Yes** — same migration as above |

---

## Post-remediation validation checklist

```bash
npm ci
npm audit
npm run typecheck
npm test
npm run build
npx playwright install chromium --with-deps   # after Playwright bump
npm run test:e2e -- e2e/lead-import-wizard.spec.ts e2e/acceptance/03-leads-import-outreach.spec.ts
```

Success criteria:

- `npm audit` reports **zero high** findings (or documented accepted risk with compensating controls).
- Lead import wizard accepts representative `.xlsx` fixtures (multi-sheet, Portuguese headers).
- No `xlsx` import remains in production client bundle unless on a patched distribution.

---

## Remediation agent prompt inputs

Copy the block below to the implementation agent (Composer or Codex as indicated).

### Prompt 1 — Playwright (Composer)

```
Worktree: Forge-OS (or dependency-audit follow-up branch from main)
Base: after merging chore/dependency-audit-triage

Task: Remediate GHSA-7mvr-c777-76hp

1. In package.json devDependencies, upgrade @playwright/test from 1.53.1 to 1.61.1 (or ^1.61.1).
2. Run npm install (not audit fix --force) to refresh package-lock.json.
3. Verify playwright transitive version is >= 1.55.1.
4. Run: npm run typecheck, npm test, npm run build.
5. Run: npx playwright install chromium && npm run test:e2e -- e2e/outreach-workflow.spec.ts e2e/acceptance/03-leads-import-outreach.spec.ts
6. Confirm npm audit no longer reports playwright or @playwright/test high findings.

Do not modify xlsx in this task.
```

### Prompt 2 — xlsx (Codex)

```
Worktree: Forge-OS
Base: after Playwright remediation (or parallel if coordinated)

Task: Remediate GHSA-4r6h-8v6p-xvw6 and GHSA-5pgg-2g8v-p4x9 in production lead import

Context:
- xlsx@0.18.5 is a direct production dependency.
- Client component leadops-import-wizard.tsx parses user .xlsx via src/features/leadops/import-file-parser.ts.
- npm registry xlsx has no fix (latest 0.18.5).
- Triage recommends @e965/xlsx@0.20.3 (drop-in) OR exceljs@4.4.0 (refactor).

Requirements:
1. Choose replacement after license/supply-chain check; prefer smallest safe diff.
2. Update import-file-parser.ts and scripts/data-preparation/profile-lead-files.mjs.
3. Update all tests using xlsx fixtures.
4. Preserve: MAX_IMPORT_BYTES (5MB), MAX_IMPORT_ROWS (5000), cellFormula/cellHTML disabled, multi-sheet selection.
5. Run: npm run typecheck, npm test, npm run build, npm audit.
6. Run e2e: e2e/lead-import-wizard.spec.ts, e2e/acceptance/03-leads-import-outreach.spec.ts.
7. Document chosen package and any residual risk in qa/security/ if audit still warns.

Do not use npm audit fix --force.
```

---

## Risk acceptance (only if remediation deferred)

| Finding | Deferrable? | Conditions |
|---------|-------------|------------|
| Playwright | Short-term yes | Trusted CI network; upgrade within one sprint |
| `xlsx` ReDoS | **No** for production lead import | Untrusted uploads reach parser |
| `xlsx` prototype pollution | **No** for production lead import | Same path |

If deferring `xlsx`, disable `.xlsx` upload in `validateImportFile` / UI `accept` attribute and document CSV-only import until migration ships.
