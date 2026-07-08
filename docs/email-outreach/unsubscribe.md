# Durable Unsubscribe

Date checked: 2026-07-02

ForgeOS now has a public unsubscribe foundation for provider-delivered outreach.

## Architecture

- Public page: `/{locale}/unsubscribe?token=...`
- Mutation endpoint: `POST /api/outreach/unsubscribe`
- Token module: `src/features/email-delivery/unsubscribe-token.ts`
- Durable write boundary: `src/features/email-delivery/durable-outreach-store.ts`
- Supabase migration: `supabase/migrations/202607020001_outreach_public_events.sql`

The current app still uses browser IndexedDB for the local outreach workspace. Public unsubscribe requests cannot safely update browser-local data, so the public endpoint writes only to the narrow server-side durable table `outreach_public_suppressions`.

## Token Design

Tokens are HMAC-SHA256 signed, versioned, URL-safe, and verified with constant-time signature comparison.

Token claims contain:

- token version;
- tenant public identifier;
- campaign reference;
- campaign recipient reference;
- lead reference;
- normalized email hash;
- issued time;
- optional expiry.

Email addresses are not placed in URL query parameters. Token payloads are signed but not encrypted, so they must not contain secrets or full email addresses.

## Runtime Requirements

Set these outside Git:

- `FORGEOS_PUBLIC_BASE_URL`
- `OUTREACH_UNSUBSCRIBE_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Without durable storage configuration the endpoint returns `durable_store_unavailable` rather than pretending local IndexedDB was updated.

## Real Send Requirement

The Brevo provider blocks real provider delivery unless `unsubscribeUrl` is present. The provider appends a plain-text opt-out line and an HTML opt-out link before submission.

Manual Gmail/Outlook handoff remains separate. It preserves the manual reply-based opt-out instruction until a durable URL can be generated for that local workflow.
