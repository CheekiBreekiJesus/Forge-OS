# Report 1 — Hardening Merge

**Date:** 2026-07-09

## Branches & commits

| Item | SHA |
|------|-----|
| `origin/main` (before) | `ced4fd4` |
| Integration tip (verified) | `3c4972f` |
| Merge commit on `main` | see `git log -1` after push |

## Diff review

- 72 files, +6968 / -564 lines
- No `.env`, secrets, or QA artifacts in diff
- Migrations additive: `202607091200_*`, `202607091300_*` (RPC guards)
- Cup customizer commits separable (`aeaefee`, `b01e2b6`) — non-blocking UI fixes
- `xlsx` removed; ExcelJS adapter added

## Pre-merge validation

| Check | Result |
|-------|--------|
| `npm ci` | PASS |
| `npm run lint` | PASS (0 errors, 13 warnings) |
| `npm run typecheck` | PASS |
| `npm test` | PASS (485 passed, 17 skipped) |
| `npm run test:supabase:integration` | PASS (17/17, local Postgres) |
| Focused Playwright | PASS (20/20) |
| `npm run build` | PASS |

## Post-merge validation

| Check | Result |
|-------|--------|
| lint / typecheck / test / build | PASS |

## npm audit disposition

| Finding | Classification |
|---------|----------------|
| Playwright SSL cert (high) | Dev/CI only — not production runtime |
| uuid via exceljs (moderate) | Transitive; spreadsheet parse path; no direct user-controlled buffer exploit identified; track separately |

**Decision:** Non-blocking for merge.

## Branch protection

- Recommend: require PR + **Core validation** check on `main`
- Not configured via this agent (requires GitHub admin)

## Remaining non-blocking

- Full acceptance Playwright suite not run
- Playwright/uuid audit items tracked for separate remediation
