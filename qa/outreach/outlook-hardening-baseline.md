# Outlook sending hardening baseline

Date: 2026-07-03  
Branch: `feat/outlook-local-send-mvp`  
Starting commit: `87bb31c` (docs(outlook): document local mailbox setup)  
Base: seven commits ahead of `83209dd`

## Preflight

| Check | Result |
|---|---|
| Worktree | `Forge-OS-outlook-local` |
| Branch | `feat/outlook-local-send-mvp` |
| Working tree | Clean |
| `OUTLOOK_GRAPH_ENABLED` | `false` (default) |
| `OUTLOOK_LIVE_SEND_ENABLED` | `false` (default) |
| Brevo | Not configured |
| Credentials in tree | None |

## Pre-hardening execution path (defective)

```
Browser POST /api/integrations/outlook/test-send
  → route accepts client subject, body, senderSnapshot, approvedDraftVersion
  → randomUUID attemptId (no durable idempotency)
  → OutlookGraphEmailProvider.sendApprovedMessage(client payload)
  → sendMailViaGraph → POST {graph}/me/sendMail

Browser POST /api/integrations/outlook/organic-session
  → accepts items[] with full OutlookApprovedSendPayload from browser
  → createOrganicSendSession(client items)
  → processOrganicSendSessionTick
  → in-memory submittedIdempotencyKeys Set (lost on restart)
  → sendApprovedMessage(client payload)
```

### Critical defects

1. Test-send trusts client-supplied subject, body, sender snapshot, approved version.
2. Organic-session accepts arbitrary complete send payloads from the browser.
3. Idempotency stored only in an in-memory `Set`.
4. Session and attempt states disappear after restart.
5. API routes lack operator / same-origin boundary.
6. Connected mailbox not verified against ForgeOS sender.
7. Approval, suppression, placeholder, demo-sender, already-sent checks not loaded from canonical storage before submission.

## Post-hardening target path

```
Guarded mutation request (operator headers + Origin + JSON)
  → outlook-send-service loads campaign/recipient from injected LocalRepositoryBundle
  → revalidates approval hash, suppression, placeholders, demo sender, mailbox match
  → durable attempt store: create submitting (unique idempotency key) before Graph
  → sendMailViaGraph with server-built payload only
  → persist classified result (accepted / uncertain / failure / throttled)
  → audit event (no tokens or full bodies)
```
