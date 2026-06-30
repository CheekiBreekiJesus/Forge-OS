# MVP Live Readiness

ForgeOS is **not production-ready**. This document describes gaps between the current local MVP and staged/production deployment.

## 1. Current local MVP

- IndexedDB persistence (`forgeos:jhgomes:development`)
- Single implicit tenant (`tenant_jh_gomes`)
- Demo workflow creates durable leads → customers → quotes → production orders
- Outreach uses shared repository + server AI gateway
- Simulation email delivery only
- Reset/reseed for local development

## 2. Required Supabase work

- [ ] Connect `@supabase/supabase-js` server and browser clients
- [ ] Apply migrations: demo MVP, operational foundation, leadops outreach
- [ ] Implement `SupabaseRepositoryBundle`
- [ ] Replace IndexedDB registry in production/staging env
- [ ] Validate seed SQL against repository mappers

## 3. Authentication

- [ ] Supabase Auth (email/OAuth per product decision)
- [ ] Session middleware for Next.js App Router
- [ ] Protected routes for all modules except marketing site
- [ ] Service role key only on server

## 4. Tenant membership

- [ ] `tenant_users` / membership table
- [ ] Resolve active tenant from session
- [ ] Admin flow for multi-tenant SaaS (future)

## 5. Row-level security (RLS)

- [ ] Enable RLS on all tenant tables
- [ ] Policies: `tenant_id = auth.jwt() -> tenant_id`
- [ ] Integration tests against real Supabase project
- [ ] No cross-tenant reads in API routes

## 6. Server persistence

- [ ] Move write-heavy operations to Server Actions or API routes where appropriate
- [ ] Outreach workflow state on server for multi-device consistency
- [ ] Optimistic UI with server reconciliation

## 7. Smartlead live delivery

- [ ] `OUTREACH_DELIVERY_PROVIDER=smartlead` in staging only
- [ ] Webhook handling for bounces/replies
- [ ] Suppression list sync

## 8. Domain and Vercel deployment

- [ ] Vercel project + environment variables
- [ ] Custom domain + TLS
- [ ] Preview deployments per PR

## 9. Logging and monitoring

- [ ] Sentry (or equivalent) for client and server
- [ ] Structured logs without PII
- [ ] Uptime checks

## 10. Backups

- [ ] Supabase automated backups
- [ ] Recovery drill documented

## 11. GDPR considerations

- [ ] Lawful basis for outreach email
- [ ] Data processing agreement
- [ ] Export and erasure procedures
- [ ] Retention policy for leads and activity

## 12. Email suppression and unsubscribe

- [ ] Honor `consentStatus` at delivery boundary
- [ ] Provider-level suppression sync
- [ ] Unsubscribe link in live templates

## 13. Rate limits

- [ ] AI gateway rate limits per tenant
- [ ] API route throttling
- [ ] Smartlead send quotas

## 14. Audit retention

- [ ] Persist activity events server-side with retention policy
- [ ] Admin audit log UI

## 15. Secrets management

- [ ] Vercel encrypted env vars
- [ ] No secrets in client bundle
- [ ] Key rotation procedure

---

## Checklist summary

### LOCAL MVP READY

- [x] Shared IndexedDB persistence
- [x] Demo creates durable records
- [x] Outreach reads/writes shared leads
- [x] Dashboard metrics from repository
- [x] Customers, Quotations, Production lists
- [x] CSV import confirmation + persist
- [x] Reset/reseed
- [x] Deterministic E2E (no paid AI in CI)
- [x] Abacus remains server-side optional

### STAGING READY

- [ ] Supabase connected
- [ ] Auth + tenant resolution
- [ ] RLS validated
- [ ] Staging env on Vercel
- [ ] Smartlead sandbox
- [ ] Monitoring baseline

### PRODUCTION READY

- [ ] All staging items
- [ ] GDPR review complete
- [ ] Backup/restore tested
- [ ] Production Smartlead + suppression
- [ ] Security review
- [ ] Load/rate limit validation

**The application must not be described as production-ready until all PRODUCTION READY items are complete.**
