# Composer persistence review — baseline capture

**Date:** 2026-07-05 (second pass)  
**Branch:** `release/forgeos-0.2.0-local-demo`  
**Base:** `origin/integration/jh-gomes-release-candidate` @ `3507986`  
**Reviewer:** Composer (evidence-driven second pass; Codex review unavailable)

## Git state at review start

| Item | Value |
|------|-------|
| **HEAD** | `a1acf5cb8c44e54654fc8fad3ea1fbef81e7996e` |
| **Branch** | `release/forgeos-0.2.0-local-demo` |
| **Working tree** | Clean (no modified, staged, or untracked files) |
| **Interrupted Codex artifacts** | None — prior Composer release commit `a1acf5c` is complete; no partial staged work |

## Runtime constants

| Constant | Value |
|----------|-------|
| `SCHEMA_VERSION` | 13 |
| `SEED_VERSION` | 5 |
| `APP_VERSION` | 0.2.0 |
| Demo DB name | `forgeos:jhgomes:0.2.0-demo` |
| Default dev DB | `forgeos:jhgomes:development` |

## Demo lifecycle files

| File | Role |
|------|------|
| `src/demo/local-demo-dataset.ts` | Deterministic IDs and builders |
| `src/demo/local-demo-seed-service.ts` | Apply / reset managed demo records |
| `src/demo/local-demo-lifecycle.test.ts` | Lifecycle unit tests (11 cases) |
| `src/features/demo/local-demo-guard.ts` | Local-only / production gate |
| `src/persistence/indexeddb/repositories.ts` | `seedDatabase`, `resetDemoRecords`, `restoreDeterministicDemoState`, `resetDatabase` |
| `scripts/demo/*.mjs` | CLI prepare/start/reset/seed/smoke |

## Modified persistence files (vs integration base)

| Path | Change |
|------|--------|
| `src/persistence/db.ts` | Unchanged vs base (duplicate v13 already on base) |
| `src/persistence/indexeddb/repositories.ts` | Demo lifecycle wiring, `applyLocalDemoDataset` |
| `src/features/backup/service.ts` | Backup v9 + schemaVersion |
| `src/features/backup/restore-validation.ts` | Integrity warnings |
| `src/persistence/provider.tsx` | Local mode bootstrap |
| `src/domain/constants.ts` | `APP_VERSION`, `DEMO_DB_NAME`, `SEED_VERSION` 5 |

## Relevant test files

| File | Coverage |
|------|----------|
| `src/demo/local-demo-lifecycle.test.ts` | Seed, reset, restore, backup round-trip |
| `src/application/sender-backup.integration.test.ts` | Sender + campaign backup |
| `e2e/forgeos-0.2.0-demo.spec.ts` | Workflow D backup/reset (walkthrough config) |
| `e2e/acceptance/06-backup-reset.spec.ts` | Settings destructive confirmations |

## Prior review artifact

`qa/demo/composer-persistence-review.md` (first pass, pre-release) claimed **GO** without independent Codex verification. This second pass re-audits with code inspection and new tests.

## Dexie version map (summary)

| Ver | Stores / change |
|-----|-----------------|
| 1 | Core CRM + outreach tables |
| 2 | Profiles, products, localAssets |
| 3 | Operations, archivable fields, customerContacts |
| 4 | customizerSimulations, quote simulation fields |
| 5 | Import tables, lead normalization indexes |
| 6 | campaignRecipients, campaign metadata |
| 7 | Campaign templates / draft fields |
| 8 | Campaign status migration, recipient send fields |
| 11 | Suppressions, send jobs, provider events |
| 12 | **(missing — conflated with 13)** importMappingProfiles |
| 13 | Campaign recipient greeting overrides (duplicate block with SCHEMA_VERSION) |

**Note:** `this.version(SCHEMA_VERSION)` and `this.version(13)` both register as version 13 on integration base — requires correction to version 12 + 13 chain.
