# MAINT-NPM-AUDIT — 4 npm advisories

| Field | Value |
|-------|-------|
| Status | Open (deferred) |
| Severity | Low |
| Confidence | Confirmed |
| Classification | pre-existing |
| Last updated | 2026-07-10T03:05Z |

## Summary

`npm ci` reports 4 vulnerabilities (2 moderate, 2 high) in transitive dependencies. Triage documented on `chore/dependency-audit-triage` branch.

## Reproduction

```bash
npm audit
```

## Recommended action

Merge audit triage branch or run dedicated dependency update when approved. Do not `npm audit fix --force` without review.

## Owner

Orchestrator / security chore
