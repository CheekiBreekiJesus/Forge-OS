# Email Provider UI Report

Date: 2026-07-02
Branch: `feat/email-outreach-provider`

## Settings diagnostics

The Settings -> Integrations panel now includes an email delivery provider status panel.

Displayed:

- Active provider.
- Configured/not configured.
- Real-send gate.
- Test-send gate.
- API key present as boolean only.
- Sender configured as boolean only.
- Allowlist configured and allowlist count.
- Missing environment variable names.
- Sanitized warnings.

Not displayed:

- API key.
- Partial API key.
- Authorization headers.
- Secret environment values.

## Test-email mode

The protected provider route requires an explicit `SEND TEST` confirmation and server-side provider gates. Local MVP attempt persistence is covered by application tests. A broader end-user campaign-detail UI for selecting approved drafts should be completed after server persistence/auth decisions are made.

## Manual UI follow-up

After validation, open `/pt-PT/settings` and `/en/settings`, select Integrations, and confirm the provider status panel renders in dark/light modes without exposing secrets.
