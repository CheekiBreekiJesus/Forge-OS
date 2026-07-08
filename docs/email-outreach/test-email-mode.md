# Protected Test Email Mode

Purpose: send exactly one internal test email using already approved outreach content, without contacting the original lead and without marking the campaign recipient as sent.

Required gates:

- Provider is configured.
- `OUTREACH_REAL_SEND_ENABLED=true`.
- `OUTREACH_TEST_SEND_ENABLED=true`.
- Test recipient is in `OUTREACH_TEST_RECIPIENT_ALLOWLIST`.
- Operator enters the explicit confirmation text: `SEND TEST`.
- Campaign recipient draft is `APPROVED`.
- Approval content hash still matches the current subject/body/html.
- Original lead email is not suppressed.
- Idempotency key has not already been processed.

Idempotency:

The local service builds a deterministic test idempotency key from campaign ID, recipient ID, approved content hash, and test recipient email. If the same approved content is sent to the same internal address again, ForgeOS returns the existing completed result and does not call the provider again.

Persistence:

Test attempts are stored in `outreachSendAttempts` with tenant, provider, mode, campaign, recipient, lead, approved content hash, destination, idempotency key, status, timestamps, provider message ID, retryable flag, sanitized error code/message, and initiator.

Not persisted:

- API keys.
- Authorization headers.
- Full provider payloads.
- Raw provider responses.

Known limitation:

Until ForgeOS has server persistence and auth, tenant/campaign/recipient ownership is validated in the local IndexedDB application service. The server route enforces provider config, send flags, and allowlist before invoking Brevo.
