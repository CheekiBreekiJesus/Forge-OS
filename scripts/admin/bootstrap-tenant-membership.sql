-- ForgeOS tenant membership bootstrap template.
--
-- Purpose:
--   Create or update one explicit tenant membership for an existing Supabase
--   auth user and an existing ForgeOS tenant.
--
-- Usage:
--   Run only from a trusted administrator shell against an approved local or
--   staging database. Replace the p_* values in the params CTE in a private
--   copy or pipe generated values from an internal deployment tool.
--
-- Safety:
--   - No real UUIDs or emails are stored in this file.
--   - The target auth user must already exist in auth.users.
--   - The target tenant must already exist in public.tenants.
--   - Membership activation is explicit; there is no email-domain approval.
--   - The operation is idempotent for (tenant_id, user_id).

with params as (
  select
    '00000000-0000-4000-8000-000000000001'::uuid as p_user_id,
    '00000000-0000-4000-8000-000000000002'::uuid as p_tenant_id,
    'company_owner'::text as p_role,
    'active'::text as p_status,
    array[]::text[] as p_permissions,
    true as p_dry_run
),
validated as (
  select p.*
    from params p
   where exists (select 1 from auth.users u where u.id = p.p_user_id)
     and exists (select 1 from public.tenants t where t.id = p.p_tenant_id)
     and p.p_role in (
       'super_admin',
       'company_owner',
       'production_manager',
       'warehouse_manager',
       'maintenance_technician',
       'machine_operator',
       'sales_representative',
       'marketing_manager',
       'accountant',
       'customer_portal_user',
       'supplier_portal_user',
       'outreach_operator',
       'sales',
       'owner',
       'viewer'
     )
     and p.p_status in ('pending', 'active', 'suspended', 'revoked')
),
upserted as (
  insert into public.tenant_memberships (
    tenant_id,
    user_id,
    role,
    status,
    permissions,
    approved_at,
    updated_at
  )
  select
    p_tenant_id,
    p_user_id,
    p_role,
    p_status,
    p_permissions,
    case when p_status = 'active' then now() else null end,
    now()
  from validated
  where not p_dry_run
  on conflict (tenant_id, user_id)
  do update set
    role = excluded.role,
    status = excluded.status,
    permissions = excluded.permissions,
    approved_at = case
      when excluded.status = 'active' then coalesce(public.tenant_memberships.approved_at, now())
      else public.tenant_memberships.approved_at
    end,
    updated_at = now()
  returning id, tenant_id, user_id, role, status, permissions
)
select
  case
    when not exists (select 1 from validated) then 'validation_failed'
    when exists (select 1 from params where p_dry_run) then 'dry_run_valid'
    else 'membership_upserted'
  end as result,
  (select count(*) from upserted) as changed_rows;
