# JH Gomes Custom-Domain Mailbox Connector

Date: 2026-07-03

## Purpose

ForgeOS can connect to the JH Gomes commercial mailbox through provider-neutral SMTP and IMAP settings. The connector supports safe, read-only connection diagnostics. Live campaign delivery and mailbox mutation remain disabled by default.

## Mailbox Server Settings

| Setting | Value |
| --- | --- |
| Account | `comercial@jhgomes.com` |
| Incoming protocol | IMAP (not POP3) |
| IMAP host | `mail.jhgomes.com` |
| IMAP port | `993` |
| IMAP TLS | required (`secure=true`) |
| SMTP host | `mail.jhgomes.com` |
| SMTP port | `465` |
| SMTP TLS | required (`secure=true`) |
| Authentication | required for both protocols |

TLS certificate verification is always enabled. ForgeOS does not support `rejectUnauthorized=false`.

## Required Environment Variables

Add these to `.env.local`. Password fields must remain blank in `.env.example` and committed templates.

```env
JHGOMES_MAIL_ENABLED=false
JHGOMES_SMTP_HOST=mail.jhgomes.com
JHGOMES_SMTP_PORT=465
JHGOMES_SMTP_SECURE=true
JHGOMES_SMTP_USERNAME=comercial@jhgomes.com
JHGOMES_SMTP_PASSWORD=

JHGOMES_IMAP_HOST=mail.jhgomes.com
JHGOMES_IMAP_PORT=993
JHGOMES_IMAP_SECURE=true
JHGOMES_IMAP_USERNAME=comercial@jhgomes.com
JHGOMES_IMAP_PASSWORD=

JHGOMES_MAIL_CONNECTION_TEST_ENABLED=false
JHGOMES_MAIL_READ_SYNC_ENABLED=false
JHGOMES_MAIL_LIVE_SEND_ENABLED=false
JHGOMES_MAIL_TIMEOUT_MS=15000
```

All feature flags default to `false`.

## Safe Password Provisioning

1. Copy `.env.example` to `.env.local`.
2. Set `JHGOMES_SMTP_PASSWORD` and `JHGOMES_IMAP_PASSWORD` locally only.
3. Never commit, log, paste, or document the real password.
4. ForgeOS redacts password material from diagnostics, API responses, and CLI output.

## Manual Connection Test Procedure

Only run a live connection test after inserting the password locally and explicitly enabling the connector.

1. Set `JHGOMES_MAIL_ENABLED=true`.
2. Set `JHGOMES_MAIL_CONNECTION_TEST_ENABLED=true`.
3. Keep `JHGOMES_MAIL_LIVE_SEND_ENABLED=false`.
4. Choose one method:
   - **CLI:** `npm run jh-gomes-mail:connection-test`
   - **API:** `POST /api/integrations/jh-gomes-mail/connection-test` with JSON body `{ "confirmation": "TEST MAIL CONNECTION" }` and Step 7D1 trusted actor context.

The live test only:

- establishes TLS with certificate verification;
- authenticates through SMTP without sending a message;
- authenticates through IMAP;
- lists mailbox folders read-only;
- disconnects cleanly.

It does not send email, delete messages, move messages, flag messages, or mark messages as read.

## Expected Diagnostic Results

Diagnostics report separate stages:

| Stage | Meaning |
| --- | --- |
| `configuration` | Host, port, secure mode, username, and password presence are valid |
| `dns_connectivity` | Host is reachable |
| `tls` | TLS handshake succeeded with verification enabled |
| `authentication` | Credentials were accepted |
| `mailbox_access` | SMTP session verified or IMAP folders listed read-only |

Static diagnostics are available at:

- `GET /api/integrations/jh-gomes-mail/diagnostic`

This route returns configuration state only and performs no network calls.

## TLS Troubleshooting

If TLS fails:

- confirm the hostname matches the certificate (`mail.jhgomes.com`);
- verify the server presents a valid public certificate chain;
- confirm ports `465` and `993` use `secure=true`;
- do not disable certificate verification locally or in production.

Typical TLS error codes appear in the diagnostic stage message without exposing credentials.

## Safety Confirmations

- **Live sending remains disabled** unless both `JHGOMES_MAIL_ENABLED=true` and `JHGOMES_MAIL_LIVE_SEND_ENABLED=true`. The connector foundation does not wire campaign delivery.
- **Mailbox access is read-only** during diagnostics. No mutation APIs are invoked.
- **Connection tests do not run during application startup.**

## Authorization Boundary

The connection-test API route follows Step 7D1:

- authenticated server-derived identity;
- `integration:manage` permission for administrator/integration roles;
- tenant membership resolved on the server;
- spoofed development headers rejected in production;
- route blocked unless `JHGOMES_MAIL_CONNECTION_TEST_ENABLED=true`.

## Future Path: Reply Synchronization

When reply sync is implemented:

1. Enable `JHGOMES_MAIL_READ_SYNC_ENABLED=true` behind explicit operator approval.
2. Reuse the IMAP read-only listing path as the discovery step.
3. Add tenant-scoped ingestion that still avoids destructive mailbox operations unless a separate approved workflow is introduced.

Until then, the connector remains diagnostic-only.
