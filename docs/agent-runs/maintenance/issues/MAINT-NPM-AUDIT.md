# MAINT-NPM-AUDIT — npm dependency advisories

| Field | Value |
|-------|-------|
| Status | Open (deferred) |
| Severity | Medium |
| Confidence | Confirmed |
| Last updated | 2026-07-09T14:02Z |

## Problem

`npm ci` reports 4 vulnerabilities (2 moderate, 2 high). Broad dependency upgrades are out of scope for hourly maintenance.

## Recommended action

Triage via `chore/dependency-audit-triage` or dedicated security remediation branch. Do not run `npm audit fix --force` in maintenance.

## Reproduction

```bash
npm audit
```
