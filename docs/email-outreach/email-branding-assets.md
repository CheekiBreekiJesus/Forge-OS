# Email Branding Assets (ForgeOS 0.2.0 local demo)

Date: 2026-07-06  
Branch: `release/forgeos-0.2.0-local-demo`

## What was added

Outreach campaign drafts and delivery self-tests now render a lightweight HTML email body with:

1. **Showcase image block** — placed after the intro/value proposition paragraph.
2. **Branded footer block** — JH Gomes logo, sender name, email, phone, website, optional CTA, and preserved opt-out text.

Plain-text output is preserved for provider fallback and copy workflows.

## Static placeholder assets (v0.2.0)

| Asset | Path | Purpose |
| --- | --- | --- |
| Showcase image | `public/demo/outreach/jh-gomes-showcase.svg` | Mini portfolio / cup examples placeholder |
| Company logo | `public/demo/outreach/jh-gomes-logo.svg` | Footer logo placeholder |

Replace these files in place, or point configuration to HTTPS URLs when hosting assets on a public CDN/domain.

## Configuration

### Outreach test profile (Settings → Integrations)

Stored in IndexedDB (`outreachTestProfiles`):

| Field | Description |
| --- | --- |
| `showcaseImageReference` | Public HTTPS URL or app-relative path (e.g. `/demo/outreach/jh-gomes-showcase.svg`) |
| `companyLogoReference` | Public HTTPS URL or app-relative path |
| `footerCtaLabel` | Short CTA link text (default: *Ver copos personalizados*) |
| `footerCtaUrl` | CTA destination (defaults to company website) |

JH Gomes test defaults are loaded via **Load JH Gomes test defaults** in Settings.

### Environment overrides (server-side self-test)

Optional server env vars (see `.env.example`):

- `FORGEOS_OUTREACH_SHOWCASE_IMAGE_PATH`
- `FORGEOS_OUTREACH_LOGO_PATH`

Relative paths are resolved with `FORGEOS_PUBLIC_BASE_URL` when building embeddable image URLs for email HTML.

## Rendering pipeline

- Campaign templates: `renderCampaignTemplate()` → `applyOutreachBrandingToEmail()`
- Draft generation: `campaign-draft-service.ts` loads branding via `loadOutreachBrandingConfig()`
- Settings self-test: `buildSelfTestDeliveryRequest()` uses `buildBrandedSelfTestEmailContent()`
- UI preview: campaign template sample preview renders sanitized HTML (`campaign-template-drafts-panel.tsx`)

## Image availability and fallback

- Embeddable images require HTTPS URLs without `localhost`.
- If an image cannot be resolved, HTML shows the caption as text (no broken `<img>`).
- Plain text uses a bracketed caption placeholder instead of a URL.

## Replacing with cup customizer output (v0.3.0)

1. Generate a recipient-specific mockup PNG/WebP from the cup customizer.
2. Upload/host the image at a public HTTPS URL (or tenant asset store with public URL).
3. Set `showcaseImageReference` to that URL in the outreach test profile, or inject per-recipient media in the composition layer.
4. Keep the footer/logo references unchanged unless the company branding changes.

No campaign send architecture changes are required for v0.3.0 — only the showcase image source becomes dynamic.

## Related code

- `src/features/email-composition/outreach-branding.ts`
- `src/features/email-composition/outreach-branding-config.ts`
- `src/application/outreach-branding-context.ts`
- `src/application/self-test-outreach-branding.ts`

## Tests

```bash
npm test -- src/features/email-composition/outreach-branding.test.ts
npm test -- src/features/leadops/template-rendering.test.ts
npm test -- src/application/email-delivery-self-test-service.test.ts
```
