# Lead Segmentation and Campaign Plan — Step 2

Branch: `feat/email-outreach-live-mvp`  
Baseline: Step 1 commit `044ebc0`

## Goal

Browse imported leads, filter and evaluate sendability, build campaign segments with frozen recipient snapshots, and refresh snapshots explicitly while campaigns remain drafts.

## Reused foundations

| Area | Reuse |
|------|-------|
| Organizations | `Lead` + `LeadContact` from Step 1 |
| Lead list | `leadops-dashboard-shell.tsx` filters/search/selection |
| Campaigns | Existing seed campaigns + read-only repo (extended) |
| Consent | `Lead.consentStatus`, `outreachStatus` bounce |
| Backup | v3 extended to v4 with `campaignRecipients` |

## New modules

- `src/domain/campaign-types.ts` — extended campaign + recipient snapshot types
- `src/features/leadops/sendability.ts` — canonical sendability evaluator
- `src/features/leadops/lead-management.ts` — enriched rows, filters, pagination
- `src/features/leadops/segmentation.ts` — segment counts and candidate resolution
- `src/application/campaign-segmentation-service.ts` — create/refresh snapshots
- `src/persistence/indexeddb/campaign-repositories.ts` — campaign writes + recipients
- `src/components/leadops-lead-management-panel.tsx` — upgraded lead table
- `src/components/campaign-segment-builder-dialog.tsx` — segment preview + create
- `src/components/leadops-campaign-list-shell.tsx` — campaign list
- `src/components/leadops-campaign-detail-shell.tsx` — campaign detail

## Routes

- `/[locale]/leadops` — lead management (filters, selection, create campaign)
- `/[locale]/leadops/campaigns` — campaign list
- `/[locale]/leadops/campaigns/[campaignId]` — campaign detail + refresh recipients

## Out of scope

Email sending, Brevo, webhooks, background jobs, enrichment, Marketing Studio, template/draft generation (Step 3 placeholders only).
