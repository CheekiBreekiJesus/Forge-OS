-- RLS policies for production outreach vertical slice.

alter table public.outreach_campaign_recipients enable row level security;
alter table public.company_profiles enable row level security;
alter table public.sender_identities enable row level security;
alter table public.activity_events enable row level security;
alter table public.outreach_send_attempts enable row level security;

-- Tenant members can read outreach data required by UI.
create policy "tenant members read outreach campaigns"
  on public.outreach_campaigns for select
  using (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members read outreach recipients"
  on public.outreach_campaign_recipients for select
  using (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members read outreach send attempts"
  on public.outreach_send_attempts for select
  using (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members read company profiles"
  on public.company_profiles for select
  using (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members read sender identities"
  on public.sender_identities for select
  using (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members read activity events"
  on public.activity_events for select
  using (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members read outreach lead states"
  on public.outreach_lead_states for select
  using (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members read outreach messages"
  on public.outreach_messages for select
  using (tenant_id in (select public.current_user_tenant_ids()));

-- Controlled writes: recipients and campaigns managed by tenant members (draft workflow).
create policy "tenant members manage outreach campaigns"
  on public.outreach_campaigns for insert
  with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members update outreach campaigns"
  on public.outreach_campaigns for update
  using (tenant_id in (select public.current_user_tenant_ids()))
  with check (tenant_id in (select public.current_user_tenant_ids()));

create policy "tenant members manage outreach recipients"
  on public.outreach_campaign_recipients for all
  using (tenant_id in (select public.current_user_tenant_ids()))
  with check (tenant_id in (select public.current_user_tenant_ids()));

-- Audit events are append-only for tenant members.
create policy "tenant members insert activity events"
  on public.activity_events for insert
  with check (tenant_id in (select public.current_user_tenant_ids()));

-- Send attempts: direct client insert/update denied; claim/complete via security definer RPC + service role.
create policy "deny direct send attempt insert"
  on public.outreach_send_attempts for insert
  with check (false);

create policy "deny direct send attempt update"
  on public.outreach_send_attempts for update
  using (false);

create policy "deny direct send attempt delete"
  on public.outreach_send_attempts for delete
  using (false);

-- Provider events: service role writes; tenant members read when mapped to their tenant_key.
create policy "tenant members read provider events by public tenant id"
  on public.outreach_provider_events for select
  using (
    tenant_public_id in (
      select t.tenant_key from public.tenants t
       where t.id in (select public.current_user_tenant_ids())
    )
  );

grant select on public.outreach_send_attempts to authenticated;
grant select, insert, update on public.outreach_campaign_recipients to authenticated;
grant select, insert, update on public.outreach_campaigns to authenticated;
grant select, insert on public.activity_events to authenticated;
grant select on public.outreach_lead_states to authenticated;
grant select on public.outreach_messages to authenticated;
grant select on public.company_profiles to authenticated;
grant select on public.sender_identities to authenticated;

grant all on public.outreach_send_attempts to service_role;
grant all on public.outreach_campaign_recipients to service_role;
grant all on public.outreach_campaigns to service_role;
grant all on public.activity_events to service_role;
grant all on public.outreach_provider_events to service_role;
grant all on public.outreach_public_suppressions to service_role;
