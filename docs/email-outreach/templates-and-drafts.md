# Email Templates and Deterministic Personalized Drafts (Step 3)

## Audit summary

| Area | Reuse decision |
|------|----------------|
| Lead detail composer (`leadops-email-composer.tsx`, `leadops-detail-workspace.tsx`) | Keep for single-lead workflow; campaign drafts use a separate template + list editor on campaign detail |
| Deterministic generation (`workflow.generatePtPtEmail`, `outreach-email.ts` fallback) | Reuse Settings/signature patterns; campaign bulk rendering uses new `template-rendering.ts` |
| AI Gateway (`lib/ai/gateway.ts`, `outreach-email.ts`) | Optional assist only; never required for MVP |
| Campaign entities | Extend `OutreachCampaign` template fields and `CampaignRecipient` draft fields |
| Recipient snapshots | Extend with `snapshotWebsite`; drafts stored on recipient rows |
| Settings | Reuse `companyProfiles`, `senderIdentities`, `userProfiles` via repositories |
| Signature/branding | Reuse `renderSignature` and variable boundaries from Settings |
| Approval | Not implemented in Step 3; unresolved drafts marked `NEEDS_REVIEW` |
| Gmail/Outlook compose | Unchanged on lead detail; no send controls on campaign drafts |
| Sanitization | Reuse `plainTextToHtml` + `sanitizeEmailHtml` |
| Localization | PT/EN UI labels; template language field on campaign |

## Architecture

1. **Template fields** live on `OutreachCampaign` (`subjectTemplate`, `plainTextTemplate`, optional `htmlTemplate`, `templateVersion`).
2. **Deterministic renderer** (`template-rendering.ts`) substitutes variables from recipient snapshot + Settings sender/company context.
3. **Draft persistence** on `CampaignRecipient` with `draftStatus`, generation metadata, and `userEdited`.
4. **Campaign draft service** orchestrates preview, bulk generation, single regeneration (with edit protection), and manual edits.
5. **Campaign detail UI** replaces Step 2 placeholders with template editor, variable reference, preview counts, draft list, and per-recipient editor.

## Variable policy

Supported placeholders: `companyName`, `contactName`, `category`, `region`, `website`, `senderName`, `companySenderName`, `senderPhone`, `senderEmail`, `unsubscribeInstruction`.

Fallbacks never invent facts. Missing contact uses a neutral greeting; empty region/website lines are removed; unresolved `{{...}}` patterns block draft approval in Step 4.

## Default template

Editable PT-PT default seeded on new draft campaigns via `default-templates.ts` (not hardcoded in renderer).
