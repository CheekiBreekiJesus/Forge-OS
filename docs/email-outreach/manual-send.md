# Manual send (MVP)

Manual outreach uses deterministic campaign templates with persisted sender identities.

## Before approval

1. Configure **Company** and **Sender identity** in Settings.
2. Create campaign — default sender is bound via `senderProfileId`.
3. Generate drafts — sender and personalization fields are rendered into each recipient.
4. Review preview fields; override greeting or organization display name if needed.
5. Approve only when sender fields are complete and no demo fallback warnings remain.

## Sender refresh

For draft campaigns, use **Atualizar dados do remetente** to pull the latest default sender and regenerate unapproved drafts. Approved and sent drafts keep their stored plain text.

## Snapshots

Approved drafts store `personalizedSubject` and `personalizedPlainText`. Changing settings or sender profile does not silently mutate approved content.
