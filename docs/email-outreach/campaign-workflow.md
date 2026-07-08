# Campaign Workflow

## Statuses

`draft` → `ready_for_review` → `approved` → `in_progress` → `completed` (plus `paused`, `cancelled`).

Derived from recipient states; ForgeOS does not confirm delivery.

## Steps

1. Filter or select leads on LeadOps dashboard.
2. Create campaign with segment definition.
3. Save subject/body templates (PT default available).
4. Generate deterministic drafts per included recipient.
5. Review unsafe drafts (missing email, unresolved variables, missing opt-out, suppression).
6. Approve individually or bulk-approve safe drafts only.

## Recipient states

`PENDING`, `DRAFTED`, `NEEDS_REVIEW`, `APPROVED`, `EXCLUDED`, `OPENED_EXTERNALLY`, `SENT_MANUALLY`, `SKIPPED`, `SUPPRESSED`.

## Progress panel

Campaign detail shows counts for drafted, needs review, approved, opened externally, manually sent, excluded, suppressed, skipped.

## Refresh

Refreshing campaign recipients invalidates prior approvals and records a reason.

## Export

Campaign review CSV export uses formula-safe escaping; suppression list is excluded by default.
