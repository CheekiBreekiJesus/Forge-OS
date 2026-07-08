-- Outreach message delivery attempts (server-owned idempotency)
-- Forward-only migration for production outreach vertical slice.

create table if not exists public.outreach_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  message_id text not null,
  lead_id text not null,
  campaign_id text not null,
  message_version text not null,
  provider text not null default 'simulation'
    check (provider in ('simulation', 'brevo', 'smartlead')),
  idempotency_key text not null,
  status text not null default 'queued'
    check (status in ('queued', 'accepted', 'sent', 'failed', 'blocked', 'already_processed')),
  request_fingerprint text not null default '',
  provider_message_id text,
  attempt_count integer not null default 1 check (attempt_count >= 1),
  last_error_code text,
  last_error_message text,
  queued_at timestamptz not null default now(),
  accepted_at timestamptz,
  sent_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, idempotency_key)
);

create index if not exists outreach_delivery_attempts_tenant_message_idx
  on public.outreach_delivery_attempts (tenant_id, message_id);

create index if not exists outreach_delivery_attempts_tenant_status_idx
  on public.outreach_delivery_attempts (tenant_id, status);

alter table public.outreach_delivery_attempts enable row level security;

-- Service role writes until Supabase session adapter is wired.
grant select, insert, update on public.outreach_delivery_attempts to service_role;

comment on table public.outreach_delivery_attempts is
  'Server-owned delivery attempts with idempotency for outreach messages.';
