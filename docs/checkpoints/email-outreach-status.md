# Email Outreach Status — MVP Integration Checkpoint

Date: 2026-07-03  
Branch: `feat/email-outreach-mvp-integration`  
Sources: `fb82211` (send-job foundation) + `60fa927` (import-ops hardening)

## Integrated and working

### LeadOps import / operator

- [x] Hardened CSV/XLSX import with worksheet selection
- [x] Reusable mapping profiles (built-ins + save/delete)
- [x] Normalization, duplicate review, import history
- [x] Lead filters and sendability evaluation
- [x] Real workbook sheet-switch fix
- [x] Private acceptance runner (local, gitignored output)
- [x] IndexedDB v12: `importMappingProfiles` + extended import batch metadata
- [x] JSON backup v8 includes mapping profiles

### Email provider / send-job foundation

- [x] Brevo provider foundation (test-email only, no campaign delivery)
- [x] Durable unsubscribe and provider webhooks
- [x] Supabase public suppression/events schema (migration present, not applied)
- [x] Local simulation send jobs with bounded batch processing
- [x] Durable Supabase send-job store helpers
- [x] Locks, daily usage, trusted actor abstraction, authorization
- [x] Queue/process/pause/resume/cancel/retry/status routes (production-disabled)
- [x] IndexedDB v11+ send-job projection tables preserved in v12

## Combined operator workflow

Import lead file → review and persist → filter sendable contacts → create campaign → generate deterministic drafts → review and approve → Gmail/Outlook manual handoff → local simulation send job (optional) → durable server architecture available but production-disabled.

## Not enabled (Step 7D1 and beyond)

- [ ] Hosted Supabase migration application
- [ ] Production auth adapter and tenant membership lookup
- [ ] Hosted server repository adapter wired to live runtime
- [ ] Postgres/Supabase integration tests against hosted project
- [ ] Brevo campaign batch sending
- [ ] Real campaign email sends

## Schema

- **IndexedDB v12:** import batches/rows, mapping profiles, send jobs/recipients/attempts/daily usage, suppressions, provider events
- **JSON backup v8:** all operational tables above
- **Supabase:** `202607020002_outreach_send_jobs.sql` present, not applied

## Next steps (Step 7D1)

1. Wire production auth/session into `resolveTrustedSendJobActorContext`
2. Wire hosted server repositories for campaign, recipient, and send-job data
3. Run migration/RPC validation against Supabase/Postgres
4. Keep Brevo real-send campaign processing blocked until Step 9 approval

No email sent by this integration branch.
