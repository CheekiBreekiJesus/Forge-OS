# MAINT-LINT-WARNINGS

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Confidence** | Confirmed |
| **Status** | deferred |
| **First seen** | 2026-07-09T08:00Z |
| **Last updated** | 2026-07-09T10:04Z |

## Summary

13 ESLint `@typescript-eslint/no-unused-vars` warnings across data-prep scripts, outreach services, settings shell, inventory API client, and persistence modules. Zero errors; does not block CI.

## Repair decision

Deferred — cosmetic cleanup, not a regression. Requires owning agent judgment on whether variables should be removed or used.
