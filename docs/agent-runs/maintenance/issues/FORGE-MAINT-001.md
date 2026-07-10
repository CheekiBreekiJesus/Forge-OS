# FORGE-MAINT-001 — dependency-audit-triage branch not in main

| Field | Value |
|-------|-------|
| Status | Open (deferred) |
| Severity | Medium |
| Confidence | Confirmed |
| Classification | intentional deferment |
| First seen | 2026-07-10T01:01Z |
| Last updated | 2026-07-10T03:05Z |

## Summary

Branch `origin/chore/dependency-audit-triage` (@ `24c7f3d`) contains OAuth foundation, local Supabase config, seed fixes, and dependency audit triage docs. Not merged into `main` (`e7f35c7`).

## Evidence

```bash
git log main..origin/chore/dependency-audit-triage --oneline
```

Key commits: OAuth foundation, supabase local config, audit triage docs, outreach hosted send-job integration.

## Operational consequence

Auth OAuth flow and audit documentation unavailable on `main` until merged.

## Recommended action

Orchestrator to schedule merge when auth work is approved. Not a maintenance regression.

## Owner

Orchestrator / auth work package
