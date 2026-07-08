# Email Outreach Integration — UI Report

**Branch:** `feat/email-outreach-mvp-integration`  
**Review date:** 2026-07-03

## Viewports exercised (acceptance suite)

| Viewport | Size | Routes |
| --- | --- | --- |
| Mobile | 390×844 | `/pt-PT`, `/pt-PT/leadops`, settings, customizer |
| Tablet | 768×1024 | Same |
| Desktop | 1440×900 | Same |

## Locales and themes

- PT-PT and EN routes pass smoke and outreach acceptance specs
- Dark and light theme toggle verified on dashboard refresh spec
- Send-job simulation spec verifies EN labels + light theme + mobile layout

## UI areas verified

| Area | Status |
| --- | --- |
| Import wizard | Pass (`lead-import-wizard.spec.ts`, acceptance 03) |
| Lead table and filters | Pass (`lead-segmentation.spec.ts`) |
| Campaign creation / drafts | Pass (`campaign-templates-drafts.spec.ts`) |
| Manual Gmail/Outlook handoff | Pass (`campaign-review-manual-send.spec.ts`) |
| Simulation send jobs | Pass (`campaign-send-job-simulation.spec.ts`) |
| Suppression controls | Pass (`campaign-release-checkpoint.spec.ts`) |
| Provider events / unsubscribe | Covered in unit tests |
| Production-disabled messaging | Send controls labelled simulation; no Brevo batch UI |

## Console errors

Acceptance spec `08-controls-and-console-audit` reports no uncaught console errors on primary routes including LeadOps and campaigns.

## Privacy

No private screenshots or real imported data in reports.
