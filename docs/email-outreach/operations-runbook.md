# Outreach Sending Operations Runbook

Date: 2026-07-02

## Local Simulation Workflow

1. Open a campaign detail page.
2. Ensure drafts are generated and approved.
3. Confirm the campaign status is approved.
4. Click `Queue simulation`.
5. Click `Process next batch`.
6. Inspect job counters and recipient statuses.
7. Pause, resume, or cancel unsent recipients as needed.

## Hosted Brevo Prerequisites

Before Step 9 or any real email:

- apply Supabase migrations;
- configure `SUPABASE_URL`;
- configure server-only `SUPABASE_SERVICE_ROLE_KEY`;
- configure `FORGEOS_PUBLIC_BASE_URL`;
- configure `OUTREACH_UNSUBSCRIBE_SECRET`;
- configure `BREVO_WEBHOOK_SECRET`;
- configure Brevo sender values;
- enable the explicit real-send feature flag;
- verify webhook routing and suppression sync;
- run a one-recipient internal pilot only after explicit approval.

## Recovery

Completed attempts are preserved, stale locks expire, cancelled jobs keep sent history, and restart does not automatically resume a job.
