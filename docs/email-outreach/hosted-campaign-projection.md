# Hosted Campaign Projection

Date: 2026-07-03

## Purpose

LeadOps campaign authoring still starts in local IndexedDB. Server-side send jobs cannot read browser IndexedDB, so Step 7D1 adds a minimal hosted projection for approved campaign snapshots. Step 7D2 adds the user-facing preparation panel and idempotent prepared-state tracking.

The projection is not a full CRM or LeadOps migration.

## Tables

Migration `202607030001_outreach_hosted_runtime_projection.sql` adds:

- `outreach_hosted_campaigns`;
- `outreach_hosted_campaign_recipients`;
- `outreach_hosted_activity_events`.

Migration `202607030002_outreach_hosted_preparation_status.sql` adds:

- `outreach_hosted_campaigns.snapshot_fingerprint`;
- an index for `(tenant_id, campaign_ref, snapshot_fingerprint)`.

The projection stores only the fields required for safe simulation processing:

- campaign status, language, sender profile reference, and template metadata;
- company and sender snapshots needed by sender-context validation;
- approved recipient snapshot fields;
- approved subject/plain/html content;
- approval hash, approval actor, and approval timestamp;
- stable campaign, recipient, lead, and contact references.

## Runtime Adapter

`createHostedSendJobRepositoryBundle` maps the projection tables plus durable send-job tables into the existing mutation service.

The adapter is server-only and uses `SUPABASE_SERVICE_ROLE_KEY`. It must not be imported into client components.

## Handoff Boundary

`POST /api/outreach/send-jobs/prepare-campaign` is the server handoff boundary. It serializes approved campaign snapshots only, revalidates approval hashes server-side, and labels the action as preparation for server sending, not sending.

The campaign detail page includes a **Prepare for server sending** panel. It shows approval status, approved recipient count, stale approvals, trusted tenant selection, prepared state, and recent hosted audit entries. The client display is advisory only; the server route still validates tenant membership, permission, campaign approval, sender context, recipient approval hashes, and simulation-only delivery mode.

`GET /api/outreach/send-jobs/prepare-campaign/status?campaignId=...` returns the hosted prepared state for authorized users. `GET /api/outreach/send-jobs/tenant-memberships` returns only server-derived active memberships and send-job permissions that are safe for the selector.

Preparation is idempotent. If the hosted `snapshot_fingerprint` matches the approved campaign and recipient snapshot, the route reuses the existing projection and records a reuse audit event instead of rewriting recipients.

## Disabled Live Delivery

This workflow does not create a send job, process a send job, call Brevo, call SMTP, or enable background workers. Hosted execution remains durable simulation only until the Step 9 real-send gate is explicitly approved.

## Migration Application

Static validation:

```bash
npm run outreach:hosted:migration:check
npm run test -- src/features/email-delivery/outreach-migration-static.test.ts
```

Local Supabase validation, using repo-local CLI resolution:

```bash
npx supabase db reset --local
```

Approved non-production project validation:

```bash
npx supabase link --project-ref <non-production-project-ref>
npx supabase db push --linked
```

Do not apply these migrations to production until local or staging validation confirms table creation, RLS state, service-role grants, idempotent preparation, audit persistence, durable simulation send-job creation, and restart-safe retrieval.
