# Outreach Sending Engine

Date: 2026-07-03
Status: Local simulation working; server-only durable store prepared; production sending disabled

## Flow

```text
approved campaign
-> eligibility evaluation
-> explicit queue confirmation
-> send job + recipient snapshots
-> process one bounded batch
-> persist attempts immediately
-> pause | resume | cancel | complete
```

## Working In Local Simulation

- Only approved campaign recipients can be queued.
- Deterministic idempotency keys are generated per recipient/content version.
- One processing call handles at most `batchSize` recipients.
- Suppression is rechecked immediately before each send.
- Accepted attempts are not sent again on repeated processor calls.
- Retryable failures move to `RETRY_PENDING` with deferred `nextAttemptAt`.
- Permanent failures move to `FAILED`.
- Paused and cancelled jobs do not process new recipients.
- Simulation does not consume Brevo daily allowance.

## Durable Store Prepared

The Supabase migration and server-only REST helper cover:

- jobs;
- job recipients;
- attempts;
- real-send daily usage;
- lock acquisition through RPC;
- lock release with owner matching;
- atomic daily usage increments.

## Still Disabled

- Browser UI does not expose Brevo campaign batch controls.
- No trusted server route processes real campaign batches.
- No hosted migration was applied in this task.
- No real email was sent.

## Key Files

- `src/application/campaign-send-job-service.ts`
- `src/features/email-delivery/durable-outreach-store.ts`
- `src/components/leadops-campaign-detail-shell.tsx`
- `src/persistence/indexeddb/send-job-repositories.ts`
- `supabase/migrations/202607020002_outreach_send_jobs.sql`
