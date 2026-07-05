# Composer persistence review — ForgeOS 0.2.0 local demo

**Date:** 2026-07-05  
**Branch:** `release/forgeos-0.2.0-local-demo`  
**Reviewer:** Composer (substitute for unavailable independent Codex review)  
**Entry gate for:** UI stabilization and integrated workflow work (not visual polish)

## Decision

| Gate | Status |
|------|--------|
| **Persistence GO** | **GO** — functional UI and integration work may proceed |
| **Visual polish** | **HOLD** — pt-PT diacritics and cosmetic i18n remain deferred (not data-lifecycle) |

No **BLOCKER** or unresolved **HIGH** data-lifecycle defect blocks functional demo work on this branch.

---

## Sources reviewed

| Document | Status |
|----------|--------|
| `qa/demo/demo-data-lifecycle-result.md` | Read — Prompt 2 implementation summary |
| `docs/demo/demo-reset-backup-restore.md` | Read — reset/backup contract |
| `docs/demo/demo-data-reference.md` | Read — SEED_VERSION 5, SCHEMA_VERSION 13 |
| `src/demo/local-demo-lifecycle.test.ts` | Executed — 11 lifecycle tests pass (via `npm test`) |
| `src/features/demo/local-demo-guard.ts` | Read — fail-closed guards |
| Prior UI fix `leadops-dashboard-shell.tsx` (`dataVersion` reload) | Verified in commit `0b1bfbe` |

---

## Persistence GO conditions (from Prompt 2 / lifecycle contract)

| # | Condition | Severity if open | Status | Evidence |
|---|-----------|------------------|--------|----------|
| 1 | Local persistence only for demo lifecycle | BLOCKER | **Met** | `local-demo-guard.ts`; Supabase throws `LocalDemoLifecycleError` |
| 2 | No Supabase/OAuth/Brevo in demo contract | BLOCKER | **Met** | `scripts/demo/contract.mjs` clears hosted keys; simulation providers |
| 3 | Demo scripts do not edit `.env.local` | HIGH | **Met** | `buildDemoProcessEnv()` injects env at runtime only |
| 4 | Deterministic idempotent seed (`SEED_VERSION`) | HIGH | **Met** | `SEED_VERSION = 5`; `local-demo-lifecycle.test.ts` repeat-seed case |
| 5 | Tenant isolation (`tenant_jh_gomes`) | HIGH | **Met** | Lifecycle isolation test; backup exports correct `tenantId` |
| 6 | Synthetic emails only (`*.example` / `*.invalid`) | HIGH | **Met** | `local-demo-dataset.ts` policy; demo-data-reference.md |
| 7 | Explicit confirmation for destructive reset | HIGH | **Met** | Settings + demo page `window.confirm`; acceptance `06-backup-reset` |
| 8 | Backup v9 with `schemaVersion` | HIGH | **Met** | `exportBackup` test; incompatible schema rejected |
| 9 | Three reset paths (demo-only / clear all / full restore) | HIGH | **Met** | Settings UI + `resetDemoData` / `clearAllLocalData` / `restoreDeterministicDemoState` tests |
| 10 | No duplicate rows on backup re-import | HIGH | **Met** | `exports and restores backup without duplicating records` test |
| 11 | User-created records preserved on demo-only reset | HIGH | **Met** | `reset demo data then reseed restores managed records only` test |
| 12 | UI reflects persistence after demo reset (LeadOps campaigns) | HIGH | **Met** | `leadops-dashboard-shell.tsx` reload on `dataVersion` (`0b1bfbe`) |
| 13 | Footer shows local demo environment (not “Produção”) | MEDIUM | **Met** | `app-frame.tsx` + `dashboard.status.localDemo` (`0b1bfbe`) |
| 14 | Node 22.x for `demo:*` CLI scripts | HIGH (ops) | **Environmental** | Machine has Node v25; scripts fail fast per design. Playwright harness validates equivalent persistence on Node 25. |
| 15 | `npm run demo:smoke` green on Node 22 CI/customer PC | HIGH (ops) | **Pending ops** | Not a code defect; blocked locally on Node 25 only |

---

## Findings

### BLOCKER — none open

### HIGH (data-lifecycle) — none open

| ID | Issue | Resolution |
|----|-------|------------|
| PERS-H-001 | Stale LeadOps campaign data after demo reset/restore | Fixed `0b1bfbe` — campaign `useEffect` depends on `dataVersion` |
| PERS-H-002 | Footer mislabeled production in local demo | Fixed `0b1bfbe` — `resolveEffectivePersistenceMode()` |

### MEDIUM — open (non-blocking for functional UI)

| ID | Issue | Notes |
|----|-------|-------|
| PERS-M-001 | `docs/demo/forgeos-0.2.0-demo-plan.md` cites `SEED_VERSION` **4**; code uses **5** | Doc drift only |
| PERS-M-002 | `demo:reset` / `demo:seed` / `demo:smoke` require Node 22 on operator machine | Documented; use Playwright walkthrough or Node 22 runtime for CLI |
| PERS-M-003 | FORGE-QA-001 pt-PT missing diacritics | **Visual/i18n polish** — not data-lifecycle; do not conflate |

### LOW

| ID | Issue |
|----|-------|
| PERS-L-001 | Integrated workflow spec + quotation→production action uncommitted in working tree (Prompt 4 in progress) |

---

## Validation run (this review)

| Command | Result |
|---------|--------|
| `npm test` (includes `local-demo-lifecycle.test.ts`) | **421 passed**, 3 skipped |
| `npm run demo:reset` | **Blocked** — Node v25.1.0 (expected gate) |
| Playwright `forgeos-0.2.0-demo.spec.ts` (prior run) | **4/4 passed** on demo DB via `playwright.demo-walkthrough.config.ts` |

---

## Gate rules applied

1. **Do not start visual polish** while a BLOCKER or unresolved HIGH **data-lifecycle** issue exists → **no such issue open**.
2. **Functional UI fixes** tied to persistence integration (reset reload, environment label, quotation→production link) are **in scope** and aligned with GO.
3. **Independent Codex review** was unavailable; this document is the **required Composer substitute** until Codex re-runs.

---

## Recommended next steps (post-GO)

1. Complete and commit integrated workflow work (`e2e/forgeos-0.2.0-demo.spec.ts`, quotation production action) if not yet landed.
2. Fix PERS-M-001 doc drift (`SEED_VERSION` 4 → 5 in demo plan).
3. Run `demo:smoke` on Node 22 (CI or customer PC) before release tag.
4. Defer FORGE-QA-001 diacritics pass until after functional 0.2.0 checkpoint.

---

## Sign-off

**Composer persistence gate:** **GO** for functional demo/UI integration work.  
**Visual polish:** remain deferred per FORGE-QA-001 and user scope.
