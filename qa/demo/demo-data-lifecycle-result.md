# Demo data lifecycle validation result

**Date:** 2026-07-05  
**Branch:** `release/forgeos-0.2.0-local-demo`  
**Scope:** Deterministic local demo dataset, reset, backup, restore (Prompt 2)

## Summary

Implemented idempotent demo seeding (`SEED_VERSION=5`), three confirmed reset paths, backup v9 with full table coverage and `schemaVersion`, local-only guards, Settings backup UI extensions, and lifecycle tests.

## Codex boundary findings addressed

| Finding | Resolution |
|---------|------------|
| Local persistence only for demo lifecycle | `local-demo-guard.ts`; Supabase stubs throw |
| No Supabase/OAuth/Brevo in demo | Unchanged; simulation providers only |
| Demo scripts must not edit `.env.local` | Unchanged |
| Node 22 gate in demo scripts | Unchanged from harness |
| Synthetic emails only | `*.example` / `*.invalid` in dataset |
| Tenant isolation | Dataset scoped to `tenant_jh_gomes` |
| Explicit confirmation for destructive actions | `window.confirm` in Settings |
| Schema version in backup/meta | `schemaVersion` in backup v9 + meta keys |

## Validation commands

| Command | Result |
|---------|--------|
| `npm run lint` | Pass (14 pre-existing warnings) |
| `npm run typecheck` | Pass |
| `npm test` | Pass — **428 tests** (second-pass persistence review) |
| `npm run build` | Pass |
| `npm run demo:smoke` | Blocked — system Node v25.1.0; demo requires Node 22.x |

## Second-pass persistence review (2026-07-05)

| Fix | Detail |
|-----|--------|
| Backup `customerContacts` | Export/import round-trip |
| Atomic restore | Clear+import in single Dexie transaction |
| Seed version bump | Overwrite managed demo rows when `SEED_VERSION` changes |
| Dexie v12/v13 chain | Split `importMappingProfiles` (12) from recipient fields (13) |
| Backup metadata | `applicationVersion`, `databaseName`, `recordCounts` |
| Object URL cleanup | Settings logo preview revoke |

**Gate:** `qa/demo/composer-persistence-review.md` — **GO WITH CONDITIONS**

## Test coverage added

- `src/demo/local-demo-lifecycle.test.ts` — seed, idempotency, reset, restore, backup, guards, tenant isolation, customer contacts, seed version overwrite
- `src/features/backup/backup-coverage.test.ts` — Dexie table ↔ backup coverage
- `src/persistence/schema-upgrade.test.ts` — schema version and user-record survival

## Files touched (primary)

- `src/demo/local-demo-dataset.ts`
- `src/demo/local-demo-seed-service.ts`
- `src/features/demo/local-demo-guard.ts`
- `src/persistence/indexeddb/repositories.ts`
- `src/features/backup/service.ts`
- `src/components/settings-shell.tsx`
- `docs/demo/demo-data-reference.md`
- `docs/demo/demo-reset-backup-restore.md`
