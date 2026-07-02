# Suppression Source of Truth

ForgeOS is the primary suppression source for outreach send decisions.

## Local MVP

The current UI workspace uses IndexedDB:

- `emailSuppressions`
- `campaignRecipients`
- `outreachSendAttempts`
- `outreachProviderEvents`

Local suppression is checked when campaigns are segmented, drafts are approved, manual Gmail/Outlook handoff is opened, manual sent status is confirmed, and protected test sends are requested.

## Public/Durable Boundary

Public unsubscribe and provider webhook requests cannot depend on browser-local IndexedDB. They write to the narrow Supabase-backed public tables:

- `outreach_public_suppressions`
- `outreach_provider_events`

Step 9/10 production work must verify migration deployment and sync/adaptation from durable public suppressions back into the operational campaign view before any production pilot.

## Brevo Blocklist Boundary

Brevo provides an API for listing blocked or unsubscribed transactional contacts at `/v3/smtp/blockedContacts`. ForgeOS does not rely on provider blocklists for correctness. Provider synchronization can be added as an adapter later, but ForgeOS suppression must remain effective even if provider sync fails.

ForgeOS must not automatically remove provider blocks.
