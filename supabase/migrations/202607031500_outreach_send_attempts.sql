-- Replace text-typed delivery attempts with UUID tenant-scoped send attempts.
-- Aligns with OutreachSendAttempt domain and atomic claim RPC.

drop table if exists public.outreach_delivery_attempts;

-- Composite unique on leads for tenant-safe FK from send attempts.
create unique index if not exists leads_tenant_id_id_idx on public.leads (tenant_id, id);

create table if not exists public.outreach_send_attempts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  campaign_id uuid not null,
  campaign_recipient_id uuid not null,
  lead_id uuid not null,
  provider text not null default 'simulation'
    check (provider in ('simulation', 'brevo')),
  delivery_mode text not null default 'simulation'
    check (delivery_mode in ('simulation', 'provider_test')),
  approved_content_hash text not null,
  actual_destination_email text not null,
  idempotency_key text not null,
  status text not null default 'CLAIMED'
    check (status in ('CLAIMED', 'TEST_SENT', 'TEST_FAILED', 'TEST_BLOCKED', 'TEST_ALREADY_PROCESSED')),
  request_fingerprint text not null default '',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  provider_message_id text,
  retryable boolean not null default false,
  sanitized_error_code text,
  sanitized_error_message text,
  initiated_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, idempotency_key),
  constraint outreach_send_attempts_recipient_fk
    foreign key (tenant_id, campaign_recipient_id)
    references public.outreach_campaign_recipients (tenant_id, id)
    on delete restrict,
  constraint outreach_send_attempts_campaign_fk
    foreign key (tenant_id, campaign_id)
    references public.outreach_campaigns (tenant_id, id)
    on delete restrict,
  constraint outreach_send_attempts_lead_fk
    foreign key (tenant_id, lead_id)
    references public.leads (tenant_id, id)
    on delete restrict
);

create index if not exists outreach_send_attempts_tenant_recipient_idx
  on public.outreach_send_attempts (tenant_id, campaign_recipient_id);

create index if not exists outreach_send_attempts_tenant_status_idx
  on public.outreach_send_attempts (tenant_id, status);

