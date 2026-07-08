# Brevo protected test readiness

Checked: 2026-07-08.

This runbook prepares Francisco for **one** protected Brevo test email using the campaign review workflow. It does not enable campaign batch sending.

## Prerequisites

- Branch: `release/jh-gomes-outreach-supabase`
- Local dependencies installed with `npm ci`
- Private `.env.local` configured (never commit)
- Brevo sender verified in the Brevo dashboard
- `OUTREACH_TEST_SEND_ENABLED=true`
- `OUTREACH_REAL_SEND_ENABLED=false` (bulk/campaign Brevo sends stay blocked)
- `EMAIL_DELIVERY_PROVIDER=brevo`
- `OUTREACH_TEST_RECIPIENT_ALLOWLIST` contains **only** Francisco's personal test address
- `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, `BREVO_REPLY_TO`, `FORGEOS_PUBLIC_BASE_URL`, and `OUTREACH_UNSUBSCRIBE_SECRET` present in `.env.local`
- Sentry is optional and may remain unset

## Route to open

1. Start the app: `npm run dev`
2. Open: `http://localhost:3000/pt-PT/leadops/campaigns`
3. Open an existing campaign with at least one drafted recipient, or create one from imported leads
4. Generate drafts and approve **one** recipient
5. In the recipient review panel, use **Protected Brevo test send**

Direct campaign example (seed data): `http://localhost:3000/pt-PT/leadops/campaigns/campaign_001`

## Sender identity expected

ForgeOS uses the verified Brevo sender from `.env.local`:

- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`
- `BREVO_REPLY_TO` when configured

The browser never receives the Brevo API key.

## Allowed recipient

Use **only** the personal address listed in `OUTREACH_TEST_RECIPIENT_ALLOWLIST`.

Do **not** send to the lead's original email address. The protected test path is designed to keep the lead untouched.

## Confirmation phrase

Type exactly:

```text
SEND TEST
```

## Buttons to press

1. **Generate campaign drafts** (if not already generated)
2. **Approve draft** on one recipient
3. **Send protected test email** (opens the protected form)
4. Enter the allowlisted personal test address
5. Enter confirmation `SEND TEST`
6. **Send protected test email** (submit)

Do **not** press:

- Queue simulation / batch processing controls for a live Brevo campaign
- **Simulate send** if you intend to test Brevo delivery (simulation does not call Brevo)
- **Mark as sent externally**

## Expected success state

- UI message: protected test accepted by Brevo
- Recipient remains **approved**, not marked as manually sent
- A protected test attempt is recorded locally in outreach send attempts
- Re-submitting the same approved content to the same allowlisted address returns an already-processed result without a second provider call

## Verify in the received email

- Subject and body match the approved draft
- Plain-text and HTML versions render correctly
- Portfolio image absence does not break layout
- Opt-out link is present and uses the configured public base URL
- Reply-to matches the configured sender settings

## Verify in Brevo

- One transactional message appears in the Brevo dashboard
- Sender matches the verified Brevo sender
- Recipient is the allowlisted personal address only

## If the message goes to spam

- Check sender/domain authentication in Brevo
- Send only to the allowlisted personal mailbox first
- Avoid repeated sends; idempotency blocks duplicate provider calls for the same approved content

## If Brevo rejects the sender

- Confirm the sender is verified in Brevo
- Confirm `BREVO_SENDER_EMAIL` and `BREVO_SENDER_NAME` match the verified sender
- Check Brevo dashboard error details; ForgeOS surfaces sanitized errors only

## Confirm no second email was sent

- Repeat the same protected test action: ForgeOS should report the attempt was already processed
- Check Brevo dashboard message count remains at one for this test
- Check the recipient is still not marked as manually sent in ForgeOS

## Keep bulk sending disabled after the test

Leave these unchanged:

- `OUTREACH_REAL_SEND_ENABLED=false`
- Do not queue Brevo campaign jobs
- Use only the protected test-send panel for any further testing today

## Optional diagnostics

Open Settings → Integrations → Email delivery provider → **Refresh provider status**.

Expected booleans:

- Provider: `brevo`
- Configured: yes
- Test send gate: yes
- Real send gate: no
- Allowlist count: at least 1

## Sentry status

Sentry is deferred. Missing `SENTRY_*` values do not block outreach testing.
