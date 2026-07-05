-- ForgeOS auth membership upgrade base fixture.
--
-- Use only on a local or disposable database reset to the outreach integration
-- migration immediately before 202607040001_auth_membership_status_permissions.sql.
-- The data is synthetic and deterministic so the auth migration can be applied
-- over legacy active/disabled memberships.

begin;

insert into public.tenants (id, name, slug, default_locale, tenant_key)
values (
  '10000000-0000-4000-8000-000000000001',
  'Synthetic Auth Upgrade Tenant',
  'synthetic-auth-upgrade',
  'pt-PT',
  'tenant_synthetic_auth_upgrade'
)
on conflict (id) do update set
  name = excluded.name,
  tenant_key = excluded.tenant_key,
  updated_at = now();

insert into public.profiles (id, display_name, email)
values
  ('10000000-0000-4000-8000-000000000101', 'Synthetic Active User', 'active@example.invalid'),
  ('10000000-0000-4000-8000-000000000102', 'Synthetic Legacy Disabled User', 'disabled@example.invalid')
on conflict (id) do update set
  display_name = excluded.display_name,
  email = excluded.email,
  updated_at = now();

insert into public.tenant_memberships (tenant_id, user_id, role, status, permissions)
values
  ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000101', 'company_owner', 'active', array['send_job:view','send_job:prepare']),
  ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000102', 'viewer', 'disabled', array[]::text[])
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
  'Synthetic Auth Upgrade Campaign',
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
  'tenant_synthetic_auth_upgrade',
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
  'tenant_synthetic_auth_upgrade',
  'simulation',
  'synthetic-auth-upgrade-event',
  'delivered',
  now(),
  '10000000-0000-4000-8000-000000000301',
  '10000000-0000-4000-8000-000000000401',
  '10000000-0000-4000-8000-000000000201',
  'processed',
  'none'
)
on conflict (tenant_public_id, event_fingerprint) do nothing;

commit;
