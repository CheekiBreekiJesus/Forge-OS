# Email Provider Foundation Plan

Date checked: 2026-07-02
Worktree: `C:\Users\J35U5\Desktop\VS Code\Forge-OS-outreach-provider`
Branch: `feat/email-outreach-provider`

## Objective

Add a secure server-side Brevo provider foundation and a protected one-recipient internal test-email workflow for ForgeOS Email Outreach.

The scope is intentionally narrow:

- keep simulation as the default delivery mode;
- keep real sending disabled unless explicitly configured;
- preserve Gmail and Outlook manual handoff;
- add diagnostics that never send email;
- support one explicitly confirmed allowlisted internal test send;
- persist normalized test attempts and sanitized results;
- prevent duplicate test sends by idempotency.

## Existing Architecture Reused

- `src/features/leadops/providers.ts` currently owns deterministic generation and simulation/Smartlead delivery.
- `src/app/api/leadops/send/route.ts` exposes the existing simulation delivery API.
- `src/application/campaign-approval-service.ts` owns approval hashes, duplicate-send evaluation, manual sent history, external compose handoff, and simulation.
- `src/application/campaign-sender-context.ts` loads sender identity and company profile.
- `src/application/suppression-service.ts` applies active suppression checks.
- `src/domain/campaign-types.ts` models campaign recipients, approval state, manual sent state, and recipient delivery mode.
- `src/persistence/db.ts` and `src/persistence/indexeddb/*` provide local Dexie persistence.
- `src/features/backup/service.ts` exports/imports local operational outreach state.
- `src/components/settings-shell.tsx` contains the existing settings/integrations/sender UI surface.

## Planned Implementation

1. Introduce a provider-neutral delivery interface with simulation and Brevo implementations.
2. Move live-provider behavior behind server-only modules.
3. Add environment parsing and diagnostics that return booleans and sanitized messages only.
4. Add a `SendAttempt` domain record and repository.
5. Add Dexie schema migration for send attempts.
6. Include send attempts in backup/restore.
7. Add server route(s) for provider diagnostics and protected test sends.
8. Add Settings provider panel for delivery mode, configuration status, and diagnostics.
9. Require approved campaign recipient content for test sends.
10. Send only to an allowlisted internal recipient, never to the original lead address.
11. Persist `TEST_SENT`, `TEST_FAILED`, or duplicate/already-processed attempt results.
12. Keep lead last-contacted/outreach status and campaign recipient real sent fields unchanged for test sends.

## Safety Controls

- Simulation remains the default provider.
- `OUTREACH_REAL_SEND_ENABLED=false` and `OUTREACH_TEST_SEND_ENABLED=false` by default.
- Brevo API key is read only in server-only code.
- API key presence is exposed as a boolean only.
- Tests mock Brevo HTTP calls.
- Diagnostics do not send email.
- Test sends require allowlist match and explicit confirmation.
- Test sends use an idempotency key and persisted attempt lookup.
- Suppression is rechecked before provider invocation.
- No provider payloads, authorization headers, or API keys are persisted.

## Known Limitations For This Step

- No campaign batch sending.
- No scheduling.
- No automatic retries.
- No provider webhooks.
- No public unsubscribe page.
- Full server-side tenant/campaign/recipient ownership validation requires the future server persistence and auth layer; the local MVP validates IndexedDB state before calling the protected provider route.
- No production auth provider integration; role checks will use the current local role/profile infrastructure.
