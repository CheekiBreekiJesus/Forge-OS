# Brevo Transactional Email Setup

Checked: 2026-07-02.

Official references:

- Brevo API reference, "Send a transactional email": https://developers.brevo.com/reference/send-transac-email
- Brevo guide, "Send a transactional email": https://developers.brevo.com/docs/send-a-transactional-email
- Brevo API reference, "Create a webhook": https://developers.brevo.com/reference/create-webhook

Verified implementation details:

- Transactional endpoint: `POST https://api.brevo.com/v3/smtp/email`.
- Authentication: request header `api-key`.
- Inline-content request shape uses `sender`, `to`, `subject`, `textContent`, optional `htmlContent`, and optional `replyTo`.
- `sender` accepts email and optional name. Sender and subject are required when no `templateId` is used.
- `replyTo` accepts an email address and optional display name.
- Successful send response is `201` with `messageId`; batched/versioned flows can return `messageIds`.
- Brevo documents `400 Bad Request` for malformed send requests. ForgeOS also classifies common HTTP outcomes defensively: unauthorized, forbidden, credits, rate limit, timeout, provider unavailable, and provider rejection.
- Single-message test mode sends one recipient in `to`. Batch sending, templates, scheduling, attachments, and message versions are intentionally out of scope for Step 6.
- Webhooks are available through `POST /v3/webhooks` and support transactional events such as request, delivered, hardBounce, softBounce, blocked, spam, invalid, deferred, click, opened, uniqueOpened, and unsubscribed. ForgeOS does not implement webhooks in Step 6.

Activation requires all of these to be configured in a private runtime environment:

```env
EMAIL_DELIVERY_PROVIDER=brevo
OUTREACH_REAL_SEND_ENABLED=true
OUTREACH_TEST_SEND_ENABLED=true
BREVO_API_KEY=
BREVO_SENDER_EMAIL=sender@example.com
BREVO_SENDER_NAME=ForgeOS
BREVO_REPLY_TO=reply@example.com
OUTREACH_TEST_RECIPIENT_ALLOWLIST=internal@example.com
```

Do not commit real values. Diagnostics expose booleans, counts, and missing variable names only.
