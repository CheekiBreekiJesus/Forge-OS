# Outreach latest summary - Supabase 7D2 integration

**Date:** 2026-07-04
**Branch:** `integration/jh-gomes-outreach-supabase-7d2`

## Change

Merged the preserved Step 7D2 hosted campaign preparation work into the Supabase outreach release line.

The integration preserves:

- Supabase cookie-session authentication for server-owned outreach routes;
- stable deployment tenant selection through `FORGEOS_ACTIVE_TENANT_KEY`;
- server-side active tenant membership lookup;
- delivery claim RPC and durable send-attempt persistence;
- hosted campaign preparation, idempotent preparation status, and audit activity;
- trusted tenant selection for users with multiple active memberships;
- hosted migration static checks and focused send-job authorization tests.

## Security Notes

- Tenant and actor identity are derived from trusted server context.
- Production send-job routes do not trust browser-supplied actor, tenant, role, permission, recipient, or approved-content fields.
- Multiple active memberships require an explicit trusted tenant selector unless a stable deployment tenant key is configured.
- Hosted preparation and durable send jobs remain simulation-only.
- Brevo campaign batch sending and real email sends remain disabled.

## Validation

Validation for this integration branch is recorded in the task completion report after local checks run.

## Remaining Manual Review

- Apply migrations only against local or approved non-production Supabase/Postgres.
- Verify hosted campaign preparation with real Supabase Auth cookie sessions before any production rollout.
- Keep real campaign sending blocked until explicit approval.
