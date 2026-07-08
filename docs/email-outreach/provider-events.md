# Provider Events And Send Jobs

Date: 2026-07-02

## Scope

Step 8 provider-event reconciliation remains the single event table. Send jobs add attempts with `providerMessageId` values that Step 8 resolves.

## Fully Working

- Provider events resolve by `providerMessageId` through existing send attempts.
- Delivered, bounce, complaint, and unsubscribe events update recipient draft status.
- Duplicate webhook events are idempotent via fingerprinting.
- Hard bounce, complaint, and unsubscribe create or respect suppressions.
- Terminal suppression precedence is preserved (`canApplyStatus` guard).
- Queued suppressed recipients are skipped during send-job batch processing.
- No second provider-event table was introduced.

## Draft Or Incomplete

- Durable send-job recipient status updates from webhooks when production Supabase store is authoritative.
- Cross-device webhook reconciliation when local IndexedDB is not the server source of truth.

## Related Files

- `src/features/email-delivery/provider-events.ts`
- `src/features/email-delivery/provider-events.test.ts`
- `supabase/migrations/202607020001_outreach_public_events.sql`
