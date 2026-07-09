# Workstream C — Brevo Production Readiness

**Date:** 2026-07-09

## Provider configuration

| Control | Status |
|---------|--------|
| API key server-only | Verified — `BREVO_API_KEY` read only in server modules |
| Never exposed to browser | Verified — client calls `/api/leadops/email-provider/test-send` |
| Configurable sender | `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `BREVO_REPLY_TO` |
| Simulation default | `OUTREACH_DELIVERY_PROVIDER=simulation` |
| Real send gate | `OUTREACH_REAL_SEND_ENABLED=false` default |
| Test send gate | `OUTREACH_TEST_SEND_ENABLED=false` default |
| Timeouts | `OUTREACH_PROVIDER_TIMEOUT_MS` (default 15s) |
| Request IDs stored | `providerMessageId` on attempts |

## Sending modes

| Mode | Gate | Recipient rule |
|------|------|----------------|
| `simulation` | Always | Any (no external send) |
| `provider_test` | `OUTREACH_TEST_SEND_ENABLED` + allowlist | Allowlisted only |
| `real_send` | `OUTREACH_REAL_SEND_ENABLED` + full config | Approved campaign recipients |

## Server API gates (this branch)

- Protected test send: auth + rate limit when `FORGEOS_PERSISTENCE_MODE=supabase`
- Hosted send-job queue: `QUEUE BREVO` confirmation when `isRealCampaignSendReady()`
- Daily limit capped at 25 for Brevo jobs
- Unsubscribe URL required for all Brevo sends

## Administrator checklist (obtain from Brevo — do not fabricate)

- [ ] Verified sender email and display name
- [ ] SPF record from Brevo domain authentication
- [ ] DKIM keys from Brevo
- [ ] DMARC policy (organizational DNS)
- [ ] API key in secure env storage
- [ ] Webhook URL + `BREVO_WEBHOOK_SECRET`
- [ ] Reply-to mailbox monitored
- [ ] Account sending limits reviewed
- [ ] Gradual volume plan for pilot

## Compliance note

ForgeOS captures approval hashes, send attempts, provider events, and suppression records. Legal basis and consent decisions remain JH Gomes operational responsibility.
