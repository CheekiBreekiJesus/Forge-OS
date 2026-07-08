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

Supported placeholders: `companyName`, `contactName`, `category`, `region`, `website`, `personalizedIntro`, `recommendedProducts`, `portfolioImageUrl`, `portfolioImageAlt`, `senderName`, `companySenderName`, `senderPhone`, `senderEmail`, `unsubscribeInstruction`.

Snake_case aliases (`company_name`, `contact_name`, `industry`, `city_or_region`, `personalized_intro`, `recommended_products`, `portfolio_image_url`, `portfolio_image_alt`, `sender_name`, `sender_email`, `sender_phone`, `unsubscribe_text`) are also accepted in templates.

Derived placeholders (filled automatically): `greeting`, `organizationDisplayName`, `subjectOrganizationTarget`, `broaderRangeLine`, `regionLine`, `regionLineHtml`, `portfolioImageLine`, `portfolioImageHtml`, `categoryLine`.

Fallbacks never invent facts. Missing contact uses a neutral greeting; empty region/website lines are removed; unresolved `{{...}}` patterns block draft approval in Step 4.

## Default template

Editable PT-PT default seeded on new draft campaigns via `default-templates.ts` (not hardcoded in renderer).

## Workflow

1. Open a draft campaign at `/pt-PT/leadops/campaigns/[campaignId]`.
2. Edit subject and plain-text template; review available variables and sender warnings.
3. Preview a sample recipient render and unresolved-variable counts.
4. Generate deterministic drafts for included recipients.
5. Review draft list filters (`PENDING`, `DRAFTED`, `NEEDS_REVIEW`, edited, unresolved).
6. Edit an individual draft; reload to confirm exact persistence.
7. Regenerate one draft only after confirming overwrite when manual edits exist.

Step 4 (approval) builds on `NEEDS_REVIEW` blocking and sender completeness checks.
