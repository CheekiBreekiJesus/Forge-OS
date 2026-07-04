# First Tenant Bootstrap

The first JH Gomes owner membership must be created through a trusted service-side SQL/bootstrap procedure. Do not commit real emails or credentials.

## Reusable Procedure

Use `scripts/admin/bootstrap-tenant-membership.sql` as the reusable template. It accepts explicit UUID, tenant, role, status, and permission parameters in a `params` CTE and defaults to dry-run mode.

Requirements enforced by the procedure:

- the Supabase `auth.users` row must already exist;
- the `public.tenants` row must already exist;
- the requested role and status must be part of the canonical ForgeOS sets;
- first-owner access must be set to `active` deliberately;
- duplicate tenant/user pairs are updated idempotently;
- no email-domain approval, anonymous execution, or automatic super-admin assignment is performed.

Run it only from a trusted local, staging, or production database administration channel after the target database has been positively identified. Do not paste real UUIDs, emails, or secrets into repository files, chat prompts, screenshots, or QA reports.

## Synthetic Shape

```sql
with params as (
  select
    '00000000-0000-0000-0000-000000000000'::uuid as p_user_id,
    '00000000-0000-0000-0000-000000000001'::uuid as p_tenant_id,
    'company_owner'::text as p_role,
    'active'::text as p_status,
    array['send_job:view', 'send_job:prepare']::text[] as p_permissions,
    true as p_dry_run
)
select * from params;
```

Replace synthetic IDs only in private deployment operations.
