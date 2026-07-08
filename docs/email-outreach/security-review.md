# Outreach Public Endpoint Security Review

Date: 2026-07-02

## Reviewed Areas

- public unsubscribe endpoint abuse;
- token leakage;
- timing exposure;
- request replay;
- webhook payload spoofing;
- event fingerprint collision;
- cross-tenant lookup;
- sensitive logs;
- oversized payloads;
- HTML/script injection in provider metadata;
- denial-of-service risk.

## Controls Implemented

- HMAC-SHA256 signed unsubscribe tokens.
- Constant-time signature comparison.
- Token versioning and optional expiry.
- No raw email address in unsubscribe query parameters.
- Webhook shared-secret authentication.
- JSON-only webhook content type.
- 64 KB webhook body limit.
- Sanitized provider metadata.
- Deterministic event fingerprinting.
- Duplicate delivery handling.
- Durable server-side table boundary for public events.
- Real provider sends blocked unless an unsubscribe URL is present.

## Known Limitations

- Brevo transactional webhook docs reviewed on 2026-07-02 did not show a cryptographic signature header for the configured webhook mechanism.
- Shared-secret webhook authentication is a compensating control, not signature verification.
- Current production tenant/auth mapping is not complete; public event tables use tenant public IDs until the full server persistence/auth layer is implemented.
- IndexedDB remains the local operational workspace, so public durable suppressions require sync/adaptation before a production pilot.
- Rate limiting is not yet implemented at the app edge; deployment platform rate controls are recommended for Step 9.
