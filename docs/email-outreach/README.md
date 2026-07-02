# Email Outreach MVP

Manual outreach release candidate for ForgeOS LeadOps (local-first, Gmail/Outlook handoff).

## Supported workflow

1. Import leads (CSV/XLSX) — `docs/email-outreach/lead-import.md`
2. Filter and create campaign — `docs/email-outreach/campaign-workflow.md`
3. Edit template and generate deterministic drafts
4. Review, approve, open Gmail/Outlook — `docs/email-outreach/manual-sending.md`
5. Confirm manual send and record history
6. Manage suppression and privacy — `docs/email-outreach/compliance-and-suppression.md`

## Architecture docs

| Topic | Document |
|-------|----------|
| Import | [lead-import.md](./lead-import.md) |
| Campaigns | [campaign-workflow.md](./campaign-workflow.md) |
| Manual send | [manual-sending.md](./manual-sending.md) |
| Templates/drafts | [templates-and-drafts.md](./templates-and-drafts.md) |
| Review/approval | [review-and-manual-send.md](./review-and-manual-send.md) |
| Suppression | [compliance-and-suppression.md](./compliance-and-suppression.md) |
| Durable unsubscribe | [unsubscribe.md](./unsubscribe.md) |
| Brevo webhooks | [brevo-webhooks.md](./brevo-webhooks.md) |
| Event reconciliation | [event-reconciliation.md](./event-reconciliation.md) |
| Suppression source of truth | [suppression-source-of-truth.md](./suppression-source-of-truth.md) |
| Public endpoint security | [security-review.md](./security-review.md) |
| Troubleshooting | [troubleshooting.md](./troubleshooting.md) |

## Release checkpoint

See [docs/checkpoints/email-outreach-status.md](../checkpoints/email-outreach-status.md).

## Out of scope (this milestone)

- Authorized live Brevo/provider delivery
- Automatic production campaign batches
- Automated scheduling and bulk auto-send
- Website enrichment and image generation
- Marketing Studio integration

## Manual test route

`/pt-PT/leadops` → import → campaign → drafts → approve → Gmail → mark sent
