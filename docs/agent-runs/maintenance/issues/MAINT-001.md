# MAINT-001 — dependency-audit-triage branch not integrated

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Confidence** | High |
| **Classification** | Incomplete implementation |
| **First seen** | 2026-07-09T16:01Z (run `bc-3e95ca35`) |
| **Status** | Open |

## Problem

Branch `chore/dependency-audit-triage` (tip `24c7f3d`) contains work not present on `main`, including:

- Supabase OAuth foundation (`cf97561`)
- Local supabase configuration (`213dc3e`)
- Send-attempt FK and idempotency fixes (`9b8d709`, `a87b139`)
- Security audit triage documentation (`24c7f3d`)

## Evidence

```bash
git log main..origin/chore/dependency-audit-triage --oneline
```

## Operational risk

Low until auth activation work begins; DB migration ordering fixes may matter for fresh Supabase resets.

## Recommended action

Orchestrator schedules merge of `chore/dependency-audit-triage` or cherry-picks required migrations before hosted auth pilot.

## Ownership

Auth / platform orchestrator
