# MAINT-INT-DEP-AUDIT-001 — Dependency audit triage branch not on main

| Field | Value |
|-------|-------|
| **Status** | open |
| **Severity** | Low |
| **Confidence** | Moderate |
| **Classification** | intentional deferment |
| **First seen** | 2026-07-09T18:05Z (run `bc-0e021698`) |
| **Last seen** | 2026-07-09T18:05Z |

## Evidence

```bash
git log --oneline origin/main..origin/chore/dependency-audit-triage
```

```
24c7f3d docs(security): triage dependency audit findings
cf97561 feat(auth): add Supabase OAuth foundation
213dc3e chore(supabase): add local development configuration
```

`main` already includes xlsx removal and ExcelJS migration from the 0.2.0 hardening wave. This branch adds OAuth foundation and audit documentation not yet on `main`.

## Operational consequence

No immediate regression on `main`. npm audit reports 4 vulnerabilities (2 moderate, 2 high) in transitive deps — triage docs on branch may inform remediation.

## Recommended action

Orchestrator to review `chore/dependency-audit-triage` for OAuth foundation and security doc integration when auth activation is scheduled.

## Repair decision

Not repaired by maintenance — merge requires orchestrator authorization and auth-scope review.
