-- Hosted outreach preparation status
-- Scope: idempotent approved-campaign preparation before durable simulation send jobs.

alter table public.outreach_hosted_campaigns
  add column if not exists snapshot_fingerprint text;

create index if not exists outreach_hosted_campaigns_snapshot_idx
  on public.outreach_hosted_campaigns (tenant_id, campaign_ref, snapshot_fingerprint);

comment on column public.outreach_hosted_campaigns.snapshot_fingerprint is
  'Deterministic fingerprint of the approved campaign and recipient snapshot used for idempotent server-send preparation.';
