# Step 7C Baseline

Date: 2026-07-03
Branch: `feat/email-outreach-send-jobs`
Starting commit: `b951faa`

## Preflight

- Worktree: `C:\Users\J35U5\Desktop\VS Code\Forge-OS-send-jobs`
- `git status --short --untracked-files=all`: clean before Step 7C edits
- `git branch --show-current`: `feat/email-outreach-send-jobs`
- `git diff --check`: no whitespace errors before Step 7C edits

## Confirmed Current State

- Local simulation send jobs exist in `src/application/campaign-send-job-service.ts`.
- Send-job IndexedDB repositories exist in `src/persistence/indexeddb/send-job-repositories.ts`.
- Server-only durable REST helpers exist in `src/features/email-delivery/durable-outreach-store.ts`.
- Campaign detail UI still calls local repository services directly.
- Production auth, tenant membership, and hosted Supabase repository adapters are not implemented.

## Risks To Address

- Browser-local tenant and actor values are not a production security boundary.
- Production mutation routes must not trust body-supplied tenant, role, actor, recipient, or content data.
- Durable status responses must not expose provider payloads, service-role fields, or private email content.
- Real Brevo campaign batch sending must remain disabled.

## Baseline Validation

- `npm run lint`: passed with 7 pre-existing warnings
- `npm run typecheck`: passed
- `npm test`: passed, 47 files and 221 tests
- `npm run build`: passed
