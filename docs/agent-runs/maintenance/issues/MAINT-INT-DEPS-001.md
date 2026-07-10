# MAINT-INT-DEPS-001 — Transitive dependency audit findings

| Field | Value |
|-------|-------|
| **Status** | open |
| **Severity** | Low |
| **Confidence** | Confirmed |
| **Classification** | intentional deferment |
| **First seen** | 2026-07-10T02:04Z (run `bc-65f8b9f4`) |
| **Last seen** | 2026-07-10T02:04Z |

## Evidence

```bash
npm ci
# npm audit reports 4 vulnerabilities (2 moderate, 2 high)
```

Related branch: `origin/chore/dependency-audit-triage` (`24c7f3d`) — not merged to `main`.

## Operational consequence

No immediate build or test failure. Potential security exposure in transitive dependencies.

## Recommended action

Orchestrator to review `chore/dependency-audit-triage` and schedule bounded dependency updates outside maintenance scope.

## Repair decision

Not repaired by maintenance — dependency upgrades require orchestrator authorization.
