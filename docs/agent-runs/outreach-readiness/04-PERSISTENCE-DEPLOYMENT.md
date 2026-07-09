# Workstream D — Persistence and Deployment

**Date:** 2026-07-09

## Source of truth

| Data | Local MVP | Hosted production |
|------|-----------|-------------------|
| Campaign authoring | IndexedDB | IndexedDB (gap) / hosted projection prep |
| Send jobs | IndexedDB | Supabase `outreach_send_jobs*` |
| Send attempts | IndexedDB | Supabase |
| Provider events | IndexedDB / Supabase | Supabase `outreach_provider_events` |
| Suppressions | Both paths | Supabase |

## Tenant isolation

- Outreach tables tenant-scoped
- Send-job tables service-role only with server auth boundary
- Webhook ingestion maps events to tenant via tags/metadata

## Minimum deployment target

1. Hosted ForgeOS (HTTPS)
2. Supabase project with outreach migrations applied
3. Brevo API + verified sender
4. Public webhook endpoint for Brevo events
5. Env: `FORGEOS_PUBLIC_BASE_URL`, `OUTREACH_UNSUBSCRIBE_SECRET`, `BREVO_*`, gates

## Gaps

- Campaign create/replace not in Supabase repos (browser IndexedDB)
- Dual tenant ID model (UUID vs `tenant_key`)
- Real Brevo batch requires hosted send-job API (not local browser processor)

## Rollback / emergency pause

1. Set `OUTREACH_REAL_SEND_ENABLED=false` and redeploy
2. Pause active send jobs via UI or `/api/outreach/send-jobs/pause`
3. Cancel queued recipients via cancel endpoint
4. Monitor `outreach_provider_events` for in-flight deliveries
