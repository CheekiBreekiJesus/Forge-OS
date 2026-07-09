# ForgeOS 0.2.0 Hardening — Merge Readiness

## Status: MERGE-READY (with non-blocking limitations)

**Branch:** `integration/forgeos-0.2.0-hardening`  
**Tip:** `de85abc` (+ docs commit pending)

## Acceptance matrix

| Criterion | Status |
|-----------|--------|
| Clean working tree (excl. generated) | PASS |
| Lint 0 new errors | PASS |
| TypeScript | PASS |
| Unit tests | PASS (485) |
| Supabase integration | PASS (17) — requires local Postgres + auth stub |
| Critical inventory E2E | PASS (20 focused) |
| Tenant isolation | PASS (unit + integration + RPC migration) |
| Demo mode | PASS (unit tests) |
| xlsx removed | PASS |
| CI gates main | PASS (workflow) |
| Cup customizer | PASS (stabilization + E2E); non-blocking for security merge |

## Branch protection

Require GitHub status check: **Core validation** (`validate-core` job).

## Rollback

Revert integration branch merge commit; migrations are additive (`202607091300_inventory_rpc_tenant_guards.sql`).

## Push

```bash
git push -u origin integration/forgeos-0.2.0-hardening
```
