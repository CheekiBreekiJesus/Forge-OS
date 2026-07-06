# Email Delivery Self-Test

Purpose: verify Brevo, Gmail, or Outlook configuration from **Settings → Integrations → Email delivery diagnostics** before using campaign outreach UI.

This is separate from protected campaign test emails. It never uses campaign recipients or lead inboxes.

## Outreach test profile

Settings → Integrations → **Outreach test profile** stores tenant-scoped defaults in IndexedDB:

- company name / website
- sender display name / email / reply-to
- default test recipient
- signature, opt-out line, product focus
- default campaign language

Use **Load JH Gomes test defaults** for synthetic starter values. The profile is included in JSON backup/restore and never stores API keys.

## Where to use it

1. Open **Settings → Integrations**.
2. Scroll to **Email delivery diagnostics**.
3. Review redacted provider status.
4. Type an allowlisted recipient, subject, body, and confirmation `SEND SELF TEST`.
5. Submit **Send self-test email**.

## Required environment

Minimum for Brevo self-test:

```env
EMAIL_DELIVERY_PROVIDER=brevo
OUTREACH_DELIVERY_PROVIDER=brevo
OUTREACH_TEST_SEND_ENABLED=true
OUTREACH_REAL_SEND_ENABLED=false
BREVO_API_KEY=
BREVO_SENDER_EMAIL=sender@example.com
BREVO_SENDER_NAME=ForgeOS
OUTREACH_TEST_RECIPIENT_ALLOWLIST=your-test@example.com
```

Notes:

- `OUTREACH_REAL_SEND_ENABLED` may remain `false`. Campaign batch sending stays disabled.
- Self-test only runs when `OUTREACH_TEST_SEND_ENABLED=true`.
- Recipient must be typed manually and must appear in `OUTREACH_TEST_RECIPIENT_ALLOWLIST`.
- Default recipient field is empty unless the first allowlisted address is exposed by diagnostics.

## API

`POST /api/leadops/email-provider/self-test`

```json
{
  "recipientEmail": "your-test@example.com",
  "subject": "ForgeOS email delivery self-test",
  "messageBody": "This is a ForgeOS email delivery self-test message.",
  "confirmation": "SEND SELF TEST"
}
```

`GET /api/leadops/email-provider/diagnostic` returns redacted server-side status.

## Persistence

On success or failure, the browser stores:

- `outreachSendAttempts` with sentinel campaign/recipient IDs (`__email_delivery_self_test__`)
- `outreachProviderEvents` with sanitized provider metadata

No API keys, auth headers, or raw provider payloads are stored.

## Provider support

| Provider | Self-test |
| --- | --- |
| `simulation` | Accepted locally without network |
| `brevo` | Calls `POST https://api.brevo.com/v3/smtp/email` |
| `gmail` | Shows **Not configured yet** until implemented |
| `outlook` | Shows **Not configured yet** unless `OUTLOOK_GRAPH_ENABLED=true` and implemented |

## Error messages

| Condition | Message / code |
| --- | --- |
| Missing API key | `BREVO_API_KEY is missing.` / `configuration_missing` |
| Sender missing | `BREVO_SENDER_EMAIL` / `BREVO_SENDER_NAME` |
| Sender not verified / Brevo rejection | `provider_rejected` with sanitized provider message |
| Provider disabled | `configuration_missing` |
| Test sending disabled | `OUTREACH_TEST_SEND_ENABLED is false.` / `test_send_disabled` |
| Recipient not allowlisted | `recipient_not_allowed` |
| Network / timeout | `network_error` or `timeout` |

## Development logging

When `NODE_ENV` is not `production` and `FORGEOS_RUNTIME_MODE=development`, the server logs redacted self-test attempts and results to the terminal. API keys are never logged in full.

## Safety rules

- No campaign recipient is contacted.
- No arbitrary lead addresses are accepted.
- Production campaign sending behavior is unchanged.
- Real campaign sending remains off unless `OUTREACH_REAL_SEND_ENABLED=true`.

## Tests

```bash
npm test -- src/application/email-delivery-self-test-service.test.ts
npm test -- src/app/api/leadops/email-provider/self-test/route.test.ts
npm test -- src/features/email-delivery/provider.test.ts
```
