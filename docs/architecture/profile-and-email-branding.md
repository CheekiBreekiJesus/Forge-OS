# Profile and Email Branding Architecture

## Overview

ForgeOS separates **company identity**, **user identity**, and **sender identity** so Outreach emails can be branded, reusable across users, and safe to copy into Gmail, Outlook, or other clients.

## Canonical entities

| Entity | Purpose |
|--------|---------|
| `CompanyProfile` | Legal/trading name, address, VAT, website, logo, legal footer |
| `UserProfile` | Operator name, role, contact, language preference |
| `SenderIdentity` | From/reply-to, signature overrides, default sender per workspace |
| `LocalAsset` | IndexedDB blobs for logos and profile images |
| `Product` | Extended with `productPageUrl`, `imageUrl`, `customizerUrl`, email copy fields |

These are **not** merged into a single settings object.

## Persistence

- Dexie schema **v2** adds: `companyProfiles`, `userProfiles`, `senderIdentities`, `localAssets`, `products`
- Migration preserves existing leads, outreach drafts, and campaigns
- Default company/user/sender seeded **once** when missing
- Repository interfaces are Supabase-ready (`CompanyProfileRepository`, etc.)

## Email composition

Generation is split into:

1. **AI copy only** — subject, greeting, introduction, offer, CTA, `contextUsed`
2. **Trusted assembly** — links, media blocks, signature, legal footer, plain text, HTML

`EmailComposition` stores snapshots at generate/approve time so later profile edits do not alter approved messages.

### AI input minimization

VAT, full address, phone, and legal footer are **not** sent to Abacus unless explicitly required. `buildMinimizedAIInput()` defines the allowed prompt surface.

## Media behavior

| Context | Behavior |
|---------|----------|
| Local preview | Show IndexedDB images or labeled placeholders (`[Logótipo da empresa]`, etc.) |
| Copied / external HTML | Embed images only when `https://` public URL exists |
| Local-only assets | Warning shown; placeholder text in plain text |

## Copy and email clients

- **Copy plain text** — subject label + paragraph breaks
- **Copy formatted** — `ClipboardItem` with `text/html` + `text/plain` fallback
- **mailto** — truncates body when URL exceeds ~1800 chars
- **Gmail / Outlook web** — compose URLs with encoded subject/body (plain text)

ForgeOS does not claim delivery success for external clients.

## Backup and restore

JSON backup v2 includes profile tables and optional base64 asset blobs. CSV exports exclude blobs. `validateBackup()` checks schema before import.

## Future hosted work

- Supabase Storage for logos and product images
- Google / Microsoft OAuth via Supabase Auth
- Sender identity linked to authenticated workspace membership

## Related docs

- [Outreach pilot workflow](../product/outreach-pilot-workflow.md)
- [Auth and mailbox roadmap](../deployment/auth-and-mailbox-roadmap.md)
- [MVP live readiness](../deployment/mvp-live-readiness.md)
