# Send Job Server Mutations Plan

Date: 2026-07-03
Branch: `feat/email-outreach-send-jobs`
Starting commit: `b951faa`

## Objective

Add trusted server mutation boundaries for durable outreach send jobs without enabling real Brevo campaign sends, applying migrations, or changing production infrastructure.

## Current Baseline

- Local IndexedDB send-job simulation is implemented and tested.
- The Supabase durable store helper is server-only, but it currently covers durable writes/RPC helpers rather than full hosted campaign queue orchestration.
- The application does not yet have production authentication or tenant membership resolution.
- Existing preview roles are local UI state only and are not a trusted authorization boundary.
- Campaign detail UI currently operates on browser-local repositories.

## Implementation Approach

1. Add a server-only trusted actor context abstraction.
2. Resolve tenant, actor, role, and correlation ID from trusted server context.
3. Provide only a development/test header adapter until production auth is selected.
4. Reject body-supplied tenant, actor, role, permission, and recipient data.
5. Add explicit send-job permissions and role mapping.
6. Add input parsers for queue, process, pause, resume, cancel, retry, and status operations.
7. Add server mutation service functions that load authoritative campaign/job data through injected repositories.
8. Add Next.js route handlers for each mutation and status query.
9. Return sanitized operational results only.
10. Record audit events with sanitized metadata.

## Boundaries

- No live Brevo campaign sending.
- No hosted Supabase mutation.
- No migration application.
- No production deployment.
- No private customer data.
- No browser-supplied recipient list or approved content.

## Production Limitation

Because ForgeOS does not yet have production auth, production route execution must remain blocked unless a trusted auth adapter is configured. The development/test adapter may use explicit server-trusted headers for local and automated test coverage only.

## Step 7D Prerequisites

- Choose and wire production auth/session provider.
- Map authenticated users to tenant memberships.
- Add hosted repository adapter for campaign/send-job persistence.
- Validate Supabase migration and RPCs against a real Postgres/Supabase environment.
- Keep Brevo campaign batch sending disabled until explicit approval.
