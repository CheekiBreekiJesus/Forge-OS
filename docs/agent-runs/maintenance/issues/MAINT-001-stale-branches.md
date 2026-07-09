# MAINT-001 — Stale remote branches superseded by main

| Field | Value |
|-------|-------|
| ID | MAINT-001 |
| Severity | Low |
| Confidence | High |
| Classification | Pre-existing / informational |
| First seen | 2026-07-09T20:00-forgeos-hourly |
| Last updated | 2026-07-09T20:00-forgeos-hourly |
| Status | Open (orchestrator action) |

## Problem

Multiple remote branches retain commits not merged via their tip, but `main` @ `e7f35c7` has superseding integration history. This creates noise during branch-consistency checks.

## Affected branches (sample)

| Branch | Commits not in main | Main commits ahead | Likely status |
|--------|--------------------|--------------------|---------------|
| `origin/feat/email-outreach-live-mvp` | 0 | 139 | Superseded |
| `origin/feat/cup-customizer-integration` | 11 | 90 | Mostly superseded (customizer on main) |
| `origin/integration/jh-gomes-release-candidate` | 66 | 90 | Stale convergence branch |
| `origin/chore/dependency-audit-triage` | 5+ | 90 | Docs/triage; xlsx fix on main |
| `origin/integration/dependency-security-*` | varies | 90 | Remediation merged via main |

## Evidence

```bash
git fetch --prune
git log --oneline main..origin/feat/cup-customizer-integration
git log --oneline origin/feat/cup-customizer-integration..main | wc -l
```

## Operational risk

Low — no missing capability identified on `main` for outreach or hardening paths. Risk is developer confusion during future merges.

## Recommended action

Orchestrator: archive (`origin/archive/*` pattern already used) or add branch labels; do not auto-merge without explicit authorization.

## Repair decision

Out of maintenance scope — report only.
