-- Hosted outreach runtime projection
-- Scope: production auth membership metadata and the minimal approved campaign
-- snapshot required by durable simulation send jobs.

alter table public.tenant_memberships
  add column if not exists status text not null default 'active'
    check (status in ('active', 'disabled'));

alter table public.tenant_memberships
  add column if not exists permissions text[] not null default '{}';

create index if not exists tenant_memberships_user_status_idx
  on public.tenant_memberships (user_id, status);

create table if not exists public.outreach_hosted_campaigns (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  campaign_ref text not null,
  name text not null,
  description text not null default '',
  language text not null default 'pt-PT',
  status text not null check (status in ('approved', 'paused', 'completed', 'cancelled')),
  delivery_mode text not null default 'simulation' check (delivery_mode in ('simulation')),
  recipient_snapshot_count integer not null default 0 check (recipient_snapshot_count >= 0),
  subject_template text not null default '',
  plain_text_template text not null default '',
  html_template text not null default '',
  template_version integer not null default 1 check (template_version > 0),
  template_updated_at timestamptz,
  from_name text not null default '',
  reply_to text not null default '',
  sender_profile_ref text,
  sender_display_name text not null default '',
  sender_from_email text not null default '',
  sender_reply_to_email text not null default '',
  sender_signature_text text not null default '',
  sender_signature_html text not null default '',
  company_legal_name text not null default '',
  company_trading_name text not null default '',
  company_general_email text not null default '',
  company_website_url text not null default '',
  legal_footer text not null default '',
  prepared_by text not null,
  prepared_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, campaign_ref)
);

create table if not exists public.outreach_hosted_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  campaign_ref text not null,
  campaign_recipient_ref text not null,
  lead_ref text not null,
  contact_ref text,
  snapshot_email text not null,
  snapshot_company_name text not null default '',
  snapshot_contact_name text not null default '',
  snapshot_category text not null default '',
  snapshot_region text not null default '',
  snapshot_website text not null default '',
  greeting_override text not null default '',
  organization_display_name_override text not null default '',
  contact_salutation text check (contact_salutation in ('male', 'female', 'unknown')),
  inclusion_reason text not null default 'approved_snapshot',
  status text not null default 'included' check (status in ('included', 'excluded')),
  personalized_subject text not null,
  personalized_plain_text text not null,
  personalized_html text not null default '',
  draft_status text not null default 'APPROVED' check (draft_status in ('APPROVED', 'SENT_MANUALLY', 'SUPPRESSED', 'SKIPPED')),
  generation_method text,
  template_version integer,
  user_edited boolean not null default false,
  draft_updated_at timestamptz,
  approved_at timestamptz not null,
  approved_by text not null,
  approval_content_hash text not null,
  sent_at timestamptz,
  sent_by text,
  recipient_delivery_mode text,
  operator_note text not null default '',
  simulated_at timestamptz,
  send_idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, campaign_ref, campaign_recipient_ref),
  foreign key (tenant_id, campaign_ref)
    references public.outreach_hosted_campaigns (tenant_id, campaign_ref)
    on delete cascade
);

create index if not exists outreach_hosted_campaigns_tenant_status_idx
  on public.outreach_hosted_campaigns (tenant_id, status);

create index if not exists outreach_hosted_campaign_recipients_campaign_idx
  on public.outreach_hosted_campaign_recipients (tenant_id, campaign_ref, draft_status);

create table if not exists public.outreach_hosted_activity_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  entity_type text not null,
  entity_ref text not null,
  action text not null,
  title text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists outreach_hosted_activity_events_entity_idx
  on public.outreach_hosted_activity_events (tenant_id, entity_type, entity_ref, occurred_at desc);

alter table public.outreach_hosted_campaigns enable row level security;
alter table public.outreach_hosted_campaign_recipients enable row level security;
alter table public.outreach_hosted_activity_events enable row level security;

grant select, insert, update, delete on public.outreach_hosted_campaigns to service_role;
grant select, insert, update, delete on public.outreach_hosted_campaign_recipients to service_role;
grant select, insert on public.outreach_hosted_activity_events to service_role;

comment on table public.outreach_hosted_campaigns is
  'Service-role-only approved outreach campaign projection for server-side durable simulation send jobs.';

comment on table public.outreach_hosted_campaign_recipients is
  'Service-role-only approved recipient snapshot projection for server-side durable simulation send jobs.';

comment on table public.outreach_hosted_activity_events is
  'Service-role-only hosted outreach audit trail for send-job server mutations.';

-- Tenant-member authenticated policies are intentionally deferred until Step 7D2.
-- This milestone accesses the projection only through trusted server routes using
-- service-role credentials after Supabase Auth and tenant membership checks.
