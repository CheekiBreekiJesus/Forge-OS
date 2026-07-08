-- Outreach public events and durable suppressions
-- Scope: public unsubscribe requests and provider webhook reconciliation only.
-- This intentionally does not migrate the whole local IndexedDB outreach workflow.

create table if not exists public.outreach_public_suppressions (
  id uuid primary key default gen_random_uuid(),
  tenant_public_id text not null,
  normalized_email_hash text not null,
  reason text not null
    check (reason in ('unsubscribe', 'hard_bounce', 'complaint', 'invalid_address', 'legal_request', 'other')),
  source text not null
    check (source in ('public_unsubscribe', 'provider_webhook', 'system')),
  campaign_ref text,
  recipient_ref text,
  lead_ref text,
  token_version integer,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  removed_at timestamptz,
  removal_reason text,
  unique (tenant_public_id, normalized_email_hash, reason)
);

create table if not exists public.outreach_provider_events (
  id uuid primary key default gen_random_uuid(),
  tenant_public_id text not null,
  provider text not null check (provider in ('brevo', 'simulation')),
  provider_event_id text,
  event_fingerprint text not null,
  provider_message_id text,
  event_type text not null,
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  campaign_ref text,
  recipient_ref text,
  lead_ref text,
  send_attempt_ref text,
  normalized_email_hash text,
  sanitized_metadata jsonb not null default '{}'::jsonb,
  processing_status text not null default 'received',
  effect text not null default 'none',
  duplicate boolean not null default false,
  error_message text,
  unique (tenant_public_id, event_fingerprint)
);

create index if not exists outreach_public_suppressions_tenant_hash_idx
  on public.outreach_public_suppressions (tenant_public_id, normalized_email_hash)
  where active;

create index if not exists outreach_provider_events_tenant_type_idx
  on public.outreach_provider_events (tenant_public_id, event_type, received_at desc);

create index if not exists outreach_provider_events_message_idx
  on public.outreach_provider_events (provider_message_id)
  where provider_message_id is not null;

alter table public.outreach_public_suppressions enable row level security;
alter table public.outreach_provider_events enable row level security;

-- Runtime public endpoints write with the Supabase service role.
-- Tenant-member read policies can be narrowed once production tenant IDs are mapped
-- from tenant_public_id to the authenticated tenant membership model.
