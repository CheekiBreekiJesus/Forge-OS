# Email Outreach MVP Integration Status

**Branch:** `feat/email-outreach-mvp-integration`  
**Merge commit:** integrates `origin/feat/outreach-import-ops-hardening` into send-job foundation

## Source branches

| Branch | Commit | Scope |
| --- | --- | --- |
| Send-job foundation | `fb82211` | Brevo foundation, durable send jobs, trusted server mutations, suppression/webhooks |
| Import-ops hardening | `60fa927` | CSV/XLSX import, mapping profiles, sheet switch, sendability filters |

## Merge conflicts

Only `docs/checkpoints/email-outreach-status.md` conflicted in Git. Auto-merge succeeded for all code paths.

## Post-merge integration fix

Dexie v12 initially dropped send-job table indexes from the merged store definition. Fixed in follow-up commit to retain:

- `outreachSendJobs`, `outreachSendJobRecipients`, `outreachSendJobAttempts`, `outreachSendJobDailyUsage`
- plus `importMappingProfiles` from import-ops

## Combined workflow

Import → review/persist → filter sendable → create campaign → deterministic drafts → approve → Gmail/Outlook handoff → optional local simulation send job.

## Boundaries

| Layer | Role |
| --- | --- |
| IndexedDB | Local operational workflow, import staging, send-job projections |
| Supabase (migration present) | Durable hosted send jobs — **not applied** (Step 7D1) |
| Brevo | Test-email foundation only; campaign batches disabled |

## Production limitations

- No production auth adapter
- No hosted Supabase migration
- No real Brevo campaign delivery
- No email sent in tests or acceptance

## Step 7D1 remaining

See `docs/checkpoints/email-outreach-status.md` § Next steps.
