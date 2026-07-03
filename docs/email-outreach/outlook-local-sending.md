# Local Outlook sending (ForgeOS MVP)

ForgeOS sends approved outreach drafts through the operator's own Microsoft 365 / Outlook mailbox using **delegated** Microsoft Graph `POST /me/sendMail`.

## Safety defaults

| Variable | Default | Effect |
|---|---|---|
| `OUTLOOK_GRAPH_ENABLED` | `false` | Master switch for OAuth + Graph |
| `OUTLOOK_LIVE_SEND_ENABLED` | `false` | Blocks actual `sendMail` calls |

Both must be `true` for live sends. The UI shows **Envio real desativado** when live send is off.

## Test sends

Protected test sends require:

1. Approved immutable draft snapshot (content hash unchanged since approval).
2. Recipient in `OUTLOOK_TEST_RECIPIENTS`.
3. Explicit confirmation (`SEND OUTLOOK TEST`).
4. Live send flags enabled.

Route: `POST /api/integrations/outlook/test-send`

## Production outreach path

Campaign code never calls Graph directly. It uses:

- `EmailSendProvider` / `OutlookGraphEmailProvider` for connection lifecycle.
- `EmailDeliveryProvider` (`outlook`) for approved payload delivery.
- `outreachSendAttempts` IndexedDB idempotency for test sends.
- Organic send session controller for paced local sessions.

## Sender mailbox

The connected OAuth mailbox is the sending mailbox. ForgeOS sender snapshots still gate approval content; they are not replaced by Graph.

## No Brevo

This MVP replaces the immediate need for Brevo in local organic sending. Brevo code remains in the base branch but is not configured here.
