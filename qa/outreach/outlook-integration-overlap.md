# Outlook branch overlap analysis

Branch: `feat/outlook-local-send-mvp`  
Compared against: `origin/feat/email-outreach-mvp-integration`, `origin/fix/table-density-and-action-overlays`

## Files changed (this branch)

### New modules
- `src/features/outlook-graph/**` — OAuth, token cache, Graph client, organic session
- `src/app/api/integrations/outlook/**` — connect, callback, status, disconnect, validate, test-send, organic-session
- `src/app/[locale]/settings/integrations/outlook/page.tsx`
- `src/components/outlook-integration-panel.tsx`

### Extended (minimal touch)
- `src/domain/email-delivery-types.ts` — `outlook` provider + `uncertain`/`throttled` status
- `src/features/email-delivery/provider.ts` + `config.ts` — factory wiring
- `src/components/settings-shell.tsx` — link to Outlook integration (6 lines)
- `.env.example` — Outlook placeholders

### Documentation / QA
- `docs/email-outreach/outlook-*.md`, `organic-send-sessions.md`
- `docs/security/outlook-token-storage.md`
- `qa/outreach/outlook-*.md`

## Overlap with personalization (`feat/email-outreach-mvp-integration`)

**Low conflict.** This branch builds on commit `83209dd` (sender/salutation docs). Outlook code does not modify:
- `template-rendering.ts`
- `salutation-resolver.ts`
- `campaign-draft-service.ts`

Integration order: merge personalization base first (already ancestor), then merge `feat/outlook-local-send-mvp`.

## Overlap with table UI (`fix/table-density-and-action-overlays`)

**None expected.** Table UI touches lead/campaign table components; Outlook work is settings + server API + `outlook-graph` feature module.

## Overlap with send-jobs (`feat/email-outreach-send-jobs`)

**Adjacent, not merged.** Send-job types still list `brevo` delivery mode. Organic session is a separate local controller. Future work: add `outlook` to `OutreachSendJobDeliveryMode` and wire `processCampaignBatch` to `OutlookGraphEmailProvider`.

## Recommended integration order

1. `feat/email-outreach-mvp-integration` (base) — already ancestor
2. `feat/outlook-local-send-mvp` (this branch)
3. `fix/table-density-and-action-overlays` (UI only, parallel-safe)
4. `feat/email-outreach-send-jobs` (unify organic session with durable job runner)

Do **not** merge table-ui or send-jobs into this branch per task constraints.
