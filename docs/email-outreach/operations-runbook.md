# Outreach Sending Operations Runbook

Date: 2026-07-03

## Local Simulation Workflow

1. Open a campaign detail page.
2. Generate and approve campaign drafts.
3. Confirm the campaign status is approved.
4. Click `Queue simulation`.
5. Click `Process next batch`.
6. Inspect job counters and recipient statuses.
7. Pause, resume, or cancel unsent recipients as needed.

This workflow uses IndexedDB and a no-network simulation provider.

## Hosted Durable Store Prerequisites

Before hosted send-job processing:

- review and apply `202607020002_outreach_send_jobs.sql`;
- configure `SUPABASE_URL`;
- configure server-only `SUPABASE_SERVICE_ROLE_KEY`;
- keep the service-role key out of all client bundles and logs;
- wire the production auth/session adapter for send-job actor context;
- wire hosted server repositories for campaign and send-job data;
- run Supabase/Postgres integration tests for lock acquisition and daily usage increments.

Step 7C route boundaries exist for queue/process/pause/resume/cancel/retry/status, but default hosted execution remains blocked until the prerequisites above are complete.

## Hosted Brevo Prerequisites

Before Step 9 or any real email:

- configure `FORGEOS_PUBLIC_BASE_URL`;
- configure `OUTREACH_UNSUBSCRIBE_SECRET`;
- configure `BREVO_WEBHOOK_SECRET`;
- configure Brevo sender values;
- enable the explicit real-send feature flag;
- verify webhook routing and suppression sync;
- run a one-recipient internal pilot only after explicit approval.

## Recovery

Completed attempts are preserved, stale locks expire, cancelled jobs keep sent history, and restart does not automatically resume a job. Operators must explicitly process the next eligible batch.
