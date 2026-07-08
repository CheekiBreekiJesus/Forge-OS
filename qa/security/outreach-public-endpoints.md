# Outreach Public Endpoints QA

Date: 2026-07-02

## Endpoints

- `GET /{locale}/unsubscribe?token=...`
- `POST /api/outreach/unsubscribe`
- `POST /api/outreach/brevo/webhook`

## Checks

- Invalid unsubscribe tokens return a generic `invalid_token`.
- Missing durable storage returns `durable_store_unavailable`.
- Webhook requires configured shared secret.
- Webhook rejects non-JSON content.
- Webhook stores sanitized metadata only.
- Provider event duplicates are idempotent.
- Hard bounce, complaint, and unsubscribe events create suppressions in local reconciliation tests.

## No Live Calls

All tests use mocked provider/webhook/Supabase calls. No real campaign or live email was executed.
