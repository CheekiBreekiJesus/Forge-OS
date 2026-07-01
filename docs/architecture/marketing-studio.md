# Marketing Studio Architecture

Date: 2026-07-01

## Scope

Marketing Studio is a local-first foundation for planning, reviewing, and exporting marketing work inside ForgeOS. It is designed as reusable platform logic, not as a JH Gomes-only workflow.

Implemented foundation:

- Brand Kit records for reusable company voice, colours, claims, CTAs, social links, and legal footer.
- Marketing campaigns with products, audiences, channels, budget metadata, approval state, and export state.
- Campaign content variants generated through deterministic local fallback logic.
- Marketing asset metadata linked to products and campaigns.
- Audience records for local targeting strategy.
- Advertising account status records for provider diagnostics and payload previews.
- Video projects with deterministic storyboards.
- Local analytics derived from stored campaigns, assets, accounts, products, and video projects.

Not implemented in this increment:

- Authentication or authorization.
- Supabase/server persistence for marketing records.
- Live ad account OAuth.
- Live campaign publishing.
- Paid image or video generation.
- Real provider metric sync.

## Main Boundaries

- Domain types: `src/domain/marketing-types.ts`
- IndexedDB repositories: `src/persistence/indexeddb/marketing-repositories.ts`
- Repository contracts: `src/persistence/interfaces.ts`
- Client hooks: `src/persistence/hooks.ts`
- Studio UI: `src/components/marketing-studio-shell.tsx`
- Routes:
  - `src/app/[locale]/marketing/page.tsx`
  - `src/app/[locale]/marketing/[section]/page.tsx`
  - `src/app/[locale]/marketing/campaigns/[campaignId]/page.tsx`

## Persistence

The local IndexedDB schema is versioned with `SCHEMA_VERSION = 5`. Marketing tables are tenant-scoped and are included in local backup export/import.

Tables:

- `brandKits`
- `marketingAssets`
- `marketingCampaigns`
- `campaignContentVariants`
- `marketingAudiences`
- `advertisingAccounts`
- `advertisingCampaignMappings`
- `videoProjects`

Product records now include marketing asset reference fields so catalogue-approved and transparent assets can be selected without embedding binary data in product records.

## Approval Model

Campaigns, content variants, and assets use explicit approval states. Mutating approved campaign or asset metadata invalidates approval where practical. Live publishing remains disabled regardless of approval state.

## Tenant Model

Every marketing business record includes `tenantId`. Local repositories filter by tenant. This is not a substitute for production authorization; Supabase RLS or equivalent server-side tenant enforcement remains required before live deployment.

## Localization

All user-facing Marketing Studio labels are supplied by `src/i18n/locales/pt-PT.ts` and `src/i18n/locales/en.ts`. Internal route names, component names, repository names, and domain fields remain English.
