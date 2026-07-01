# Marketing Integrations Deployment Notes

Date: 2026-07-01

## Current Deployment State

Marketing integrations are local preview only. No live image generation, ad publishing, external upload, or provider metric sync is enabled.

## Environment Variables

No new required environment variables were added for this foundation. Future provider work should add placeholders to `.env.example` only, never real credentials.

## Production Readiness Gates

Before live provider deployment:

- Move provider adapters to server-only code.
- Add tenant-scoped configuration storage.
- Add authorization and permission checks.
- Add encrypted secret storage.
- Add OAuth callback handling for ad providers.
- Add dry-run/test-account validation.
- Add spend limits and publish confirmations.
- Add audit logs for all provider actions.
- Add failure and rollback states.

## Local Demo

Run:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000/pt-PT/marketing
http://localhost:3000/en/marketing
```
