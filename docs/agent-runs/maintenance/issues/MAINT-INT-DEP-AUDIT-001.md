# MAINT-INT-DEP-AUDIT-001 — Dependency audit triage branch not on main

| Field | Value |
|-------|-------|
| **Status** | open |
| **Severity** | Low |
| **Confidence** | Confirmed |
| **Classification** | intentional deferment |
| **First seen** | 2026-07-09T23:00Z (run `bc-252ea579`) |
| **Last seen** | 2026-07-09T23:00Z |

## Evidence

```bash
git log --oneline main..origin/chore/dependency-audit-triage
```

```
24c7f3d docs(security): triage dependency audit findings
cf97561 feat(auth): add Supabase OAuth foundation
213dc3e chore(supabase): add local development configuration
b14386c fix(seed): include tenant_key in demo tenant seed
9b8d709 fix(db): repair send-attempt FK order and idempotency claim
a87b139 fix(db): order tenant-safe campaign constraints correctly
be31687 merge(outreach): integrate hosted send jobs with supabase release
ab5deaa feat(outreach): complete Step 7D2 hosted campaign preparation
47af013 feat(outreach): add hosted send-job runtime boundary
```

Merge base with `main` (`e7f35c7`): `86d5bd2`.

## Operational consequence

OAuth foundation, dependency audit documentation, and some DB constraint fixes are not on `main`. Outreach hosted send jobs on `main` may have diverged from this branch's DB migration ordering.

## Recommended action

Orchestrator to evaluate whether `chore/dependency-audit-triage` should be rebased and merged, or whether individual fixes should be cherry-picked. Requires auth/OAuth scope approval.

## Repair decision

Not repaired by maintenance — merge requires orchestrator authorization and product scope for OAuth.
