# Draft Review, Approval, and Manual Send (Step 4)

## Reused from lead-detail workflow

| Capability | Source |
|------------|--------|
| Gmail / Outlook / mailto URL builders | `src/features/email-composition/copy.ts` |
| Copy subject / plain / formatted / full | `EmailCopyActions` in `leadops-email-composer.tsx` |
| Queue / suppression guards | `validateQueue()` in `workflow.ts` |
| Sendability evaluation | `evaluateSendability()` in `sendability.ts` |
| Simulation semantics | `simulateSend()` — no external request, distinct from manual sent |

## Campaign recipient workflow

1. Generate drafts (Step 3) → `DRAFTED` or `NEEDS_REVIEW`
2. Review and approve safe drafts → `APPROVED` with content hash + timestamp
3. Open Gmail / Outlook / default client → `OPENED_EXTERNALLY` (not sent)
4. Operator sends manually outside ForgeOS
5. Confirm “Mark as sent externally” → `SENT_MANUALLY`, outreach history, `lastContactedAt`

## Approval rules

Approval requires: valid email, not suppressed, draft subject/body, no unresolved variables, sender identity from Settings, opt-out instruction in body, operational campaign status.

Bulk approval skips unsafe recipients and returns per-recipient reasons.

## Invalidation

Edits to subject, body, template, sender, or recipient email invalidate approval. Recipient refresh invalidates campaign-level approvals. Reason stored on recipient row.

## Duplicate protection

Blocks duplicate sends for the same campaign recipient. Warns on recent contact cooldown (7 days). Suppression always blocks without override except documented manual override with reason + audit event.

## Campaign statuses

`draft` → `ready_for_review` → `approved` → `in_progress` → `completed`, with `paused` and `cancelled` available. Derived from recipient state counts; ForgeOS never claims delivery confirmation.

## Simulation

Simulation uses approved content, creates a marked simulated attempt, does not update real `lastContactedAt`, and never sets `SENT_MANUALLY`.
