# Step 7D1 Runtime Plan

Date: 2026-07-03

## Objective

Connect the existing send-job server mutations to production-style trusted context and hosted persistence while keeping delivery simulation-only.

## Confirmed Baseline

- Branch: `feat/email-outreach-send-jobs`
- Starting commit: `fb82211`
- Worktree was clean before edits.
- Existing server routes rejected by default because hosted auth and hosted repositories were not configured.
- `@supabase/supabase-js` and `@supabase/ssr` are not installed; existing durable outreach persistence uses server-only Supabase REST with service-role credentials.
- Brevo campaign delivery remains disabled and is outside this step.

## Runtime Shape

1. Route handler resolves the actor through `resolveTrustedSendJobActorContext`.
2. Production requests must present a real Supabase access token.
3. The server validates that token against Supabase Auth.
4. The server loads active tenant membership from `tenant_memberships`.
5. The server derives tenant, roles, and permissions from membership rows.
6. The route uses the hosted repository bundle when Supabase service credentials are configured.
7. Hosted campaign projection tables provide only approved sending snapshots.
8. Existing mutation services queue and process durable simulation jobs.

## Boundaries

- No browser-provided user ID, tenant ID, role, or permissions are trusted in production.
- Development/test trusted headers remain available only when `NODE_ENV !== "production"`.
- Multiple active tenant memberships require an explicit trusted tenant selector in a future step; this step fails closed instead of guessing.
- Hosted campaign projection is explicit preparation, not silent synchronization from IndexedDB.
- Delivery provider is forced to simulation through the existing server mutation parser and provider bundle.

## Migration Plan

Add a small additive migration for:

- active/disabled tenant membership status;
- tenant-scoped permissions;
- hosted outreach campaign projection;
- hosted outreach campaign recipient projection;
- hosted outreach activity events;
- explicit service-role Data API grants.

The Supabase CLI is not installed locally, so the SQL file is authored directly and must be applied later to a local or dedicated non-production database before production use.

## Validation Plan

- Baseline: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- Focused tests: production auth adapter, tenant membership rejection, header spoofing, hosted projection validation, hosted repository REST mapping, route dependency fail-closed behavior.
- Full validation after edits: requested repository commands where available and safe.
