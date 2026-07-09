# Workstream A — Campaign UI Audit

**Branch:** `integration/outreach-operational-readiness`  
**Date:** 2026-07-09

## Journey coverage

| Step | Status | Notes |
|------|--------|-------|
| Import contacts | Partial | Lead detail path works; post-import campaign CTA missing |
| Map columns | OK | Import wizard present |
| Validate/dedupe | OK | Server validation exists |
| Review rejected rows | Partial | Rejection UI varies by path |
| Create/select campaign | OK | Campaign list + detail |
| Compose email | OK | Template + per-recipient drafts |
| Personalization fields | OK | Token merge in drafts |
| Preview | Partial | Lead detail preview; campaign path limited |
| Select recipients | OK | Segmentation + inclusion |
| Approve content | OK | Per-recipient approval required |
| Test email | OK | Protected Brevo test when env configured |
| Schedule/initiate send | Partial | Local simulation queue only in browser MVP |
| Monitor delivery | Partial | Send-job panel; provider events when Supabase |
| Opens/clicks/bounces | Partial | Webhook ingestion exists; UI surfacing limited |
| Pause/stop | OK | Pause/cancel on send jobs |
| Retry failures | Partial | Server retry API; UI exposure limited |
| Export/follow-up | Gap | No export workflow |

## Fixes applied (this branch)

- Dashboard campaign cards link to campaign detail (were dead ends)
- Removed hardcoded fake import summary on lead detail
- `providerStates.sent` relabeled to simulated delivery (EN/PT)
- Suppression panel locale-aware links (removed hardcoded `pt-PT`)

## Remaining blockers

| Severity | Finding |
|----------|---------|
| Blocker | Dual workflows (lead detail vs campaign bulk) diverge |
| Blocker | Local queue processor only runs while page is open |
| High | Hosted Brevo batch queue not exposed in campaign UI yet |
| High | IndexedDB vs Supabase operator confusion |
| Medium | Queue requires 100% approval before send |
| Medium | Validation messages in `delivery-validation.ts` not fully i18n |

## Mobile/desktop

Campaign detail and queue panels are responsive; lead detail workspace is dense on mobile but usable at 390×844.
