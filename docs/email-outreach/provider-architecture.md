# Email Delivery Provider Architecture

Step 6 adds a provider boundary for outreach email delivery without enabling campaign sending.

Core modules:

- `src/domain/email-delivery-types.ts`: normalized provider, request, result, diagnostic, and send-attempt types.
- `src/features/email-delivery/config.ts`: server-side environment parsing and safe diagnostic shape.
- `src/features/email-delivery/provider.ts`: provider factory and interface.
- `src/features/email-delivery/simulation-provider.ts`: default non-sending provider.
- `src/features/email-delivery/brevo-provider.ts`: server-only Brevo transactional email adapter.
- `src/application/outreach-test-send-service.ts`: local IndexedDB workflow validation, idempotency, suppression recheck, and attempt persistence.
- `src/app/api/leadops/email-provider/*`: diagnostic and protected test-send routes.

Safety boundaries:

- Simulation remains the default.
- Brevo is selected only with `EMAIL_DELIVERY_PROVIDER=brevo`.
- Real send and test send require separate explicit flags.
- The Brevo API key is read only from server runtime environment.
- The browser can read only diagnostic booleans/counts/missing variable names.
- Provider payloads and raw provider responses are not persisted.
- The old `/api/leadops/send` route is intentionally blocked from Brevo delivery and remains simulation/manual-handoff compatible.

Current limitation:

ForgeOS still uses browser IndexedDB for campaign and recipient records in this MVP worktree. The protected test-send service revalidates tenant, campaign, recipient, approval hash, suppression, and idempotency locally, then the server route performs provider configuration and allowlist gates. Full server-side tenant ownership verification requires the future server persistence/auth step.
