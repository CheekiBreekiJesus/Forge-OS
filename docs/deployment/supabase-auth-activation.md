# Supabase Auth Activation Runbook

Date: 2026-07-05

## Scope

This runbook activates the ForgeOS Supabase OAuth and tenant-membership foundation for an approved non-production deployment. It does not apply production migrations, bootstrap real users, or configure provider secrets in Git.

## Environment Contract

Public browser-safe variables:

| Variable | Local mode | Supabase mode | Source |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Optional | Recommended | ForgeOS hosted origin. |
| `FORGEOS_PUBLIC_BASE_URL` | Optional | Recommended | ForgeOS hosted origin. |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Required | Supabase project API URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Required | Supabase publishable or legacy anon key. |
| `NEXT_PUBLIC_FORGEOS_PERSISTENCE_MODE` | `local` | `supabase` | Deployment config. |

Server-only variables:

| Variable | Local mode | Supabase mode | Source |
| --- | --- | --- | --- |
| `FORGEOS_PERSISTENCE_MODE` | `local` | `supabase` | Deployment config. |
| `SUPABASE_URL` | Optional | Required for server operations | Supabase project API URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Blank unless needed | Required for server-side membership lookup/admin operations | Supabase server secret storage only. |
| `FORGEOS_ACTIVE_TENANT_KEY` | Optional | Optional deployment default | Tenant configuration. |
| `FORGEOS_TEST_DATABASE_URL` | Optional | Test only | Local Docker or CI database. |
| `BREVO_WEBHOOK_SECRET` | Optional | Required for Brevo webhooks | Provider secret storage. |
| `OUTREACH_UNSUBSCRIBE_SECRET` | Optional | Required for signed unsubscribe behavior | Secret storage. |
| `OUTREACH_WEBHOOK_TENANT_ID` | Optional | Required only for configured webhook tenant routing | Private deployment config. |
| `EMAIL_DELIVERY_PROVIDER`, `OUTREACH_DELIVERY_PROVIDER`, `OUTREACH_REAL_SEND_ENABLED` | Simulation defaults | Explicit hosted delivery settings | Deployment config. |

Never expose service-role keys, webhook secrets, unsubscribe secrets, OAuth client secrets, refresh tokens, or provider API keys through `NEXT_PUBLIC_*` variables.

## Database Safety

Before applying migrations:

1. Confirm the Git branch and commit.
2. Identify the Supabase project reference without recording secrets.
3. Confirm the project is explicitly approved as local, disposable development, or staging.
4. Confirm production URLs, production flags, and live customer data are absent.
5. Run local validation first.

If the target cannot be positively identified as non-production, do not apply migrations. Continue with local/static validation only.

## Local Validation Commands

```bash
npx supabase db reset --local --yes
Get-Content scripts/admin/validate-auth-membership-upgrade.sql | docker exec -i <local-db-container> psql -q -v ON_ERROR_STOP=1 -U postgres -d postgres
npm run outreach:hosted:migration:check
$env:FORGEOS_TEST_DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres'; npm run test:supabase:integration
```

Use PowerShell equivalents for Windows. The connection string above is the standard local Supabase Docker test database and must not be replaced with production credentials.

## Staging Activation Order

1. Apply migrations to approved staging.
2. Verify `tenant_memberships.status` default is `pending`.
3. Verify `tenant_memberships_status_check` allows only `pending`, `active`, `suspended`, and `revoked`.
4. Verify `current_user_tenant_ids()` filters `status = 'active'`.
5. Configure Supabase Auth site URL and redirect allow-list.
6. Configure Google and/or Microsoft provider secrets in Supabase/provider dashboards.
7. Run `docs/auth/staging-oauth-smoke-test.md`.
8. Bootstrap only authorized synthetic or staging users with `scripts/admin/bootstrap-tenant-membership.sql`.

## Release candidate note (2026-07-05)

This runbook is validated locally on `integration/jh-gomes-release-candidate`. Hosted Supabase has **not** been modified by the integration branch. External OAuth provider configuration remains required before staging smoke tests.

## Rollback Notes

This branch contains a forward-only migration. For staging rollback, restore the database from a pre-migration backup or use a disposable project reset. Do not attempt ad hoc production rollback SQL without a reviewed rollback plan.
