# Email Outreach MVP

Step 1 delivers local-first lead import for the LeadOps workspace.

## Scope

- CSV and XLSX file import in the browser
- Automatic and manual header mapping
- Normalization, validation, and duplicate analysis
- Import batch history and lead contact persistence
- Backup/restore and demo reset compatibility

## Architecture

See [lead-import-plan.md](./lead-import-plan.md).

## Manual test route

1. Open `/pt-PT/leadops` or `/en/leadops`
2. Choose CSV or XLSX under **Import CSV/XLSX**
3. Review mapping, preview counts, and row messages
4. Confirm import
5. Reload the page and verify imported organizations remain in the lead list

## Out of scope (Step 1)

Campaigns, AI draft generation, provider sending, web enrichment, background jobs, webhooks.
