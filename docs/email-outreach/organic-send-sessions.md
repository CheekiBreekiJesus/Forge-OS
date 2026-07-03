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

- `POST /api/integrations/outlook/organic-session` — create session (`enabled: false` by default)
- `POST` `{ "action": "pause" }` / `{ "action": "resume" }`
- `POST` `{ "action": "tick" }` — process next eligible item (local worker / manual tick)
- `GET` — snapshot

## Uncertain results

If Graph accepts the HTTP request but the client loses the connection before reading the response, the attempt is **`uncertain`**. ForgeOS does **not** auto-resend. Operator review is required.

## Idempotency

Key format: `organic:{campaignId}:{recipientId}:{approvedDraftVersion}`

Duplicate keys are skipped within a session and across restarts when attempt records exist.

## Not included

- Tracking pixels
- Link rewriting
- Fake reply simulation
- Delivery/open tracking claims
