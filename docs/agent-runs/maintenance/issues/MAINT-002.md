# MAINT-002 — npm audit dependency vulnerabilities

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Confidence** | Confirmed |
| **Classification** | Pre-existing |
| **First seen** | 2026-07-10T18:01 UTC |
| **Last seen** | 2026-07-10T18:01 UTC |
| **Status** | Open (informational) |

## Summary

After `npm ci`, `npm audit` reports 4 vulnerabilities (2 moderate, 2 high) in transitive dependencies.

## Evidence

```
4 vulnerabilities (2 moderate, 2 high)
```

## Related work

Remote branch `origin/chore/dependency-audit-triage` contains triage documentation and may address some findings.

## Operational consequence

No confirmed runtime exploit in ForgeOS application code during this maintenance cycle.

## Recommended owner

Orchestrator / dependency security agent

## Next action

Review `chore/dependency-audit-triage` and schedule bounded dependency updates outside hourly maintenance.
