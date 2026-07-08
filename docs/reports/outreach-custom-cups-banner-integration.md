# Outreach Custom Cups Banner Integration

Date: 2026-07-08  
Branch: `release/jh-gomes-outreach-supabase`

## Source and destination

| Item | Path |
|------|------|
| Source image (copied, original preserved) | `C:\Users\J35U5\Desktop\JH Gomes\email-banner-customcups.png` |
| Repository asset | `public/assets/email-outreach/jh-gomes/custom-cups-banner.png` |

### Image metadata

- Format: PNG (`89504e470d0a1a0a`)
- Source pixel dimensions: 2172 × 724 (≈ 3:1)
- Display width in email HTML: 600 px (`height: auto`)
- File size: 1,807,891 bytes (~1.8 MB)
- Note: large for email; consider lossless optimization before high-volume sending

## Template files modified

- `src/features/leadops/outreach-email-assets.ts` (new)
- `src/features/leadops/outreach-template-derived-content.ts`
- `src/features/leadops/template-rendering.ts`
- `src/features/leadops/default-templates.ts` (template version 4)
- `src/application/campaign-draft-service.ts`
- `src/features/email-composition/sanitize.ts`
- Tests under `src/features/leadops/` and `src/application/campaign-draft.integration.test.ts`

## HTML placement

Shared renderer flow (`renderCampaignTemplate` → `buildVariableMap`):

1. Greeting + personalized intro
2. Company value proposition (reusable/paper cups)
3. Recommended products + broader range + region
4. Portfolio banner (`{{portfolioImageHtml}}`)
5. Supporting sentence (`{{portfolioSupportingLine}}`)
6. CTA (orçamento / mockup)
7. Signature + unsubscribe footer

Email-safe markup uses a presentation `<table>` with `<img width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;">`.

## Plain-text fallback

Always includes:

`Formatos disponíveis: 250 ml, 330 ml, 430 ml e 500 ml.`

No placeholder text, file paths, or raw HTML image markup.

## URL generation strategy

Absolute URL (preferred for delivery):

`{FORGEOS_PUBLIC_BASE_URL or NEXT_PUBLIC_APP_URL}/assets/email-outreach/jh-gomes/custom-cups-banner.png`

- Trailing slashes normalized
- No double slashes
- HTTPS required for non-local hosts
- `http://localhost` / `http://127.0.0.1` allowed for local dev
- No CID attachments (not implemented in current Brevo path)

### `FORGEOS_PUBLIC_BASE_URL` behavior

| Mode | Base URL | HTML image |
|------|----------|------------|
| Delivery (`renderMode: "delivery"`) | Valid HTTPS / local HTTP | Absolute URL in `<img src>` |
| Delivery | Missing / invalid | Image omitted; warning logged in render result |
| Preview (`renderMode: "preview"`) | Missing / invalid | Relative `/assets/email-outreach/...` allowed for in-app preview |

Draft generation and stored recipient HTML use **delivery** mode. Live template sample preview uses **preview** mode.

## Preview vs delivered email

| Surface | Renderer | Banner behavior |
|---------|----------|-----------------|
| Campaign template sample preview | `previewTemplateSample` → `renderMode: "preview"` | Banner via absolute localhost URL or relative asset |
| Generated drafts | `generateCampaignDrafts` → `renderMode: "delivery"` | Absolute URL when base URL configured |
| Approved draft HTML panel | Stored `personalizedHtml` | Same HTML generated at draft time |
| Protected test send | `recipient.personalizedHtml` | Same stored HTML; no re-render at send time |
| Future real send | `campaign-send-job-service` uses stored HTML | Same stored HTML |

**Regeneration note:** Existing approved drafts keep prior HTML until manually regenerated. Campaigns with saved template version 3 do not auto-upgrade; regenerate drafts after deploy to pick up banner + supporting line.

## Tests executed

```text
npm run lint                 → pass (0 errors, pre-existing warnings only)
npm run typecheck            → pass
npm run test                 → pass (304 passed, 3 skipped)
npm run build                → pass
```

Focused suites:

- `src/features/leadops/outreach-email-assets.test.ts`
- `src/features/leadops/outreach-template-derived-content.test.ts`
- `src/features/leadops/template-rendering.test.ts`
- `src/application/campaign-draft.integration.test.ts`

## Manual validation (no email sent)

1. Started `npm run dev` on `http://localhost:3000`
2. Opened `/pt-PT/leadops/campaigns/campaign_001`
3. Clicked **Pré-visualizar exemplo**
4. Confirmed banner image present:
   - `src`: `http://localhost:3000/assets/email-outreach/jh-gomes/custom-cups-banner.png`
   - Rendered size: 600 × 200
   - Alt text lists four cup sizes
5. Confirmed plain-text content includes `250 ml`
6. Confirmed asset endpoint returns `200 image/png`
7. No Brevo test email sent
8. No `C:\Users\` paths in rendered HTML

## Deployment requirement

Yes. External recipients need:

1. Deployed ForgeOS build including `public/assets/email-outreach/jh-gomes/custom-cups-banner.png`
2. `FORGEOS_PUBLIC_BASE_URL` set to the public HTTPS host

Until both are true, delivery-mode HTML omits the image (plain-text sizes still present).

## Remaining limitations

- Banner default is tenant-scoped to `tenant_jh_gomes` only
- Source PNG is ~1.8 MB (large for email bandwidth)
- Stored drafts do not auto-refresh when template changes; regeneration required
- Sanitizer strips `role="presentation"` from tables (image still renders)
- No CID/inline attachment support

## Email send confirmation

**No email was sent during this task.** Brevo safety configuration unchanged.
