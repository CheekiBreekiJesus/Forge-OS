# Hosted Campaign Projection

Date: 2026-07-03

## Purpose

LeadOps campaign authoring still starts in local IndexedDB. Server-side send jobs cannot read browser IndexedDB, so Step 7D1 adds a minimal hosted projection for approved campaign snapshots.

The projection is not a full CRM or LeadOps migration.

## Tables

Migration `202607030001_outreach_hosted_runtime_projection.sql` adds:

- `outreach_hosted_campaigns`;
- `outreach_hosted_campaign_recipients`;
- `outreach_hosted_activity_events`.

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

The UI button/panel for this route remains a Step 7D2 follow-up.
