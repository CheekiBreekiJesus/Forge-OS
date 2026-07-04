-- ForgeOS auth membership repair.
-- Forward-only: aligns tenant_memberships with the hosted auth runtime contract.

alter table public.tenant_memberships
  add column if not exists status text,
  add column if not exists permissions text[] not null default '{}',
  add column if not exists invited_by uuid,
  add column if not exists invited_at timestamptz,
  add column if not exists approved_by uuid,
  add column if not exists approved_at timestamptz,
  add column if not exists suspended_at timestamptz,
  add column if not exists revoked_at timestamptz;

update public.tenant_memberships
   set status = 'active'
 where status is null;

alter table public.tenant_memberships
  alter column status set default 'pending',
  alter column status set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'tenant_memberships_status_check'
       and conrelid = 'public.tenant_memberships'::regclass
  ) then
    alter table public.tenant_memberships
      add constraint tenant_memberships_status_check
      check (status in ('pending', 'active', 'suspended', 'revoked'));
  end if;

  if not exists (
    select 1 from pg_constraint
     where conname = 'tenant_memberships_role_check'
       and conrelid = 'public.tenant_memberships'::regclass
  ) then
    alter table public.tenant_memberships
      add constraint tenant_memberships_role_check
      check (
        role in (
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
      );
  end if;
end $$;

create index if not exists tenant_memberships_user_status_idx
  on public.tenant_memberships (user_id, status);

create index if not exists tenant_memberships_tenant_status_idx
  on public.tenant_memberships (tenant_id, status);

create or replace function public.current_user_tenant_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select tenant_id
    from public.tenant_memberships
   where user_id = auth.uid()
     and status = 'active'
$$;

comment on column public.tenant_memberships.status is
  'Membership lifecycle status. Only active memberships grant ForgeOS application access.';

comment on column public.tenant_memberships.permissions is
  'Optional tenant-scoped explicit permissions. Role-derived permissions remain canonical defaults.';

grant select on public.tenant_memberships to authenticated;
grant all on public.tenant_memberships to service_role;
