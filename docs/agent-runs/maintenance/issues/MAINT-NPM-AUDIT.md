# MAINT-NPM-AUDIT

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Confidence** | Confirmed |
| **Status** | Open (deferred) |
| **Subsystem** | Dependencies |
| **First seen** | 2026-07-09 (run bc-20260709T140232-e5cd) |
| **Last updated** | 2026-07-09T17:06:00Z (run bc-20260709T170259-e8d9) |

## Description

`npm ci` reports 4 vulnerabilities (2 moderate, 2 high) in transitive dependencies.

## Evidence

```
npm ci → 4 vulnerabilities (2 moderate, 2 high)
npm audit fix --force would introduce breaking changes
```

## Operational consequence

Potential security exposure in dev/build toolchain; triage required before broad upgrades.

## Repair decision

Deferred — dependency audit triage is tracked on `origin/chore/dependency-audit-triage`; not a maintenance hotfix.

## Recommended owner

Orchestrator / dedicated dependency triage agent.
