# Local demo reset, backup, and restore

Operations for the ForgeOS **0.2.0 local IndexedDB demo**. UI controls live in **Settings → Data and backup**.

## Active database

The active IndexedDB name is shown in Settings and comes from:

- `FORGEOS_LOCAL_DB_NAME` / `NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME`
- Demo default: `forgeos:jhgomes:0.2.0-demo`

## Reset operations

All destructive actions require browser `confirm()`.

| Action | Scope | Preserves user data? |
|--------|-------|---------------------|
| **Reset demo data only** | Managed demo IDs + seed leads/campaigns | Yes — user-created leads/imports kept |
| **Clear all local data** | Entire IndexedDB for this app | No |
| **Restore original demo state** | Clear all → full deterministic reseed (`seedDatabase` with `force=true`) | No — wipes entire tenant in active DB |

**Important:** `restoreDeterministicDemoState` is not the same as **Reset demo data only**. Full restore deletes all tenant rows before reseed.

### CLI / scripts

| Script | Behavior |
|--------|----------|
| `npm run demo:reset` | Deletes demo IndexedDB in browser, reloads, auto-seeds |
| `npm run demo:seed` | Verifies seed via browser navigation (non-destructive) |

## Backup format (v9)

- `version`: `9`
- `schemaVersion`: Dexie schema version (`13`)
- `applicationVersion`: ForgeOS app version (e.g. `0.2.0`)
- `databaseName`: logical IndexedDB name at export time
- `recordCounts`: per-table row counts
- `tenantId`: exported tenant
- `tables`: all local entity tables including `customerContacts`, machines, inventory, stock movements, customizer simulations
- `localAssets` (optional): base64-encoded blobs

## Restore rules

1. `validateBackup()` — structure and required table arrays.
2. `isBackupSchemaCompatible()` — rejects future/incompatible `schemaVersion`.
3. `validateBackupRestoreIntegrity()` — orphan relationship warnings.
4. Atomic `importBackupToDb()` — clear and import inside one Dexie transaction (no orphaned empty DB on failure).
5. Repeat restore replaces rows by ID — no duplicate rows on repeat restore (same IDs replaced).

Rejected cases:

- Malformed JSON
- Missing required tables
- Backup v9 with `schemaVersion < 13` or `> current`
- Supabase mode (lifecycle blocked)

## Security gates

| Gate | Behavior |
|------|----------|
| `FORGEOS_PERSISTENCE_MODE=local` | Required |
| `NODE_ENV=production` | Blocked unless `FORGEOS_DEMO_LIFECYCLE_ENABLED=true` |
| Supabase mode | `LocalDemoLifecycleError` (fail-closed) |

Demo scripts do **not** modify `.env.local`.

## Tests

`src/demo/local-demo-lifecycle.test.ts` covers first seed, repeat seed, reset+seed, backup/restore, malformed backup, incompatible schema, tenant isolation, and guard behavior.
