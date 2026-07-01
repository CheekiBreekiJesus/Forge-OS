# Manual Sending (Gmail / Outlook)

## Workflow

1. Approve draft (sender identity + opt-out instruction required).
2. Use visible actions: **Open Gmail**, **Open Outlook**, **Open default mail client**, copy controls.
3. Opening external compose sets `OPENED_EXTERNALLY` — **not sent**.
4. Send manually outside ForgeOS.
5. Return and **Mark as sent externally** with confirmation.
6. ForgeOS records history, updates last-contacted state, and blocks duplicate campaign sends.

## URL safety

- Compose URLs use approved subject/body only.
- Blob, localhost, and file paths are blocked in outbound content checks.
- Long bodies may be truncated in URL compose; copy controls remain available.

## Duplicate protection

- Blocks second manual send for same campaign recipient.
- Warns on 7-day recent-contact cooldown; override requires reason + audit event.
- Suppression always blocks without override.

## Simulation

Simulation uses approved content, creates a marked simulated attempt, does not set `SENT_MANUALLY`, and does not update real contact timestamps.

## Provider delivery (future)

Automated sending requires: provider API keys server-side, webhook ingestion for bounces/complaints, idempotent send jobs, and delivery status separate from manual confirmation.
