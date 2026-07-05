# Composer persistence review — second pass

**Date:** 2026-07-05  
**Branch:** `release/forgeos-0.2.0-local-demo`  
**HEAD at review start:** `a1acf5cb8c44e54654fc8fad3ea1fbef81e7996e`  
**Reviewer:** Composer (evidence-driven second pass; Codex unavailable)  
**Baseline:** `qa/demo/composer-persistence-review-baseline.md`

## Decision

**GO WITH CONDITIONS**

Persistence and data lifecycle are safe enough to continue UI stabilization. Remaining conditions are operational (Node 22 CLI) and documented restore-warning behavior — no open BLOCKER or HIGH data-loss defects after fixes in this review.

---

## Finding table

| ID | Severity | File | Behavior | Risk | Fix | Test | Status |
|----|----------|------|----------|------|-----|------|--------|
| PERS-2-001 | **HIGH** | `backup/service.ts` | `customerContacts` omitted from backup | Contact loss on restore | Export/import `customerContacts` | `local-demo-lifecycle.test.ts` | **RESOLVED** |
| PERS-2-002 | **HIGH** | `backup/service.ts` | `importBackup` reset outside import transaction | Empty DB on partial failure | Atomic clear+import in `importBackupToDb` | lifecycle tests | **RESOLVED** |
| PERS-2-003 | **HIGH** | `local-demo-seed-service.ts` | Seed version bump did not overwrite managed rows | Stale demo after upgrade | `bulkPut` when seed version changes | `local-demo-lifecycle.test.ts` | **RESOLVED** |
| PERS-2-004 | **MEDIUM** | `persistence/db.ts` | Duplicate Dexie `version(13)` registration | Skipped v12 migration chain | Split `version(12)` + `version(13)` | `schema-upgrade.test.ts` | **RESOLVED** |
| PERS-2-005 | **MEDIUM** | `backup/service.ts` | Backup lacked provenance metadata | Operator verification harder | `applicationVersion`, `databaseName`, `recordCounts` | lifecycle test | **RESOLVED** |
| PERS-2-006 | **MEDIUM** | `settings-shell.tsx` | Logo blob URLs not revoked | Memory leak | `revokeObjectUrlIfBlob` on replace/unmount | Manual | **RESOLVED** |
| PERS-2-007 | **LOW** | `backup/service.ts` | `validateBackup` accepted dangerous keys | Pollution surface | `hasDangerousBackupKeys` | lifecycle test | **RESOLVED** |
| PERS-2-008 | **LOW** | `demo-data-reference.md` | Doc drift on reseed strategy | Confusion | Updated documentation | N/A | **RESOLVED** |

### Verified safe (no fix required)

| Area | Evidence |
|------|----------|
| Demo-only reset preserves user leads | `resetDemoData` + lifecycle test |
| Full restore clears all data (explicit) | `restoreDeterministicDemoState` + confirm UI |
| `seedDatabase(force=true)` wipes tenant scope | By design for full restore; documented |
| Supabase / production guards | `local-demo-guard.ts` tests |
| Tenant isolation | lifecycle isolation test |
| No GET-triggered destructive ops | Settings button + confirm only |
| Referential integrity on seed data | Builders use stable cross-refs |

### Conditions (non-blocking)

| # | Condition |
|---|-----------|
| 1 | `demo:reset` / `demo:seed` / `demo:smoke` CLI requires **Node 22.x**; use `validate:release` or CI on Node 25 dev machines |
| 2 | `restoreDeterministicDemoState` and `seedDatabase(..., force=true)` intentionally delete **all tenant rows** — distinct from demo-only reset |
| 3 | `validateBackupRestoreIntegrity` reports orphan warnings but does not block import (soft validation) |
| 4 | pt-PT diacritics (FORGE-QA-001) remain visual polish, not persistence |

---

## Dexie schema chain (post-fix)

| Ver | Change |
|-----|--------|
| 1–8 | CRM, profiles, operations, imports, campaigns (unchanged) |
| 11 | Suppressions, send jobs, provider events |
| **12** | `importMappingProfiles` + import batch metadata upgrade |
| **13** | Campaign recipient greeting override fields |

Downgrade: not supported (Dexie). Forward upgrade from v11 databases preserves rows via incremental `.upgrade()` patches.

---

## Validation (this review)

| Command | Result |
|---------|--------|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass (14 pre-existing warnings) |
| `npm test` | **428 passed**, 3 skipped |
| `npm run build` | Pass |
| `demo:reset/seed/smoke` CLI | Blocked on Node v25 (environmental; not code defect) |

---

## Sign-off

**Composer persistence gate (second pass):** **GO WITH CONDITIONS** for UI stabilization.
