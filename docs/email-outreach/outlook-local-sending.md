# Local Outlook sending (ForgeOS MVP)

ForgeOS sends approved outreach drafts through the operator's own Microsoft 365 / Outlook mailbox using **delegated** Microsoft Graph `POST /me/sendMail`.

## Safety defaults

| Variable | Default | Effect |
|---|---|---|
| `OUTLOOK_GRAPH_ENABLED` | `false` | Master switch for OAuth + Graph |
| `OUTLOOK_LIVE_SEND_ENABLED` | `false` | Blocks actual `sendMail` calls |

Both must be `true` for live sends. The UI shows **Envio real desativado** when live send is off.

## Server-authoritative test sends

`POST /api/integrations/outlook/test-send` accepts **only**:

- `campaignId`
- `recipientId`
- `confirmation` (`SEND OUTLOOK TEST`)

The server loads the approved recipient from canonical storage and **rejects** client-supplied subject, body, sender snapshot, or approval version.

### Gates (all required)

1. Trusted operator headers + same-origin boundary (local runtime).
2. Approved immutable draft (`approvalContentHash` unchanged).
3. No suppression, placeholders, demo sender, or prior successful send.
4. Recipient email in `OUTLOOK_TEST_RECIPIENTS`.
5. Connected OAuth mailbox matches approved sender email (normalized).
6. Durable attempt created in `submitting` state before Graph call.
7. Live send flags enabled.

## Outcome semantics

| Status | Meaning |
|---|---|
| **Accepted by Graph** | HTTP 202 from Microsoft Graph |
| **Confirmed delivery** | Not tracked in this MVP |
| **Uncertain** | Connection lost after submit; operator review required; no auto-retry |
| **Temporary failure** | Explicit operator retry only |
| **Mailbox mismatch** | Blocked with connected vs expected mailbox details |

## Durable attempts

File store: `%LOCALAPPDATA%/ForgeOS/outlook/durable-send-attempts.json`

Idempotency key: `outlook:{campaignId}:{recipientId}:{approvalContentHash}:outlook`

`accepted` and `uncertain` block automatic resubmission of the same approved snapshot.

## Production outreach path

Campaign code never calls Graph directly. It uses:

- `OutlookGraphEmailProvider` for connection lifecycle.
- `outlook-send-service` for server-authoritative commands.
- Durable attempt store for idempotency across restarts.
- Organic send session controller for paced local sessions (server-selected recipients).

## Sender mailbox

The connected OAuth mailbox must match the approved ForgeOS sender `fromEmail`. ForgeOS does not silently rewrite sender snapshots.

**Aliases and shared mailboxes are not supported** in this MVP.

## No Brevo

This MVP replaces the immediate need for Brevo in local organic sending. Brevo code remains in the base branch but is not configured here.
