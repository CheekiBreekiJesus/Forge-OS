# MAINT-NPM-AUDIT — deferred npm security advisories

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Confidence** | Confirmed |
| **Classification** | Pre-existing |
| **First seen** | 2026-07-10T07:04Z (run `bc-b081186a`) |
| **Last confirmed** | 2026-07-10T08:05Z (run `bc-0a348aea`) |
| **Status** | Open |

## Problem

`npm ci` reports 4 vulnerabilities (2 moderate, 2 high) in transitive dependencies. `npm audit fix --force` would require breaking changes.

## Evidence

```bash
npm ci
# 4 vulnerabilities (2 moderate, 2 high)
```

## Operational risk

Low for local development; triage separately before production deployment.

## Recommended action

Dedicated dependency-security work package; do not `audit fix --force` during hourly maintenance.

## Ownership

Main orchestrator / `chore/dependency-audit-triage` branch owner
