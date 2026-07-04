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
- verify the production auth/session adapter can validate Supabase access tokens;
- verify active tenant memberships contain role and permission data;
- prepare approved campaigns into the hosted campaign projection;
- run Supabase/Postgres integration tests for lock acquisition and daily usage increments.

Step 7D2 route boundaries can use hosted repositories when Supabase server credentials are configured. Hosted execution remains simulation-only and should not be considered production-ready until the migrations are validated against a non-production database.

## Hosted Preparation Workflow

1. Authenticate with a Supabase bearer session in a hosted or staging deployment.
2. Open an approved campaign detail page.
3. Select one of the active memberships returned by the trusted tenant selector.
4. Confirm the panel shows approved recipients and zero stale approvals.
5. Click `Prepare for server sending`.
6. Confirm the prepared state shows `Prepared`, prepared timestamp, prepared actor, and hosted audit.
7. Click refresh or reload the page and confirm the prepared state is still available.
8. Click preparation again and confirm the existing snapshot is reused.

This workflow persists an approved campaign projection only. It does not queue or send email.

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

## Staging Migration Validation

The Supabase CLI is not installed in the current local environment and no staging credentials are stored in Git. Before production use, run the migrations against a local or dedicated non-production Supabase/Postgres database and verify:

```bash
npm run outreach:hosted:migration:check
npm run test -- src/features/email-delivery/outreach-migration-static.test.ts
npx supabase db reset --local
```

For approved staging only:

```bash
npx supabase link --project-ref <non-production-project-ref>
npx supabase db push --linked
```

Do not apply the migrations to production until the lock RPC, lock release, idempotency constraints, daily usage increment, grants, and RLS assumptions are verified.

## Step 9 Real-Send Gate

Brevo campaign batch sending, SMTP sending, background workers, and automatic hosted processing remain disabled until Step 9 receives explicit approval. Staging validation for Step 7D2 must use simulation provider behavior only.
