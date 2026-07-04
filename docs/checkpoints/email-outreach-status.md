# Email Outreach Status - Supabase 7D2 Integration Checkpoint

Date: 2026-07-04
Branch: `integration/jh-gomes-outreach-supabase-7d2`
Sources: `release/jh-gomes-outreach-supabase` + `feat/email-outreach-send-jobs-7d2`

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
- [x] Supabase public suppression/events schema
- [x] Local simulation send jobs with bounded batch processing
- [x] Durable Supabase send-job store helpers
- [x] Locks, daily usage, trusted actor abstraction, authorization
- [x] Queue/process/pause/resume/cancel/retry/status routes
- [x] Server-owned message-send route using Supabase cookie session and tenant membership
- [x] Supabase delivery claim RPC and integration coverage
- [x] IndexedDB v11+ send-job projection tables preserved in v12

### Hosted campaign preparation

- [x] Production send-job actor context uses the ForgeOS Supabase cookie session boundary
- [x] Active tenant memberships are loaded server-side through service-role repositories
- [x] Stable deployment tenant selection is supported through `FORGEOS_ACTIVE_TENANT_KEY`
- [x] Trusted tenant selector is required when a user has multiple active memberships and no stable tenant key
- [x] Hosted server repository adapter for durable simulation send jobs
- [x] Hosted campaign and recipient projection schema
- [x] UI panel for preparing approved campaign snapshots for hosted durable simulation
- [x] Idempotent hosted campaign preparation status and audit display
- [x] Static migration validation tooling

## Combined operator workflow

Import lead file -> review and persist -> filter sendable contacts -> create campaign -> generate deterministic drafts -> review and approve -> Gmail/Outlook manual handoff -> prepare approved campaign for hosted simulation -> local or hosted durable simulation send job.

## Not enabled

- [ ] Hosted Supabase migrations applied to production
- [ ] Brevo campaign batch sending
- [ ] Real campaign email sends
- [ ] Production deployment

## Schema

- **IndexedDB v12+:** import batches/rows, mapping profiles, send jobs/recipients/attempts/daily usage, suppressions, provider events
- **JSON backup v8:** all operational tables above
- **Supabase migrations present:** `202607020002_outreach_send_jobs.sql`, `202607030001_outreach_hosted_runtime_projection.sql`, `202607030002_outreach_hosted_preparation_status.sql`

## Next steps

1. Validate the merged migration set against local Postgres/Supabase.
2. Run hosted durable simulation with real Supabase Auth cookie sessions and service-role server credentials in an approved non-production environment.
3. Keep Brevo real-send campaign processing blocked until explicit Step 9 approval.

No real campaign email is sent by this integration branch.
