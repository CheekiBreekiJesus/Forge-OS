# Email Outreach Status - Release Checkpoint (Step 8)

Date: 2026-07-02
Branch: `feat/email-outreach-provider`
Starting commit: `b0f2b19`

## Release readiness checklist

- [x] Import -> campaign -> draft -> approve -> Gmail/Outlook -> manual sent
- [x] Tenant-scoped local suppression with immediate local enforcement
- [x] Duplicate outreach prevention and cooldown warnings
- [x] Manual sent history and idempotency keys
- [x] Server-side email provider interface
- [x] Brevo transactional adapter with mocked tests
- [x] Safe provider diagnostics without secret disclosure
- [x] Protected one-recipient test-email route
- [x] Signed unsubscribe token utilities
- [x] Public unsubscribe page and mutation endpoint
- [x] Narrow durable Supabase boundary for public suppressions and provider events
- [x] Brevo webhook endpoint with shared-secret protection
- [x] Provider event normalization, deduplication, and local reconciliation
- [x] Hard bounce, complaint, and unsubscribe suppression handling
- [x] Local provider-event admin list on campaign detail
- [ ] First authorized internal Brevo test email (Step 9; requires explicit operator approval)
- [ ] Limited production cohort pilot (Step 10; requires Step 9 result and explicit cohort approval)

## Schema

IndexedDB schema v11 adds `outreachProviderEvents`.

Supabase migration `202607020001_outreach_public_events.sql` adds:

- `outreach_public_suppressions`
- `outreach_provider_events`

## Backup version

JSON backup v7 adds `outreachProviderEvents`; older imports normalize missing provider events to an empty table.

## Next milestone prerequisites

1. Deploy the Supabase public outreach migration.
2. Configure `FORGEOS_PUBLIC_BASE_URL`, `OUTREACH_UNSUBSCRIBE_SECRET`, `BREVO_WEBHOOK_SECRET`, and Supabase service-role storage outside Git.
3. Verify HTTPS public unsubscribe and webhook endpoints.
4. Complete Step 9 readiness checks and request explicit authorization before exactly one internal real email.
5. Do not start Step 10 limited pilot until Step 9 has a sanitized result and the exact cohort is approved.
