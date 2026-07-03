# Send Job Persistence

Date: 2026-07-03

## Durable Tables

Migration `202607020002_outreach_send_jobs.sql` adds:

- `outreach_send_jobs`
- `outreach_send_job_recipients`
- `outreach_send_job_attempts`
- `outreach_send_job_daily_usage`
- `public.acquire_outreach_send_job_lock`
- `public.increment_outreach_send_job_daily_usage`

Supabase durable IDs are UUIDs. Current local MVP entity IDs are stored as text references such as `campaign_ref`, `campaign_recipient_ref`, and `lead_ref`. Server-side sync code must treat those as external references, not database primary keys.

## Server-Only Store

`src/features/email-delivery/durable-outreach-store.ts` includes server-only REST helpers for:

- creating durable send jobs;
- creating send-job recipients;
- creating send-job attempts with idempotency conflict handling;
- acquiring a database lease lock through RPC;
- releasing a lock with owner matching;
- incrementing real-send daily usage through RPC.

The helper uses `SUPABASE_URL` and server-only `SUPABASE_SERVICE_ROLE_KEY`. It must not be imported by client components.

## Hosted Runtime Projection

Migration `202607030001_outreach_hosted_runtime_projection.sql` adds the minimal approved campaign projection required by the server mutation service:

- `outreach_hosted_campaigns`
- `outreach_hosted_campaign_recipients`
- `outreach_hosted_activity_events`

`src/features/email-delivery/hosted-send-job-repositories.ts` maps those projection tables and the durable send-job tables into the existing service interfaces. The adapter is server-only and uses service-role credentials after route-level Supabase Auth and tenant-membership checks.

## Local Projection

IndexedDB mirrors the typed model:

- `outreachSendJobs`
- `outreachSendJobRecipients`
- `outreachSendJobAttempts`
- `outreachSendJobDailyUsage`

Local projection data is included in backup export/import. It is suitable for demos, unit tests, and Playwright coverage. It is not production authority for real sends.

## Security Boundary

- Supabase tables have RLS enabled and `service_role` grants only.
- The REST helper is server-only and covered by mocked fetch tests.
- Trusted production mutation routes are still not implemented.
- Client UI must not import server-only modules or service-role credentials.

## Remaining Tasks

1. Add an explicit local-to-hosted campaign preparation route and UI action.
2. Add integration tests against a real Postgres/Supabase project before applying the migration.
3. Add a trusted multi-tenant selector for users with more than one active membership.
