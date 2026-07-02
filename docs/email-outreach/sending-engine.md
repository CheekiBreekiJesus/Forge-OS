# Outreach Sending Engine

Date: 2026-07-02
Status: Local simulation working; production incomplete

## Flow

```text
approved campaign
-> eligibility evaluation
-> explicit queue confirmation (QUEUE SIMULATION | QUEUE BREVO)
-> send job + recipient snapshots
-> process one bounded batch (local lock)
-> attempts persisted immediately
-> pause | resume | cancel | complete
```

## Fully Working (Local Simulation)

- Only approved campaign recipients can be queued.
- Deterministic idempotency keys per recipient/content version.
- One processing call handles at most `batchSize` recipients.
- Suppression rechecked immediately before each send.
- Accepted attempts are not sent again on repeated processor calls.
- Retryable failures move to `RETRY_PENDING` with deferred `nextAttemptAt`.
- Permanent failures move to `FAILED`.
- Paused and cancelled jobs do not process new recipients.
- Simulation does not consume Brevo daily allowance.

## Draft Or Incomplete (Production)

- Durable Supabase job store as authority.
- Server-side batch invocation (cron/worker/route).
- Brevo real-send batch mode.
- Trusted tenant enforcement on mutations.

## UI Boundary

Campaign detail exposes **simulation only**. Controls are labeled local simulation; production durable store is marked incomplete; Brevo campaign buttons are absent.

## Key Files

- `src/application/campaign-send-job-service.ts`
- `src/components/leadops-campaign-detail-shell.tsx`
- `src/persistence/indexeddb/send-job-repositories.ts`
