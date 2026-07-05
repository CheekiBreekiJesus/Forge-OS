# Auth Migration Order

Date: 2026-07-05
Branch: `integration/jh-gomes-auth-activation`

## Migration Chain

| Order | Migration | Role in chain | Auth activation finding |
| --- | --- | --- | --- |
| 1 | `202606150001_demo_mvp_schema.sql` | Initial demo tenants and operational tables | Base tenant tables exist before membership changes. |
| 2 | `202606260001_operational_foundation.sql` | Operational module foundation | No auth dependency introduced. |
| 3 | `202606300001_leadops_outreach_schema.sql` | LeadOps outreach tables | Campaign and recipient tables exist before hosted runtime projection. |
| 4 | `202607020001_outreach_public_events.sql` | Public unsubscribe/provider event foundation | Public event paths remain independently authenticated. |
| 5 | `202607020002_outreach_send_jobs.sql` | Send-job persistence | Send-job tables exist before actor-context tests. |
| 6 | `202607030001_outreach_hosted_runtime_projection.sql` | Hosted tenant keys, membership status defaults, campaign projection | Introduced legacy `active`/`disabled` status constraint. Auth migration must replace it. |
| 7 | `202607030002_outreach_hosted_preparation_status.sql` | Campaign preparation status | Compatible with active tenant context. |
| 8 | `202607031200_outreach_delivery_attempts.sql` | Delivery attempt tracking | No auth dependency conflict. |
| 9 | `202607031400_tenant_key_outreach_campaigns.sql` | Tenant key compatibility | Required for hosted outreach repository compatibility. |
| 10 | `202607031500_outreach_send_attempts.sql` | Send attempt history | No duplicate auth constraint. |
| 11 | `202607031600_outreach_rls_policies.sql` | RLS policy layer for outreach runtime | Depends on `current_user_tenant_ids()`. |
| 12 | `202607040001_auth_membership_status_permissions.sql` | Canonical membership lifecycle, permissions, active-only tenant helper | Must run after legacy hosted runtime projection and RLS policy creation. |

## Dependency Result

- Timestamps sort correctly and the auth migration is last.
- Tenant, profile, membership, campaign, recipient, send-job, and provider-event tables exist before the auth migration touches membership status or RLS helper behavior.
- `tenant_memberships_status_check` is deliberately dropped and recreated so the legacy `active`/`disabled` constraint does not block `pending`, `suspended`, or `revoked`.
- Legacy `disabled` rows are converted to `suspended`.
- Rows with null status are marked `active` before `status` is made not-null, preserving existing access.
- `current_user_tenant_ids()` is replaced to return only `status = 'active'` memberships.
- Indexes use `if not exists`; no duplicate index failure was observed in local reset.
- No private data is required by the migration chain.

## Validation Evidence

- `npx supabase db reset --local --yes`: passed on the full chain.
- `npx supabase db reset --local --version 202607031600 --yes`: passed to create the pre-auth upgrade baseline.
- `scripts/admin/prepare-auth-membership-upgrade-base.sql`: loaded synthetic active and legacy disabled memberships.
- `supabase/migrations/202607040001_auth_membership_status_permissions.sql`: applied cleanly over the pre-auth baseline.
- Post-upgrade query confirmed synthetic statuses `active = 1` and `suspended = 1`.
- `scripts/admin/validate-auth-membership-upgrade.sql`: passed on upgraded and fresh schemas.
