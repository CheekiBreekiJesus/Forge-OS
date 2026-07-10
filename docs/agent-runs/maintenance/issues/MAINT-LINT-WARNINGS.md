# MAINT-LINT-WARNINGS — 13 pre-existing ESLint warnings

| Field | Value |
|-------|-------|
| Status | Open (deferred) |
| Severity | Low |
| Confidence | Confirmed |
| Classification | pre-existing |
| Last updated | 2026-07-10T03:05Z |

## Summary

`npm run lint` passes with 0 errors and 13 warnings (unused vars in outreach, inventory, settings, persistence modules).

## Reproduction

```bash
npm run lint
```

## Recommended action

Low-priority cleanup in a dedicated chore pass. Not blocking validation.

## Owner

Implementation agent (chore)
