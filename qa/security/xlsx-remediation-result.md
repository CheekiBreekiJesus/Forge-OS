# xlsx Remediation Result

Date: 2026-07-04  
Branch: `fix/xlsx-security-remediation`  
Base commit: `24c7f3d`  
Status: **Integrated** on `integration/dependency-security-remediation` (2026-07-04)

## Summary

Removed vulnerable production dependency `xlsx@0.18.5` and replaced it with `exceljs@4.4.0` behind ForgeOS adapter `src/features/shared/spreadsheet/spreadsheet-parser.ts`.

| Advisory | Status |
|----------|--------|
| GHSA-4r6h-8v6p-xvw6 (prototype pollution) | **Cleared** — `xlsx` removed from dependency graph |
| GHSA-5pgg-2g8v-p4x9 (ReDoS) | **Cleared** — `xlsx` removed from dependency graph |

## Package change

| | Before | After |
|---|--------|-------|
| Production parser | `xlsx@0.18.5` | `exceljs@4.4.0` (via adapter only) |
| Direct `xlsx` import in app | Yes | **No** |

Decision record: `docs/security/spreadsheet-parser-decision.md`

## npm audit

| When | High | Moderate | Notes |
|------|------|----------|-------|
| Before | 3 | 0 | `xlsx` (×2 advisories), `playwright` |
| After | 2 | 2 | `playwright` only (not fixed on this branch); `uuid` moderate via `exceljs` transitive |

**`xlsx` no longer appears in `npm ls` or production `dependencies`.**

## Adapter architecture

```
leadops-import-wizard.tsx
  → lead-import-service.ts
    → import-file-parser.ts
      → spreadsheet-parser.ts (ForgeOS API)
        → exceljs (sole consumer)
```

Neutral outputs: `string[][]` matrices, sheet name lists, bounded warnings. No formula execution, no HTML rendering, no network I/O.

## Security limits (preserved / strengthened)

| Control | Value |
|---------|-------|
| `MAX_IMPORT_BYTES` / `MAX_SPREADSHEET_BYTES` | 5 MB |
| `MAX_IMPORT_ROWS` / `MAX_SPREADSHEET_ROWS` | 5,000 |
| `MAX_SPREADSHEET_SHEETS` | 100 |
| `MAX_SPREADSHEET_COLUMNS` | 256 |
| Formulas | Read as displayed values only; warning emitted |
| HTML / macros | Not rendered or executed |
| Encrypted workbooks | Rejected |
| Legacy `.xls` (production wizard) | Rejected with explicit validation message |
| Prototype pollution keys | Filtered in `safeObjectFromRow` |

## Format support

| Format | Production lead import | Dev profiler |
|--------|------------------------|--------------|
| XLSX | Yes | Yes |
| CSV | Yes (native parser, unchanged) | Yes |
| Legacy XLS | No (explicit rejection) | Skipped with documented reason |

## Migrated files

| File | Change |
|------|--------|
| `src/features/leadops/import-file-parser.ts` | Uses spreadsheet adapter |
| `src/features/shared/spreadsheet/spreadsheet-parser.ts` | New adapter |
| `src/features/shared/spreadsheet/spreadsheet-fixtures.ts` | Synthetic workbook helper |
| `scripts/data-preparation/profile-lead-files.ts` | Replaces `.mjs`; uses adapter |
| Integration / unit tests | Synthetic fixtures via `spreadsheet-fixtures` |

## Validation

| Check | Result |
|-------|--------|
| `npm run lint` | Pass (pre-existing warnings only) |
| `npm run typecheck` | Pass |
| `npm test` | Pass — 315+ unit/integration tests |
| `npm run build` | Pass |
| `e2e/lead-import-wizard.spec.ts` | 2/2 passed |
| `e2e/acceptance/03-leads-import-outreach.spec.ts` | 5/5 passed |

## Performance (synthetic, local vitest)

Aggregate parse timings on Windows dev machine (adapter + exceljs):

| Workbook | Rows | Approximate parse time |
|----------|------|------------------------|
| Synthetic | 271 | &lt; 5 s (test bound) |
| Synthetic | 5,000 | &lt; 20 s (test bound) |

Client bundle: production build succeeds with exceljs in leadops client graph. Exact chunk delta not isolated in this branch — Codex should compare bundle analyzer output before merge.

## Remaining risk

1. **`uuid` moderate** (GHSA-w5hq-g745-h8pq) via `exceljs` transitive dependency — dev/parse path only; monitor exceljs upgrade.
2. **Playwright high** (GHSA-7mvr-c777-76hp) — unchanged on this branch; remediated separately on `fix/playwright-audit-remediation`.
3. **`.xls` deprecation** — dev profiler no longer parses legacy XLS; production wizard never accepted `.xls` by extension.
4. **exceljs client bundle weight** — requires Codex sign-off for `/leadops` load budget.

## Codex review requirements before merge

1. Supply-chain sign-off on `exceljs@4.4.0` vs rejected `@e965/xlsx`.
2. Bundle size / Turbopack client impact on leadops import wizard.
3. Cell-formatting parity spot-check with synthetic PT fixtures (accents, leading zeros, percentages).
4. Confirm no `xlsx` string remains in production bundle (`npm ls`, build analyzer).
5. Accept or mitigate transitive `uuid` moderate finding.
6. Re-run targeted E2E in CI with auth env vars.

## Related documents

- `qa/security/xlsx-remediation-baseline.md`
- `docs/security/spreadsheet-parser-decision.md`
- `docs/email-outreach/lead-import.md`
