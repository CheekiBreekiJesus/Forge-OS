# Step 2 Baseline — Lead Segmentation

**Worktree:** `Forge-OS-outreach`  
**Branch:** `feat/email-outreach-live-mvp`  
**Starting commit:** `044ebc0`  
**Date:** 2026-07-01

## Preflight

| Check | Result |
|-------|--------|
| Correct worktree | Yes |
| Correct branch | `feat/email-outreach-live-mvp` |
| Clean working tree | Yes |

## Step 1 assets reused

- `Lead`, `LeadContact`, `ImportBatch` entities and repositories
- LeadOps dashboard with search + 5 filters + row selection
- Import wizard on dashboard
- Campaign seed data (4 demo campaigns, read-only repo)
- Consent/bounce queue rules in `workflow.ts`
- Backup v3 (leads, campaigns, import batches)

## Gaps addressed in Step 2

1. Extended lead-management columns and filters
2. Canonical sendability evaluator with explicit exclusion reasons
3. Extended campaign model with segment definition + recipient snapshots
4. Segment builder from filters/selection
5. Explicit recipient refresh for draft campaigns
6. Campaign list and detail routes
7. Backup/restore for campaign recipients
8. Demo reset preserves operational campaigns
