# Email Outreach Status - Step 7 Recovery Checkpoint

Date: 2026-07-03
Branch: `feat/email-outreach-send-jobs`
Base: `9cf9936`

## Step 7 Checkpoint Status

Local simulation send jobs are working and tested. A server-only Supabase durable store is prepared for hosted send-job persistence, but production sending is not enabled.

## Working

- [x] Send-job domain model.
- [x] Local IndexedDB projection persistence.
- [x] Queue eligibility and idempotent job creation.
- [x] Bounded batch processing with local locks.
- [x] Pause, resume, cancel, retry limits.
- [x] Simulation UI on campaign detail.
- [x] Step 8 provider-event compatibility.
- [x] Supabase migration for send jobs, recipients, attempts, daily usage, lock RPC, and usage increment RPC.
- [x] Server-only Supabase REST helper for durable send-job writes and RPC calls.
- [x] Focused unit and Playwright tests.

## Not Enabled

- [ ] Trusted server mutation routes.
- [ ] Auth-derived tenant context for send mutations.
- [ ] Hosted Supabase migration application.
- [ ] Postgres/Supabase integration tests.
- [ ] Brevo campaign batch sending.
- [ ] Real campaign email sends.

## Schema

IndexedDB is extended with send-job tables in `src/persistence/db.ts`.

Supabase migration `202607020002_outreach_send_jobs.sql` is present but not applied by this work.

## Next Steps

1. Add authenticated server routes or worker entrypoints for queue/process/pause/resume/cancel.
2. Derive tenant and actor from trusted auth/session state.
3. Run migration/RPC validation against Supabase/Postgres.
4. Keep Brevo real-send campaign processing blocked until Step 9 approval.
