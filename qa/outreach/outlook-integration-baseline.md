# Outlook Graph Integration Baseline

Worktree: `Forge-OS-outlook-local`  
Branch: `feat/outlook-local-send-mvp`  
Base commit: `83209dd` — docs(outreach): document sender and salutation behavior

## Existing provider interface

`EmailDeliveryProvider` in `src/features/email-delivery/provider.ts`:

- `diagnostic(): EmailProviderDiagnostic`
- `send(request: EmailDeliveryRequest): Promise<EmailDeliveryResponse>`

Provider keys today: `simulation | brevo`. Factory in `createEmailDeliveryProvider()`.

## Approval gate

`src/application/campaign-approval-service.ts` — `evaluateRecipientApproval()` enforces:

- Approved draft status, valid email, non-suppressed, sender ready, no demo values, no unresolved placeholders, content hash match.

Protected test send: `src/application/outreach-test-send-service.ts` — idempotency via `outreachSendAttempts` IndexedDB table.

## Send-state model

- Campaign recipient: `CampaignDraftStatus` including `APPROVED`, `SENT_MANUALLY`, delivery outcomes.
- Send jobs: `OutreachSendJob` / `OutreachSendJobRecipient` / `OutreachSendJobAttempt` in IndexedDB.
- Test attempts: `OutreachSendAttempt` with `TEST_SENT | TEST_FAILED | TEST_BLOCKED | TEST_ALREADY_PROCESSED`.

## Attempt persistence

IndexedDB tables: `outreachSendAttempts`, `outreachSendJobAttempts`. Idempotency keys prevent duplicate test sends.

## Missing components (addressed in this branch)

1. `EmailSendProvider` boundary with connect/disconnect/status for Microsoft Graph.
2. `OutlookGraphEmailProvider` — delegated `POST /me/sendMail`.
3. OAuth PKCE routes under `/api/integrations/outlook/*`.
4. Encrypted server-side token cache (`%LOCALAPPDATA%\ForgeOS\auth\outlook-token-cache.enc`).
5. Outlook-specific env validation (`OUTLOOK_GRAPH_ENABLED`, `OUTLOOK_LIVE_SEND_ENABLED`, `OUTLOOK_TEST_RECIPIENTS`).
6. Integration UI at `/[locale]/settings/integrations/outlook`.
7. Organic send session controller with conservative defaults.
8. `uncertain` attempt classification — no automatic retry.

## Intended Outlook integration boundary

```
Campaign / LeadOps UI
  → application services (approval, test-send, organic session)
    → EmailSendProvider / EmailDeliveryProvider (outlook)
      → outlook-graph/* (OAuth, token cache, Graph client)
        → Microsoft Graph API (mocked in tests)
```

Campaign code must never import Graph or OAuth modules directly.