-- Atomic idempotent delivery claim (server-only via service role or security definer).
create or replace function public.claim_outreach_send_attempt(
  p_tenant_id uuid,
  p_campaign_id uuid,
  p_recipient_id uuid,
  p_lead_id uuid,
  p_message_version text,
  p_idempotency_key text,
  p_request_fingerprint text,
  p_initiated_by uuid,
  p_destination_email text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient public.outreach_campaign_recipients%rowtype;
  v_lead public.leads%rowtype;
  v_lead_state public.outreach_lead_states%rowtype;
  v_existing public.outreach_send_attempts%rowtype;
  v_attempt public.outreach_send_attempts%rowtype;
begin
  if auth.uid() is not null and p_tenant_id not in (select public.current_user_tenant_ids()) then
    return jsonb_build_object('result', 'forbidden', 'reason', 'tenant_access_denied');
  end if;

  select * into v_recipient
    from public.outreach_campaign_recipients
   where tenant_id = p_tenant_id and id = p_recipient_id
   for update;

  if not found then
    return jsonb_build_object('result', 'not_found', 'reason', 'recipient_not_found');
  end if;

  if v_recipient.campaign_id <> p_campaign_id or v_recipient.lead_id <> p_lead_id then
    return jsonb_build_object('result', 'forbidden', 'reason', 'recipient_scope_mismatch');
  end if;

  if v_recipient.draft_status not in ('APPROVED', 'OPENED_EXTERNALLY') then
    return jsonb_build_object('result', 'blocked', 'reason', 'not_approved');
  end if;

  if v_recipient.approval_content_hash is null or v_recipient.approval_content_hash <> p_message_version then
    return jsonb_build_object('result', 'blocked', 'reason', 'approval_stale_or_missing');
  end if;

  if v_recipient.sent_at is not null or v_recipient.send_idempotency_key is not null then
    return jsonb_build_object(
      'result', 'already_processed',
      'idempotency_key', coalesce(v_recipient.send_idempotency_key, p_idempotency_key)
    );
  end if;

  select * into v_lead from public.leads where tenant_id = p_tenant_id and id = p_lead_id;
  if not found then
    return jsonb_build_object('result', 'not_found', 'reason', 'lead_not_found');
  end if;

  if v_lead.status = 'bounced' then
    return jsonb_build_object('result', 'blocked', 'reason', 'lead_bounced');
  end if;

  select * into v_lead_state from public.outreach_lead_states
   where tenant_id = p_tenant_id and lead_id = p_lead_id;

  if found and v_lead_state.consent_status = 'unsubscribed' then
    return jsonb_build_object('result', 'blocked', 'reason', 'lead_unsubscribed');
  end if;

  select * into v_existing
    from public.outreach_send_attempts
   where tenant_id = p_tenant_id and idempotency_key = p_idempotency_key;

  if found then
    if v_existing.request_fingerprint <> p_request_fingerprint then
      return jsonb_build_object('result', 'conflict', 'reason', 'idempotency_fingerprint_mismatch');
    end if;
    return jsonb_build_object(
      'result', 'already_processed',
      'attempt_id', v_existing.id,
      'idempotency_key', v_existing.idempotency_key,
      'provider_message_id', v_existing.provider_message_id
    );
  end if;

  insert into public.outreach_send_attempts (
    tenant_id,
    campaign_id,
    campaign_recipient_id,
    lead_id,
    provider,
    delivery_mode,
    approved_content_hash,
    actual_destination_email,
    idempotency_key,
    status,
    request_fingerprint,
    started_at,
    initiated_by
  ) values (
    p_tenant_id,
    p_campaign_id,
    p_recipient_id,
    p_lead_id,
    'simulation',
    'simulation',
    p_message_version,
    p_destination_email,
    p_idempotency_key,
    'CLAIMED',
    p_request_fingerprint,
    now(),
    p_initiated_by
  )
  returning * into v_attempt;

  return jsonb_build_object(
    'result', 'claimed',
    'attempt_id', v_attempt.id,
    'idempotency_key', v_attempt.idempotency_key,
    'reclaimed', false
  );
exception
  when unique_violation then
    select * into v_existing
      from public.outreach_send_attempts
     where tenant_id = p_tenant_id and idempotency_key = p_idempotency_key;
    if v_existing.request_fingerprint <> p_request_fingerprint then
      return jsonb_build_object('result', 'conflict', 'reason', 'idempotency_fingerprint_mismatch');
    end if;
    return jsonb_build_object(
      'result', 'already_processed',
      'attempt_id', v_existing.id,
      'idempotency_key', v_existing.idempotency_key
    );
end;
$$;

create or replace function public.complete_outreach_send_attempt(
  p_tenant_id uuid,
  p_attempt_id uuid,
  p_status text,
  p_provider_message_id text,
  p_error_code text,
  p_error_message text,
  p_recipient_id uuid,
  p_sent_by uuid,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.outreach_send_attempts%rowtype;
  v_recipient_updated uuid;
begin
  update public.outreach_send_attempts
     set status = p_status,
         completed_at = now(),
         provider_message_id = p_provider_message_id,
         sanitized_error_code = p_error_code,
         sanitized_error_message = p_error_message,
         updated_at = now()
   where tenant_id = p_tenant_id and id = p_attempt_id
   returning * into v_attempt;

  if not found then
    return jsonb_build_object('result', 'not_found');
  end if;

  if p_status = 'TEST_SENT' then
    update public.outreach_campaign_recipients
       set draft_status = 'DELIVERED',
           sent_at = now(),
           sent_by = p_sent_by,
           send_idempotency_key = p_idempotency_key,
           updated_at = now()
     where tenant_id = p_tenant_id
       and id = p_recipient_id
       and sent_at is null
     returning id into v_recipient_updated;

    if v_recipient_updated is not null then
      update public.outreach_campaigns
         set sent_count = sent_count + 1,
             updated_at = now()
       where tenant_id = p_tenant_id and id = v_attempt.campaign_id;
    end if;
  end if;

  return jsonb_build_object('result', 'ok', 'attempt_id', v_attempt.id);
end;
$$;

revoke all on function public.claim_outreach_send_attempt(uuid, uuid, uuid, uuid, text, text, text, uuid, text) from public;
revoke all on function public.complete_outreach_send_attempt(uuid, uuid, text, text, text, text, uuid, uuid, text) from public;
grant execute on function public.claim_outreach_send_attempt(uuid, uuid, uuid, uuid, text, text, text, uuid, text) to authenticated, service_role;
grant execute on function public.complete_outreach_send_attempt(uuid, uuid, text, text, text, text, uuid, uuid, text) to service_role;
