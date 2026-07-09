# MAINT-LOCAL-MAIN-STALE

| Field | Value |
|-------|-------|
| **Status** | open |
| **Severity** | Low |
| **Classification** | environmental |
| **First seen** | 2026-07-09T08:06Z |
| **Last confirmed** | 2026-07-09T08:06Z |

## Problem

Local git ref `main` points to `ced4fd4` while `origin/main` is at `fcdff2f` (20 commits ahead). The active worktree branch matches `origin/main`.

## Operational risk

Low. Developers or scripts checking out local `main` without `git pull` may work on stale code. Does not affect remote or cloud agent worktrees on the maintenance branch.

## Recommended action

```bash
git checkout main && git pull origin main
```

## Maintenance runs

- 2026-07-09-0800: confirmed, no repair (git ref update out of maintenance scope)
