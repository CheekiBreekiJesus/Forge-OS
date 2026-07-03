# Outlook sending hardening summary

Date: 2026-07-03  
Branch: `feat/outlook-local-send-mvp`

## What changed

Outlook local sending is now **server-authoritative**: API routes accept identifiers and operator confirmation only. Subject, body, sender snapshot, approval version, and suppression state are loaded from canonical ForgeOS storage immediately before send.

## Safety controls

| Control | Implementation |
|---|---|
| Canonical draft loading | `loadCanonicalOutlookSendContext()` |
| Durable idempotency | File-backed `durable-send-attempts.json` with unique `campaignId+recipientId+approvedDraftVersion+provider` |
| Mailbox match | Connected OAuth mailbox must equal approved sender `fromEmail` |
| Request boundary | Trusted actor headers, JSON content-type, Origin = `FORGEOS_PUBLIC_BASE_URL`, localhost-only in local runtime |
| Restart recovery | Stale `submitting` attempts become `uncertain` and block resubmission |
| Organic session | Server selects eligible recipients; client `items[]` rejected |

## Outcome semantics

| Term | Meaning |
|---|---|
| **Accepted by Graph** | HTTP 202 from `POST /me/sendMail` |
| **Confirmed delivery** | **Not claimed** — Graph acceptance ≠ inbox delivery |
| **Temporary failure** | Provider/network error classified retryable; requires explicit operator retry |
| **Uncertain outcome** | Request may have reached Graph before response was lost; **never auto-retried** |
| **Explicit retry** | Operator action only; durable `accepted` / `uncertain` blocks automatic resubmit |
| **Sender/mailbox mismatch** | Send blocked; UI should show connected vs expected mailbox |

## Aliases / shared mailboxes

Not supported in this MVP. Connected mailbox must exactly match the approved ForgeOS sender email (normalized). Shared-mailbox sending is documented as a future limitation.

## Remaining limitations

- Server routes require injected `LocalRepositoryBundle` (503 until local projection bridge is wired at runtime).
- Organic session state is in-process (items reference server-built payloads; durable attempts survive restart).
- No Brevo; no production Supabase send-job integration for Outlook provider enum.
- `submittedIdempotencyKeys` Set remains as non-authoritative in-process optimization only.
