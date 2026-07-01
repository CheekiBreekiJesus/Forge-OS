# Advertising Provider Architecture

Date: 2026-07-01

## Current State

Marketing Studio includes a provider-neutral advertising interface and deterministic local preview providers for:

- Google Ads
- Meta Ads

Implemented file:

- `src/features/marketing/providers.ts`

Live publishing is disabled. Provider methods return diagnostics, empty account lists, disabled draft payload previews, and disconnected metric state.

## Provider Contract

Advertising providers must implement:

- `validateConfiguration()`
- `listAccounts()`
- `createCampaignDraft(request)`
- `uploadAsset(request)`
- `fetchMetrics()`

The current local preview providers never publish, spend budget, upload assets, or fetch live metrics.

## Publishing Gate

Live publishing must remain blocked until all of these exist:

- OAuth or equivalent account authentication.
- Tenant-scoped provider configuration.
- Billing and spend limits.
- Permission checks.
- Dry-run/test account validation.
- Explicit publish confirmation UX.
- Audit logging.
- Rollback or pause workflow.

## Data Separation

Provider account records store only local status metadata in this increment. No access tokens, refresh tokens, customer account secrets, or external private records are stored.
