-- LeadOps outreach schema
-- Adds the tables required for the email outreach workflow module.
-- Mirrors the TypeScript domain types in src/features/leadops/types.ts.
-- All tables are tenant-scoped with RLS enabled.

-- outreach_campaigns
-- Matches LeadOpsCampaign: id, tenantId, name, status, sentCount, totalCount
create table if not exists public.outreach_campaigns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed')),
  sent_count integer not null default 0 check (sent_count >= 0),
  total_count integer not null default 0 check (total_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- outreach_lead_states
-- Extends the core leads table with LeadOps outreach-specific fields.
-- Stored separately so the base leads table stays domain-neutral.
-- Matches LeadOpsLead outreach fields: website, industry, location, quality,
-- source_database, language, campaign_id, consent_status, provider_state.
create table if not exists public.outreach_lead_states (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  campaign_id uuid references public.outreach_campaigns(id) on delete set null,
  website text,
  industry text not null default '',
  location text not null default '',
  quality text not null default 'medium'
    check (quality in ('high', 'medium', 'low')),
  source_database text not null default '',
  language text not null default 'en',
  outreach_status text not null default 'ready'
    check (outreach_status in ('ready', 'queued', 'contacted', 'replied', 'positive_reply', 'bounced')),
  consent_status text not null default 'unknown'
    check (consent_status in ('unknown', 'subscribed', 'unsubscribed')),
  provider_state text not null default 'not_ready'
    check (provider_state in ('not_ready', 'draft', 'approved', 'queued', 'sent', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, lead_id)
);

-- outreach_messages
-- Matches LeadOpsGeneratedMessage: subject, body, tone, generationMethod, approved, edited.
-- Each row is a versioned draft/approved message for a specific lead and campaign.
create table if not exists public.outreach_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  campaign_id uuid references public.outreach_campaigns(id) on delete set null,
  subject text not null default '',
  body text not null default '',
  tone text not null default 'professional'
    check (tone in ('professional', 'friendly', 'direct')),
  generation_method text not null default 'deterministic-template',
  approved boolean not null default false,
  edited boolean not null default false,
  queued_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- outreach_audit_events
-- Matches LeadOpsActivity: kind, companyName, occurredAt.
-- Append-only event log for the outreach workflow audit trail.
create table if not exists public.outreach_audit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  kind text not null
    check (kind in (
      'lead-imported',
      'campaign-started',
      'reply-received',
      'bounce-detected',
      'lead-qualified',
      'message-generated',
      'message-edited',
      'message-approved',
      'campaign-assigned',
      'message-queued',
      'message-sent',
      'metrics-updated'
    )),
  company_name text not null default '',
  occurred_at timestamptz not null default now()
);

-- Indexes
create index if not exists outreach_lead_states_tenant_status_idx
  on public.outreach_lead_states (tenant_id, outreach_status);

create index if not exists outreach_lead_states_campaign_idx
  on public.outreach_lead_states (tenant_id, campaign_id);

create index if not exists outreach_messages_lead_campaign_idx
  on public.outreach_messages (tenant_id, lead_id, campaign_id);

create index if not exists outreach_audit_events_tenant_lead_idx
  on public.outreach_audit_events (tenant_id, lead_id);

create index if not exists outreach_audit_events_tenant_kind_idx
  on public.outreach_audit_events (tenant_id, kind);

-- Row-level security
alter table public.outreach_campaigns enable row level security;
alter table public.outreach_lead_states enable row level security;
alter table public.outreach_messages enable row level security;
alter table public.outreach_audit_events enable row level security;

create policy "tenant members can manage outreach campaigns"
  on public.outreach_campaigns for all
  using (tenant_id in (select public.current_user_tenant_ids()))
  with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage outreach lead states"
  on public.outreach_lead_states for all
  using (tenant_id in (select public.current_user_tenant_ids()))
  with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can manage outreach messages"
  on public.outreach_messages for all
  using (tenant_id in (select public.current_user_tenant_ids()))
  with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can read outreach audit events"
  on public.outreach_audit_events for select
  using (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members can insert outreach audit events"
  on public.outreach_audit_events for insert
  with check (tenant_id in (select public.current_user_tenant_ids()));
