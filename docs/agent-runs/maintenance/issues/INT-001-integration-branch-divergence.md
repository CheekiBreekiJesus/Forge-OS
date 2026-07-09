# INT-001 — Integration branch diverged from main

| Field | Value |
|-------|-------|
| ID | INT-001 |
| Severity | Medium |
| Confidence | Confirmed |
| Classification | architectural mismatch / integration deferment |
| First seen | 2026-07-09 (prior maintenance runs) |
| Last updated | 2026-07-09T07:05:08Z |
| Owner | orchestrator |

## Problem

`origin/integration/jh-gomes-release-candidate` has diverged from `main`:

- Merge base: `86d5bd277a37ea0dbbd9fdae11611f3154e8a048`
- 66 commits on integration not in `main`
- 64 commits on `main` not in integration

Recent `main` merges (product import MVP, mobile barcode, inventory RPC hardening) are absent from the integration branch. Integration branch contains CI/Playwright bootstrap fixes and release-candidate validation not yet on `main`.

## Evidence

```bash
git merge-base main origin/integration/jh-gomes-release-candidate
# 86d5bd277a37ea0dbbd9fdae11611f3154e8a048

git rev-list --count main..origin/integration/jh-gomes-release-candidate
# 66

git rev-list --count origin/integration/jh-gomes-release-candidate..main
# 64
```

Recent integration-only commits:
- `3507986` fix(ci): make Playwright pretest wrapper valid JavaScript
- `94ab9e3` fix(ci): bootstrap auth stub and cross-platform Playwright prep
- `915f672` docs(checkpoint): record JH Gomes release candidate

Recent main-only commits (sample):
- `ced4fd4` merge: integrate product data import MVP into main
- `c25e534` merge: integrate mobile barcode inventory MVP into main

## Operational risk

Release-candidate validation on the integration branch does not reflect current `main` capabilities. Merging either direction without reconciliation risks losing migrations, CI fixes, or feature wiring.

## Recommended action

1. Orchestrator decides target integration strategy (rebase RC onto `main` or merge `main` into RC).
2. Run full `npm run validate` on reconciled branch.
3. Do not auto-merge during maintenance runs.

## Repair decision

**Escalate** — out of maintenance scope.
