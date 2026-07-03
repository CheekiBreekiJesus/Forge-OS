# Organic send sessions (local Outlook)

Conservative local controller for paced outreach after human approval.

## Defaults

| Setting | Value |
|---|---|
| Session enabled | `false` |
| Max messages / session | `5` |
| Concurrent sends | `1` |
| Delay between messages | `180–420` seconds (randomized) |
| Business hours | `09:00–18:00` Europe/Lisbon |
| Auto-retry uncertain | **disabled** |
| Catch-up burst after downtime | **disabled** |

## Session states (UI)

`queued` · `next eligible time` · `accepted` · `failed` · `throttled` · `uncertain` · `skipped` · `paused` · `completed`

## API

Mutation routes require trusted operator headers, JSON body, and matching `Origin`.

### Create session

`POST /api/integrations/outlook/organic-session`

```json
{
  "campaignId": "cmp_…",
  "requestedMaximum": 5,
  "enabled": false,
  "confirmation": "START OUTLOOK ORGANIC SESSION"
}
```

The server selects eligible recipients from canonical storage. **Client `items[]` payloads are rejected.**

### Control

- `POST` `{ "action": "pause" }`
- `POST` `{ "action": "resume" }`
- `POST` `{ "action": "tick" }` — process next eligible item
- `GET` — snapshot

## Eligibility (server-side)

- Approved draft with valid `approvalContentHash`
- Not suppressed, not already sent
- No blocking durable attempt (`accepted`, `uncertain`, `submitting`)
- Sender snapshot complete, no demo values
- Connected mailbox matches approved sender
- Within session limit (max 5)

## Uncertain results

If Graph accepts the HTTP request but the client loses the connection before reading the response, the durable attempt is **`uncertain`**. ForgeOS does **not** auto-resend. Operator review is required.

## Idempotency

Key format: `outlook:{campaignId}:{recipientId}:{approvalContentHash}:outlook`

Duplicates are blocked by the durable attempt store across restarts. An in-memory Set may still optimize within a single process but is not authoritative.

## Not included

- Tracking pixels
- Link rewriting
- Fake reply simulation
- Delivery/open tracking claims
- Shared-mailbox / alias sending
