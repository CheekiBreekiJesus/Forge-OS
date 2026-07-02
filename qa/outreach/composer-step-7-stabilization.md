# Composer Step 7 Stabilization

Date: 2026-07-02

## Worktree And Branch

| Item | Value |
|------|-------|
| Worktree | `C:\Users\J35U5\Desktop\VS Code\Forge-OS-send-jobs` |
| Branch | `feat/email-outreach-send-jobs` |
| Base commit | `9cf9936` — feat(outreach): add durable unsubscribe and webhook reconciliation |
| Patch backup | `C:\Users\J35U5\Desktop\VS Code\forgeos-send-jobs-interrupted-backup.patch` |

## Changed Files (26)

### Modified (12)

| File | Classification |
|------|----------------|
| `src/application/campaign-send-job-service.ts` | application service |
| `src/components/leadops-campaign-detail-shell.tsx` | UI |
| `src/domain/constants.ts` | domain model |
| `src/domain/types.ts` | domain model |
| `src/features/backup/restore-validation.ts` | local simulation persistence |
| `src/features/backup/service.ts` | local simulation persistence |
| `src/features/email-delivery/provider-events.ts` | provider-event integration |
| `src/i18n/dictionaries.ts` | UI |
| `src/i18n/locales/en.ts` | UI |
| `src/i18n/locales/pt-PT.ts` | UI |
| `src/persistence/db.ts` | local simulation persistence |
| `src/persistence/indexeddb/repositories.ts` | local simulation persistence |
| `src/persistence/interfaces.ts` | production persistence boundary (interfaces only) |

### Untracked (14)

| File | Classification |
|------|----------------|
| `src/domain/send-job-types.ts` | domain model |
| `src/persistence/indexeddb/send-job-repositories.ts` | local simulation persistence |
| `src/application/campaign-send-job-service.test.ts` | test |
| `supabase/migrations/202607020002_outreach_send_jobs.sql` | durable migration draft |
| `docs/email-outreach/send-job-recovery-plan.md` | documentation |
| `docs/email-outreach/sending-engine.md` | documentation |
| `docs/email-outreach/send-job-persistence.md` | documentation |
| `docs/email-outreach/rate-limits-and-retries.md` | documentation |
| `docs/email-outreach/operations-runbook.md` | documentation |
| `docs/email-outreach/provider-events.md` | documentation |
| `qa/outreach/step-7-recovery-baseline.md` | documentation |
| `qa/security/outreach-send-jobs.md` | documentation |
| `qa/ui/campaign-sending-report.md` | documentation |
| `e2e/campaign-send-job-simulation.spec.ts` | test (Composer stabilization) |

## Current Implementation

### Fully working (local simulation)

- Campaign queue eligibility evaluation with suppression, approval, duplicate, and provider-readiness checks.
- Idempotent simulation job creation (`findActiveForCampaign` guard).
- Bounded batch processing with local lock TTL.
- Send-job recipient snapshots with deterministic idempotency keys.
- Attempt persistence with duplicate attempt prevention.
- Pause, resume, cancel unsent with sent-history preservation.
- Retry classification for transient provider failures.
- Simulation does not increment Brevo daily usage.
- Step 8 provider-event reconciliation unchanged and extended to resolve attempts by provider message ID.
- Campaign detail UI labeled as local simulation only.
- Focused unit tests and Playwright simulation coverage.

### Simulation-only boundary

- UI uses `LocalSimulationProvider` (no network).
- Queue confirmation requires `QUEUE SIMULATION`.
- Brevo controls are absent/disabled in UI.
- Production durable store banner shown on campaign detail.

## Unresolved Architecture (Codex must finish)

| Topic | Files |
|-------|-------|
| UUID primary keys vs ForgeOS string IDs | `supabase/migrations/202607020002_outreach_send_jobs.sql`, `src/domain/send-job-types.ts`, `src/persistence/indexeddb/send-job-repositories.ts` |
| Production Supabase send-job repository | missing `src/persistence/supabase/send-job-repositories.ts` (not created) |
| Atomic production lock RPC design | `supabase/migrations/202607020002_outreach_send_jobs.sql` (`acquire_outreach_send_job_lock`) |
| Production Brevo campaign-processing routes | missing server routes |
| Trusted tenant derivation for send mutations | all send mutation entry points |

## Initial Assessment

- No credentials, real email addresses, or real lead databases were found in changed files.
- No unrelated files were included.
- Seven pre-existing lint warnings remain in unrelated files.
- Step 7 is **not** production-complete; local simulation checkpoint only.

## Validation Results (Composer pass)

| Command | Result |
|---------|--------|
| `npm run lint` | Pass, exit 0 — 7 pre-existing warnings |
| `npm run typecheck` | Pass, exit 0 |
| `npx vitest run src/application/campaign-send-job-service.test.ts` | Pass — 9 tests |
| `npx vitest run src/features/email-delivery/provider-events.test.ts` | Pass — 4 tests |
| `npm test` | Pass — 46 files, 217 tests |
| `npm run test:e2e` | Pass — 93 passed, 1 optional live-AI skipped |
| `npm run test:acceptance` | Pass — 50 passed, 1 optional live-AI skipped |
| `npm run build` | Pass, exit 0 |
| `npm run validate` | Pass, exit 0 |
| `npm run ai:doctor -- --provider abacus` | Pass, exit 0 — deterministic fallback, no paid calls |

### Pre-existing lint warnings (unchanged)

- `src/application/lead-import-service.ts` — 3 unused vars
- `src/persistence/db.ts` — 2 unused vars
- `src/persistence/interfaces.ts` — 2 unused vars

### Composer fixes applied

- UI: local simulation labeling, production-incomplete banner, i18n result strings, pause/cancel confirms, derived campaign status for queue enablement, pause disables process button.
- Tests: 3 additional unit tests, Playwright simulation spec (`e2e/campaign-send-job-simulation.spec.ts`).
- Docs: recovery plan, checkpoint status, security, QA reports updated.


1. Resolve ID strategy: align Supabase UUID schema with ForgeOS canonical string IDs or document explicit mapping layer.
2. Implement server-only Supabase send-job repository using service-role credentials.
3. Harden atomic lock RPC (`security definer`, tenant checks, stale-lock recovery tests).
4. Add trusted-tenant server routes for queue/process/pause/resume/cancel (no browser tenant injection).
5. Wire Brevo batch provider behind server routes with real-send gates.
6. Apply migration in staging only after review; do not deploy from this WIP branch without explicit approval.
7. Sync durable send-job state to local projections if operational UI still uses IndexedDB.
8. Extend provider-event reconciliation to durable send-job recipient rows when production store is live.

## Files Codex Should Inspect First

1. `src/application/campaign-send-job-service.ts`
2. `src/persistence/indexeddb/send-job-repositories.ts`
3. `supabase/migrations/202607020002_outreach_send_jobs.sql`
4. `src/features/email-delivery/provider-events.ts`
5. `src/components/leadops-campaign-detail-shell.tsx`
6. `src/application/campaign-send-job-service.test.ts`
7. `docs/email-outreach/send-job-recovery-plan.md`
