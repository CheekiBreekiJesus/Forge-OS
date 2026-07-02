# Send Job Persistence

Date: 2026-07-02

## Durable Tables (Draft — Do Not Apply In Production Without Review)

Migration `202607020002_outreach_send_jobs.sql` adds:

- `outreach_send_jobs`
- `outreach_send_job_recipients`
- `outreach_send_job_attempts`
- `outreach_send_job_daily_usage`
- `public.acquire_outreach_send_job_lock` RPC draft

**Unresolved:** UUID primary keys vs ForgeOS canonical string IDs (`createRecordId("osj")` locally).

## Local Projection (Working)

IndexedDB mirrors the typed model:

- `outreachSendJobs`
- `outreachSendJobRecipients`
- `outreachSendJobAttempts`
- `outreachSendJobDailyUsage`

Included in backup export/import. Suitable for demos, unit tests, and Playwright — **not** production authority.

## Security Boundary

- Supabase tables: RLS enabled, `service_role` grants only (draft).
- No production Supabase repository implementation in this checkpoint.
- Client UI must not import server-only modules or service-role credentials.

## Codex Tasks

1. Align schema IDs with platform ID strategy.
2. Implement server-only repository.
3. Harden lock RPC and add integration tests against Postgres.
