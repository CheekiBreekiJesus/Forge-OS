# MAINT-INT-OUTREACH-001 — Outreach operational readiness not on main

| Field | Value |
|-------|-------|
| **Status** | open |
| **Severity** | Low |
| **Confidence** | Confirmed |
| **Classification** | incomplete implementation / intentional deferment |
| **First seen** | 2026-07-09T11:02Z (run `bc-aab6ca65`) |
| **Last seen** | 2026-07-09T11:02Z |

## Evidence

```bash
git log --oneline HEAD..origin/integration/outreach-operational-readiness
```

```
84bef14 fix(outreach): satisfy set-state-in-effect lint on hosted send panel mount
f593d05 docs(outreach): update UI audit for hosted send panel
7215830 feat(outreach): hosted send panel and durable server queue UI
b54a5bd feat(outreach): operational readiness — UI fixes and gated real_send plumbing
```

Merge base with `origin/main` (`fcdff2f`): same tip — branch is a linear extension.

## Operational consequence

Hosted send panel and durable server queue UI are not available on `main` until merged.

## Recommended action

Orchestrator to schedule merge of `integration/outreach-operational-readiness` with focused validation (`npm run lint`, `npm test`, outreach integration tests).

## Repair decision

Not repaired by maintenance — merge requires orchestrator authorization.
