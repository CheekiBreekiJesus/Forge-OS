-- ForgeOS auth membership upgrade validation.
--
-- Runs with synthetic data only and rolls back at the end.
-- Intended command:
--   npx supabase db query --local --file scripts/admin/validate-auth-membership-upgrade.sql

begin;

create or replace function pg_temp.assert_auth_activation(
  check_name text,
  check_condition boolean
)
returns void
language plpgsql
as $$
begin
  if not coalesce(check_condition, false) then
    raise exception 'Auth activation validation failed: %', check_name;
  end if;
end;
$$;

insert into public.tenants (id, name, slug, default_locale, tenant_key)
values (
  '10000000-0000-4000-8000-000000000001',
  'Synthetic Auth Activation Tenant',
  'synthetic-auth-activation',
  'pt-PT',
  'tenant_synthetic_auth_activation'
)
on conflict (id) do update set
  name = excluded.name,
  tenant_key = excluded.tenant_key,
  updated_at = now();

insert into public.profiles (id, display_name, email)
values
  ('10000000-0000-4000-8000-000000000101', 'Synthetic Active User', 'active@example.invalid'),
  ('10000000-0000-4000-8000-000000000102', 'Synthetic Pending User', 'pending@example.invalid'),
  ('10000000-0000-4000-8000-000000000103', 'Synthetic Suspended User', 'suspended@example.invalid'),
  ('10000000-0000-4000-8000-000000000104', 'Synthetic Revoked User', 'revoked@example.invalid')
on conflict (id) do update set
  display_name = excluded.display_name,
  email = excluded.email,
  updated_at = now();

insert into public.tenant_memberships (tenant_id, user_id, role, status, permissions)
values
  ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000101', 'company_owner', 'active', array['send_job:view','send_job:prepare']),
  ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000102', 'viewer', 'pending', array[]::text[]),
  ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000103', 'viewer', 'suspended', array[]::text[]),
  ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000104', 'viewer', 'revoked', array[]::text[])
on conflict (tenant_id, user_id) do update set
  role = excluded.role,
  status = excluded.status,
  permissions = excluded.permissions,
  updated_at = now();

insert into public.leads (id, tenant_id, company_name, contact_name, email, status, source)
values (
  '10000000-0000-4000-8000-000000000201',
  '10000000-0000-4000-8000-000000000001',
  'Synthetic Lead Company',
  'Synthetic Contact',
  'lead@example.invalid',
  'new',
  'manual'
)
on conflict (id) do nothing;

insert into public.outreach_campaigns (id, tenant_id, name, status, total_count, recipient_snapshot_count, delivery_mode, created_by)
values (
  '10000000-0000-4000-8000-000000000301',
  '10000000-0000-4000-8000-000000000001',
  'Synthetic Auth Activation Campaign',
  'active',
  1,
  1,
  'simulation',
  '10000000-0000-4000-8000-000000000101'
)
on conflict (id) do nothing;

insert into public.outreach_campaign_recipients (
  id,
  tenant_id,
  campaign_id,
  lead_id,
  snapshot_email,
  snapshot_company_name,
  snapshot_contact_name,
  draft_status,
  personalized_subject,
  personalized_plain_text,
  approved_at,
  approved_by,
  approval_content_hash
)
values (
  '10000000-0000-4000-8000-000000000401',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000301',
  '10000000-0000-4000-8000-000000000201',
  'lead@example.invalid',
  'Synthetic Lead Company',
  'Synthetic Contact',
  'APPROVED',
  'Synthetic subject',
  'Synthetic body',
  now(),
  '10000000-0000-4000-8000-000000000101',
  'synthetic-hash'
)
on conflict (id) do nothing;

insert into public.outreach_send_jobs (
  id,
  tenant_id,
  campaign_ref,
  provider,
  delivery_mode,
  status,
  batch_size,
  created_by,
  remaining_count
)
values (
  '10000000-0000-4000-8000-000000000501',
  'tenant_synthetic_auth_activation',
  '10000000-0000-4000-8000-000000000301',
  'simulation',
  'simulation',
  'QUEUED',
  5,
  '10000000-0000-4000-8000-000000000101',
  1
)
on conflict (id) do nothing;

insert into public.outreach_provider_events (
  tenant_public_id,
  provider,
  event_fingerprint,
  event_type,
  occurred_at,
  campaign_ref,
  recipient_ref,
  lead_ref,
  processing_status,
  effect
)
values (
  'tenant_synthetic_auth_activation',
  'simulation',
  'synthetic-auth-activation-event',
  'delivered',
  now(),
  '10000000-0000-4000-8000-000000000301',
  '10000000-0000-4000-8000-000000000401',
  '10000000-0000-4000-8000-000000000201',
  'processed',
  'none'
)
on conflict (tenant_public_id, event_fingerprint) do nothing;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000101', true);
select pg_temp.assert_auth_activation(
  'active_membership_function_check',
  (
    select count(*)
      from public.current_user_tenant_ids()
     where current_user_tenant_ids = '10000000-0000-4000-8000-000000000001'
  ) = 1
);

set local role authenticated;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000101', true);
select pg_temp.assert_auth_activation(
  'active_membership_rls_check',
  (select count(*) from public.outreach_campaigns where tenant_id = '10000000-0000-4000-8000-000000000001') = 1
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000102', true);
select pg_temp.assert_auth_activation(
  'pending_membership_rls_check',
  (select count(*) from public.outreach_campaigns where tenant_id = '10000000-0000-4000-8000-000000000001') = 0
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000103', true);
select pg_temp.assert_auth_activation(
  'suspended_membership_rls_check',
  (select count(*) from public.outreach_campaigns where tenant_id = '10000000-0000-4000-8000-000000000001') = 0
);

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000104', true);
select pg_temp.assert_auth_activation(
  'revoked_membership_rls_check',
  (select count(*) from public.outreach_campaigns where tenant_id = '10000000-0000-4000-8000-000000000001') = 0
);

reset role;

select pg_temp.assert_auth_activation(
  'recipient_relationship_check',
  exists (select 1 from public.outreach_campaign_recipients where id = '10000000-0000-4000-8000-000000000401')
);

select pg_temp.assert_auth_activation(
  'send_job_relationship_check',
  exists (select 1 from public.outreach_send_jobs where id = '10000000-0000-4000-8000-000000000501')
);

select pg_temp.assert_auth_activation(
  'provider_event_relationship_check',
  exists (select 1 from public.outreach_provider_events where event_fingerprint = 'synthetic-auth-activation-event')
);

rollback;
