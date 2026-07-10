# MAINT-002 — npm audit transitive vulnerabilities

| Field | Value |
|-------|-------|
| Severity | Low |
| Confidence | Confirmed |
| Classification | Intentional deferment |
| First seen | 2026-07-10T12:01Z |
| Last seen | 2026-07-10T13:03Z |
| Status | Open (tracked) |

## Evidence

After `npm ci`:

```
4 vulnerabilities (2 moderate, 2 high)
```

Branch `origin/chore/dependency-audit-triage` exists for dedicated triage.

## Reproduction

```bash
npm audit
```

## Repair decision

Escalated to dependency triage workstream. Not repaired in maintenance — requires approved dependency upgrades.

## Owner

Orchestrator / `chore/dependency-audit-triage` branch owner.
