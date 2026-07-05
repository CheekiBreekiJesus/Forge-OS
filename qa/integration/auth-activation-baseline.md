# Auth Activation Baseline

Date: 2026-07-05

## Worktree

- Worktree: isolated `Forge-OS-auth-activation` worktree requested for this task.
- Branch: `integration/jh-gomes-auth-activation`
- Starting commit: `213dc3e chore(supabase): add local development configuration`
- Base branch: `origin/integration/jh-gomes-outreach-supabase-7d2`
- Auth source branch: `origin/feat/supabase-auth-membership`
- Auth source commit: `ee821f9 feat(auth): add Supabase membership enforcement`

## Preflight

- Target worktree was clean before integration.
- Main `Forge-OS` worktree was dirty and was not edited.
- `origin/feat/supabase-auth-membership` contains `ee821f9`.
- `origin/integration/jh-gomes-outreach-supabase-7d2` contains `213dc3e`.
- `git diff --check` passed before integration.

## Existing Migrations

- `202606150001_demo_mvp_schema.sql`
- `202606260001_operational_foundation.sql`
- `202606300001_leadops_outreach_schema.sql`
- `202607020001_outreach_public_events.sql`
- `202607020002_outreach_send_jobs.sql`
- `202607030001_outreach_hosted_runtime_projection.sql`
- `202607030002_outreach_hosted_preparation_status.sql`
- `202607031200_outreach_delivery_attempts.sql`
- `202607031400_tenant_key_outreach_campaigns.sql`
- `202607031500_outreach_send_attempts.sql`
- `202607031600_outreach_rls_policies.sql`

## Existing Tenant And Membership Tables

- `tenants` and `tenant_memberships` are created by the base demo schema.
- `tenants.tenant_key` is added by `202607031400_tenant_key_outreach_campaigns.sql`.
- `tenant_memberships.status` and `tenant_memberships.permissions` are already added by `202607030001_outreach_hosted_runtime_projection.sql`.
- Current base runtime already resolves Supabase sessions through `src/lib/auth/session.ts`, but it does not yet include the stricter OAuth callback membership gating and route-protection proxy from the auth branch.

## Existing RLS Policies

- Base `current_user_tenant_ids()` reads memberships for `auth.uid()` without status filtering in the initial schema.
- Hosted outreach RLS policies in `202607031600_outreach_rls_policies.sql` depend on `current_user_tenant_ids()`.
- Auth source migration is expected to replace `current_user_tenant_ids()` so only active memberships satisfy tenant RLS.

## Hosted Outreach Status

- Hosted campaign preparation, recipient projection, send-job tables, delivery attempts, provider events, and SQL integration tests exist on the integration base.
- Browser local mode remains IndexedDB-first.
- Supabase mode has server-owned outreach send and hosted repository paths.

## Send-Job Actor Status

- Base send-job actor context accepts production Supabase sessions and filters active memberships for server send-job actions.
- Non-production actor headers are development/test-only.
- Auth source branch adds synthetic E2E actor fallback and stricter shared role/permission modeling.

## External Configuration Gaps

- No live Supabase credentials are committed.
- `.env.example` contains placeholders only.
- Supabase migrations have not been applied to any production database by this task.
- Real OAuth provider setup and staging login smoke testing remain external/manual until a non-production target is positively identified and explicitly authorized.
