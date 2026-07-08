-- Synthetic outreach integration seed (customer-neutral).
-- Applied after migrations in local Supabase / PostgreSQL integration tests.

insert into public.tenants (id, name, slug, tenant_key, default_locale)
values
  ('11111111-1111-4111-8111-111111111111', 'JH Gomes Synthetic', 'jh-gomes', 'tenant_jh_gomes', 'pt-PT'),
  ('22222222-2222-4222-8222-222222222222', 'Other Tenant Synthetic', 'other-tenant', 'tenant_other', 'en')
on conflict (slug) do update set tenant_key = excluded.tenant_key;

insert into public.profiles (id, display_name, email)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Authorized Operator', 'authorized@example.test'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Unauthorized User', 'unauthorized@example.test')
on conflict (id) do nothing;

insert into public.tenant_memberships (tenant_id, user_id, role)
values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'outreach_operator')
on conflict (tenant_id, user_id) do nothing;

insert into public.leads (id, tenant_id, company_name, contact_name, email, status, source)
values
  ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'Synthetic Co', 'Alex Operator', 'alex@example.test', 'new', 'seed'),
  ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', 'Bounced Co', 'Bounce Lead', 'bounce@example.test', 'bounced', 'seed')
on conflict (id) do nothing;

insert into public.outreach_lead_states (tenant_id, lead_id, consent_status, outreach_status, provider_state)
values
  ('11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333', 'subscribed', 'ready', 'approved'),
  ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444', 'subscribed', 'bounced', 'blocked')
on conflict (tenant_id, lead_id) do nothing;

insert into public.outreach_campaigns (
  id, tenant_id, name, status, sent_count, total_count, delivery_mode, created_by,
  subject_template, plain_text_template
)
values (
  '55555555-5555-4555-8555-555555555555',
  '11111111-1111-4111-8111-111111111111',
  'Integration Campaign',
  'active',
  0,
  1,
  'simulation',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Subject {{company}}',
  'Body {{contact}}'
)
on conflict (id) do nothing;

insert into public.outreach_campaign_recipients (
  id, tenant_id, campaign_id, lead_id,
  snapshot_email, snapshot_company_name, snapshot_contact_name,
  draft_status, personalized_subject, personalized_plain_text,
  approval_content_hash, approved_at, approved_by
)
values (
  '66666666-6666-4666-8666-666666666666',
  '11111111-1111-4111-8111-111111111111',
  '55555555-5555-4555-8555-555555555555',
  '33333333-3333-4333-8333-333333333333',
  'alex@example.test',
  'Synthetic Co',
  'Alex Operator',
  'APPROVED',
  'Exact Approved Subject',
  'Exact approved body paragraph.',
  'alex@example.test::Exact Approved Subject::Exact approved body paragraph.::0',
  now(),
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
)
on conflict (id) do nothing;
