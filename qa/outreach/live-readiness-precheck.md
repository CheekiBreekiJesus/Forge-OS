# Outreach Live Readiness Precheck

Date: 2026-07-01  
Purpose: Read-only assessment for the next task (controlled live email pilot). No credentials or real addresses recorded.

## Current functional state

| Capability | Status |
|---|---|
| Sender settings UI | Available in Settings → sender identities |
| User/company signature preview | Available; persists locally |
| Lead email on seed/demo leads | Synthetic demo addresses only |
| Deterministic generation | **Default in test/E2E**; dev may use Abacus when configured |
| Approval workflow | Implemented; edit invalidates approval |
| Gmail compose action | Visible after approval (client handoff) |
| Outlook compose action | Visible after approval (client handoff) |
| Manual sent confirmation / simulate send | Simulation provider; no live SMTP |
| Suppression (unsubscribed/bounced) | Blocks queue on seed lead `leadops_006` |
| Real delivery provider | **Not enabled** (`OUTREACH_DELIVERY_PROVIDER=simulation`) |

## AI provider

- Abacus path exists with deterministic fallback.
- `npm run ai:doctor -- --provider abacus`: SDK unavailable in CI/test env; API key absent unless developer `.env.local` configured.
- E2E/acceptance force deterministic provider on isolated ports (3001/3002).

## Missing for controlled live email pilot

1. Explicit production sender domain authentication (SPF/DKIM/DMARC) checklist — not in app.
2. Live delivery adapter beyond simulation (e.g. Smartlead) — configuration placeholder only.
3. Opt-in/consent audit trail for marketing sends.
4. Rate limits, bounce handling webhooks, and send log retention policy.
5. Runbook for rolling back from simulation to live with tenant-scoped feature flag.
6. Paid AI opt-in guardrails for production sends (deterministic default recommended for first pilot).

## Recommended next task

**Enable live email marketing pilot on deterministic generation first:**

1. Complete sender identity + company profile with real public branding (no secrets in repo).
2. Keep `AI_OUTREACH_PROVIDER=deterministic` for pilot cohort.
3. Integrate one delivery provider behind feature flag; keep simulation as default.
4. Add send audit log entries locally before external delivery.
5. Run manual QA on 3–5 synthetic leads, then a single real internal test address outside git.
