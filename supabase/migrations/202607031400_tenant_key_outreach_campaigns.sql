-- Stable tenant public key and production outreach campaign/recipient tables.
-- Forward-only: does not rewrite prior migrations.

-- Stable browser/demo tenant identifier (e.g. tenant_jh_gomes) separate from URL slug.
alter table public.tenants
  add column if not exists tenant_key text;

update public.tenants
   set tenant_key = slug
 where tenant_key is null;

alter table public.tenants
  alter column tenant_key set not null;

create unique index if not exists tenants_tenant_key_idx on public.tenants (tenant_key);

comment on column public.tenants.tenant_key is
  'Stable public tenant identifier used by application config (e.g. tenant_jh_gomes).';

-- Extend outreach_campaigns for ForgeOS campaign domain fields.
alter table public.outreach_campaigns
  add column if not exists description text not null default '',
  add column if not exists language text not null default 'pt-PT',
  add column if not exists segment_definition jsonb,
  add column if not exists recipient_snapshot_created_at timestamptz,
  add column if not exists recipient_snapshot_count integer not null default 0,
  add column if not exists subject_template text not null default '',
  add column if not exists plain_text_template text not null default '',
  add column if not exists html_template text not null default '',
  add column if not exists template_version integer not null default 1,
  add column if not exists template_updated_at timestamptz,
  add column if not exists from_name text not null default '',
  add column if not exists sender_profile_id uuid,
  add column if not exists reply_to text not null default '',
  add column if not exists delivery_mode text not null default 'simulation'
    check (delivery_mode in ('simulation', 'provider_handoff')),
  add column if not exists created_by uuid;

-- Composite unique on outreach_campaigns for tenant-safe FK from recipients.
create unique index if not exists outreach_campaigns_tenant_id_id_idx
  on public.outreach_campaigns (tenant_id, id);

-- Campaign recipients (server-owned message versions for outreach send path).
create table if not exists public.outreach_campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  campaign_id uuid not null references public.outreach_campaigns(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  contact_id uuid,
  snapshot_email text not null default '',
  snapshot_company_name text not null default '',
  snapshot_contact_name text not null default '',
  snapshot_category text not null default '',
  snapshot_region text not null default '',
  snapshot_website text not null default '',
  greeting_override text not null default '',
  organization_display_name_override text not null default '',
  contact_salutation jsonb,
  inclusion_reason text not null default '',
  recipient_status text not null default 'included'
    check (recipient_status in ('included', 'excluded')),
  personalized_subject text not null default '',
  personalized_plain_text text not null default '',
  personalized_html text not null default '',
  draft_status text not null default 'PENDING',
  generated_at timestamptz,
  generation_method text,
  template_version integer,
  user_edited boolean not null default false,
  draft_updated_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  approval_content_hash text,
  approval_invalidated_at timestamptz,
  approval_invalidation_reason text,
  opened_externally_at timestamptz,
  external_client text,
  sent_at timestamptz,
  sent_by uuid,
  recipient_delivery_mode text,
  operator_note text not null default '',
  simulated_at timestamptz,
  send_idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, campaign_id, lead_id),
  constraint outreach_campaign_recipients_campaign_tenant_fk
    foreign key (tenant_id, campaign_id)
    references public.outreach_campaigns (tenant_id, id)
    deferrable initially deferred
);

create index if not exists outreach_campaign_recipients_tenant_campaign_idx
  on public.outreach_campaign_recipients (tenant_id, campaign_id);

create index if not exists outreach_campaign_recipients_tenant_draft_idx
  on public.outreach_campaign_recipients (tenant_id, draft_status);

-- Tenant-safe FK: lead must belong to same tenant as recipient.
create or replace function public.enforce_outreach_recipient_lead_tenant()
returns trigger
language plpgsql
as $$
declare
  lead_tenant uuid;
begin
  select tenant_id into lead_tenant from public.leads where id = new.lead_id;
  if lead_tenant is null or lead_tenant <> new.tenant_id then
    raise exception 'lead tenant mismatch for outreach recipient';
  end if;
  return new;
end;
$$;

drop trigger if exists outreach_campaign_recipients_lead_tenant on public.outreach_campaign_recipients;
create trigger outreach_campaign_recipients_lead_tenant
  before insert or update on public.outreach_campaign_recipients
  for each row execute function public.enforce_outreach_recipient_lead_tenant();

-- Company profiles and sender identities for outreach composition.
create table if not exists public.company_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  legal_name text not null default '',
  trade_name text not null default '',
  website text not null default '',
  support_email text not null default '',
  phone text not null default '',
  address_line1 text not null default '',
  address_line2 text not null default '',
  city text not null default '',
  region text not null default '',
  postal_code text not null default '',
  country text not null default 'PT',
  vat_number text not null default '',
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id)
);

create table if not exists public.sender_identities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  display_name text not null default '',
  email text not null default '',
  reply_to text not null default '',
  signature_plain text not null default '',
  signature_html text not null default '',
  is_default boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id)
);

alter table public.outreach_campaigns
  add constraint outreach_campaigns_sender_profile_fk
  foreign key (tenant_id, sender_profile_id)
  references public.sender_identities (tenant_id, id)
  deferrable initially deferred;

-- Activity events (audit trail for outreach send path).
create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  title text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists activity_events_tenant_entity_idx
  on public.activity_events (tenant_id, entity_type, entity_id);
