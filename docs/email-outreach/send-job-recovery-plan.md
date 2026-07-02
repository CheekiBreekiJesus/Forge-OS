# Send Job Recovery Plan

Date: 2026-07-02
Status: WIP checkpoint — local simulation working, production incomplete

## Current Architecture

ForgeOS outreach runs a local-first campaign workflow backed by IndexedDB repositories. Step 8 added server-only Supabase REST persistence for public unsubscribe suppressions and provider webhook events.

Step 7 recovery adds send-job domain types, local IndexedDB projections, application services, UI simulation controls, backup metadata, and a Supabase migration **draft**. Production server routes and Supabase repositories are **not** implemented.

## Existing Entities

- `OutreachCampaign`, `CampaignRecipient`, `OutreachSendAttempt`, `EmailSuppression`, `OutreachProviderEvent` (unchanged roles).
- **New local projections:** `OutreachSendJob`, `OutreachSendJobRecipient`, `OutreachSendJobAttempt`, `OutreachSendJobDailyUsage`.
- **New migration draft:** `202607020002_outreach_send_jobs.sql`.

## Implemented In This Checkpoint

- [x] Send-job domain types (`src/domain/send-job-types.ts`).
- [x] IndexedDB repositories and schema extension.
- [x] Queue eligibility evaluation.
- [x] Idempotent job creation.
- [x] Bounded batch processing with local lock TTL.
- [x] Suppression recheck before send.
- [x] Retry classification and max retry enforcement.
- [x] Pause, resume, cancel.
- [x] Simulation provider boundary (no network).
- [x] Step 8 provider-event reconciliation compatibility.
- [x] Campaign detail simulation UI with honest production-incomplete labeling.
- [x] Focused unit and Playwright tests.
- [x] Backup export/import for send-job tables.

## Still Missing For Production

- [ ] Canonical ID strategy alignment (UUID vs ForgeOS string IDs).
- [ ] Production Supabase send-job repository.
- [ ] Atomic lock RPC hardening with tenant-safe server execution.
- [ ] Trusted server routes for queue/process/pause/resume/cancel.
- [ ] Brevo campaign batch processing behind server boundary.
- [ ] Migration application in hosted environment.
- [ ] Deployment and authorized real sends.

## Selected Persistence Model

| Mode | Authority |
|------|-----------|
| Local simulation / tests | IndexedDB projections |
| Production real send jobs | Supabase tables (draft migration only) |
| Public unsubscribe / webhooks | Existing Step 8 Supabase tables |

## Codex Resume Tasks

1. Decide and implement ID mapping between Supabase UUIDs and ForgeOS string IDs.
2. Create `src/persistence/supabase/*` send-job repository with service-role access only.
3. Review and harden `acquire_outreach_send_job_lock` (security definer, tenant guard, tests).
4. Add server routes that derive tenant from session/trusted context — never from raw UI input alone.
5. Connect Brevo provider to server-side batch processor with existing real-send gates.
6. Document and test durable-to-local sync if UI continues to read IndexedDB in pilot.
7. Extend webhook reconciliation to update durable send-job recipient rows.

## Files To Inspect First

1. `src/application/campaign-send-job-service.ts`
2. `src/persistence/indexeddb/send-job-repositories.ts`
3. `supabase/migrations/202607020002_outreach_send_jobs.sql`
4. `src/features/email-delivery/provider-events.ts`
5. `src/components/leadops-campaign-detail-shell.tsx`
