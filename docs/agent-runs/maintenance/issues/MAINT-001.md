# MAINT-001 — `chore/dependency-audit-triage` not integrated

| Field | Value |
|-------|-------|
| **ID** | MAINT-001 |
| **Severity** | Medium |
| **Confidence** | Confirmed |
| **Classification** | intentional deferment / missing integration |
| **First seen** | 2026-07-10T14:01Z |
| **Last confirmed** | 2026-07-10T17:05Z |
| **Owner** | orchestrator / security agent |

## Summary

Branch `origin/chore/dependency-audit-triage` @ `24c7f3d` contains OAuth foundation, local Supabase config, DB seed/FK fixes, and dependency audit triage docs. Not merged to `main`.

## Evidence

```bash
git log main..origin/chore/dependency-audit-triage --oneline
```

Key commits:

- `24c7f3d` docs(security): triage dependency audit findings
- `cf97561` feat(auth): add Supabase OAuth foundation
- `213dc3e` chore(supabase): add local development configuration
- `b14386c` fix(seed): include tenant_key in demo tenant seed
- `9b8d709` fix(db): repair send-attempt FK order and idempotency claim

## Operational risk

- OAuth and DB fixes remain unavailable on `main`.
- Dependency audit findings documented but not actioned on integration branch.

## Recommended action

Review and merge when auth/OAuth work is approved; run full Supabase integration tests after merge.

## Repair decision

**Escalate** — architectural/auth scope; not a maintenance repair.
