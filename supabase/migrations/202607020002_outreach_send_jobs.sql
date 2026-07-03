-- Durable campaign send jobs
-- Scope: explicit campaign queueing, bounded batch processing, locks, attempts, and real-send usage.
-- Public endpoints and service code write through server-only service-role credentials.

create table if not exists public.outreach_send_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  campaign_ref text not null,
  provider text not null check (provider in ('simulation', 'brevo')),
  delivery_mode text not null check (delivery_mode in ('simulation', 'brevo')),
  status text not null
    check (status in ('DRAFT', 'READY', 'QUEUED', 'PROCESSING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED')),
  batch_size integer not null check (batch_size between 1 and 100),
  delay_ms integer not null default 0 check (delay_ms >= 0 and delay_ms <= 5000),
  daily_limit integer not null default 0 check (daily_limit >= 0),
  max_retries integer not null default 2 check (max_retries >= 0 and max_retries <= 10),
  created_by text not null,
  approved_by text,
  created_at timestamptz not null default now(),
  queued_at timestamptz,
  started_at timestamptz,
  paused_at timestamptz,
  paused_by text,
  pause_reason text,
  resumed_at timestamptz,
  resumed_by text,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by text,
  cancel_reason text,
  last_processed_at timestamptz,
  processed_count integer not null default 0 check (processed_count >= 0),
  sent_count integer not null default 0 check (sent_count >= 0),
  failed_count integer not null default 0 check (failed_count >= 0),
  retry_pending_count integer not null default 0 check (retry_pending_count >= 0),
  skipped_count integer not null default 0 check (skipped_count >= 0),
  remaining_count integer not null default 0 check (remaining_count >= 0),
  lock_owner text,
  lock_acquired_at timestamptz,
  lock_expires_at timestamptz,
  last_stop_reason text,
  version integer not null default 1 check (version > 0)
);

create table if not exists public.outreach_send_job_recipients (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  send_job_id uuid not null references public.outreach_send_jobs(id) on delete cascade,
  campaign_ref text not null,
  campaign_recipient_ref text not null,
  contact_ref text,
  lead_ref text not null,
  normalized_email text not null,
  approved_content_version text not null,
  status text not null
    check (status in ('QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'RETRY_PENDING', 'FAILED', 'SKIPPED', 'SUPPRESSED', 'CANCELLED')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz,
  idempotency_key text not null,
  provider_message_id text,
  last_error_code text,
  last_error_message text,
  queued_at timestamptz not null,
  processing_started_at timestamptz,
  sent_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, idempotency_key)
);

create table if not exists public.outreach_send_job_attempts (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  send_job_id uuid not null references public.outreach_send_jobs(id) on delete cascade,
  send_job_recipient_id uuid not null references public.outreach_send_job_recipients(id) on delete cascade,
  campaign_ref text not null,
  campaign_recipient_ref text not null,
  lead_ref text not null,
  attempt_number integer not null check (attempt_number > 0),
  provider text not null check (provider in ('simulation', 'brevo')),
  delivery_mode text not null check (delivery_mode in ('simulation', 'brevo')),
  idempotency_key text not null,
  started_at timestamptz not null,
  completed_at timestamptz not null,
  status text not null check (status in ('ACCEPTED', 'FAILED', 'BLOCKED', 'ALREADY_PROCESSED')),
  provider_message_id text,
  retryable boolean not null default false,
  sanitized_error_code text,
  sanitized_error_message text,
  provider_category text not null default 'none',
  unique (tenant_id, idempotency_key)
);

create table if not exists public.outreach_send_job_daily_usage (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  usage_date date not null,
  provider text not null check (provider in ('brevo')),
  real_send_count integer not null default 0 check (real_send_count >= 0),
  updated_at timestamptz not null default now(),
  unique (tenant_id, provider, usage_date)
);

create index if not exists outreach_send_jobs_tenant_campaign_idx
  on public.outreach_send_jobs (tenant_id, campaign_ref, status);

create index if not exists outreach_send_jobs_lock_idx
  on public.outreach_send_jobs (tenant_id, lock_expires_at)
  where lock_owner is not null;

create index if not exists outreach_send_job_recipients_job_status_idx
  on public.outreach_send_job_recipients (tenant_id, send_job_id, status, next_attempt_at);

create index if not exists outreach_send_job_recipients_email_idx
  on public.outreach_send_job_recipients (tenant_id, normalized_email, status);

create index if not exists outreach_send_job_attempts_message_idx
  on public.outreach_send_job_attempts (provider_message_id)
  where provider_message_id is not null;

alter table public.outreach_send_jobs enable row level security;
alter table public.outreach_send_job_recipients enable row level security;
alter table public.outreach_send_job_attempts enable row level security;
alter table public.outreach_send_job_daily_usage enable row level security;

grant select, insert, update, delete on public.outreach_send_jobs to service_role;
grant select, insert, update, delete on public.outreach_send_job_recipients to service_role;
grant select, insert, update, delete on public.outreach_send_job_attempts to service_role;
grant select, insert, update, delete on public.outreach_send_job_daily_usage to service_role;

create or replace function public.acquire_outreach_send_job_lock(
  p_tenant_id text,
  p_job_id uuid,
  p_owner text,
  p_expires_at timestamptz
)
returns setof public.outreach_send_jobs
language sql
security invoker
as $$
  update public.outreach_send_jobs
     set lock_owner = p_owner,
         lock_acquired_at = now(),
         lock_expires_at = p_expires_at,
         version = version + 1
   where tenant_id = p_tenant_id
     and id = p_job_id
     and (
       lock_owner is null
       or lock_expires_at is null
       or lock_expires_at <= now()
     )
   returning *;
$$;

revoke all on function public.acquire_outreach_send_job_lock(text, uuid, text, timestamptz) from public;
grant execute on function public.acquire_outreach_send_job_lock(text, uuid, text, timestamptz) to service_role;

create or replace function public.increment_outreach_send_job_daily_usage(
  p_tenant_id text,
  p_provider text,
  p_usage_date date,
  p_count integer
)
returns setof public.outreach_send_job_daily_usage
language sql
security invoker
as $$
  insert into public.outreach_send_job_daily_usage (
    tenant_id,
    provider,
    usage_date,
    real_send_count,
    updated_at
  )
  values (
    p_tenant_id,
    p_provider,
    p_usage_date,
    greatest(p_count, 0),
    now()
  )
  on conflict (tenant_id, provider, usage_date)
  do update set
    real_send_count = public.outreach_send_job_daily_usage.real_send_count + greatest(excluded.real_send_count, 0),
    updated_at = now()
  returning *;
$$;

revoke all on function public.increment_outreach_send_job_daily_usage(text, text, date, integer) from public;
grant execute on function public.increment_outreach_send_job_daily_usage(text, text, date, integer) to service_role;

-- Tenant-member policies are intentionally deferred until hosted auth maps the local
-- string tenant identifiers used by the outreach MVP to authenticated membership rows.
-- Service-role-only mutations preserve the pilot safety boundary for this milestone.
