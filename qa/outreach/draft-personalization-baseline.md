# Draft personalization baseline (pre-fix)

**Worktree:** `Forge-OS-outreach-integration`  
**Branch:** `feat/email-outreach-mvp-integration`  
**Starting commit:** `160675a` — docs(outreach): record MVP integration checkpoint

## Observed defect

Municipal lead `Tábua` / `Municipality` / no contact / `geral@…` produced:

- Greeting: `Exmo(a). Sr(a). Tábua,` (organization treated as person)
- Body: raw English `Municipality` in category sentence
- Sender: demo `João Gomes`, `joao.gomes@demo.local`, `+351 910 000 000` after Settings edits

## Current data sources (before fix)

| Field | Source at draft render time | Notes |
|-------|----------------------------|-------|
| Sender name | `SenderIdentity.displayName` via `loadSenderContext` → `getDefault` or `campaign.senderProfileId` | Seeded from demo user at first seed; **not** updated when user edits Profile only |
| Sender email | `SenderIdentity.fromEmail` | Same as above |
| Reply-to | `SenderIdentity.replyToEmail` | Same |
| Sender phone | `SenderIdentity.phone` | Same |
| Company name | `CompanyProfile.tradingName \|\| legalName` | Settings Company section persists correctly |
| Company website | `CompanyProfile.websiteUrl` | Used in signature only (not recipient site) |
| Organization name | `CampaignRecipient.snapshotCompanyName` | From lead import snapshot |
| Contact name | `CampaignRecipient.snapshotContactName` | Falls back to `Senhor(a)` when empty; **does not** detect org-as-contact |
| Category | `CampaignRecipient.snapshotCategory` | Interpolated raw English into PT `categoryLine` |
| Salutation | Template line `Exmo(a). Sr(a). {{contactName}},` | No dedicated resolver; generic emails not considered |

## Persistence gaps

1. **Senders UI** lists identities but has no edit/save form — only add, set default, archive.
2. **User profile** edits do not propagate to `SenderIdentity` (by design, but operators expect Profile = sender).
3. **Campaign creation** does not set `senderProfileId`; always uses default sender at render time.
4. **Demo seed** creates default sender from demo user (`joao.gomes@demo.local`, etc.).

## Template behaviour (before fix)

- `categoryLine`: `A sua área de atividade (${category}) encaixa-se…` — exposes English codes
- `websiteLine`: repeats recipient website in body
- Subject: `Copos personalizados para {{companyName}}` — no municipality formatting

## Intended fix boundaries

- User profile ≠ sender unless sender profile selected
- Campaign drafts use persisted `SenderIdentity`
- Salutation resolver + organization display + category localization in deterministic path only
- No Step 7D1, Brevo, auth, or durable send-job changes
