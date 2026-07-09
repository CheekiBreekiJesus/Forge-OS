# Report 2 — Email Outreach Operational Readiness

**Date:** 2026-07-09  
**Branch:** `integration/outreach-operational-readiness`  
**Base:** `main` @ `a2ba48b` (post-hardening merge)

## 1. End-to-end architecture

Five send paths coexist:

| Path | UI | Provider | Persistence |
|------|-----|----------|-------------|
| Legacy lead detail | `leadops-detail-workspace` | Simulation | IndexedDB |
| Campaign batch queue (local) | `campaign-queue-send-panel` | Simulation | IndexedDB |
| Per-recipient simulate | Review panel | Simulation / Supabase API | Mode-dependent |
| Protected Brevo test | Review panel | Brevo (`provider_test`) | IndexedDB attempts |
| Hosted send jobs (7C/7D2) | Campaign Advanced + API | Simulation or Brevo (`real_send`) | Supabase |

**Production SoT:** Hybrid — campaign authoring in IndexedDB; server delivery and durable events in Supabase when hosted.

## 2. UI findings (severity)

### Blockers (remaining)
- Dual workflows can diverge
- Local queue processor only runs while page open
- Hosted Brevo batch not yet exposed in campaign queue UI (API ready)

### Fixed (this branch)
- Dashboard campaign dead ends
- Fake import summary on lead detail
- Misleading "Sent" label → simulated delivery
- Suppression hardcoded `pt-PT` links
- Test-send route auth in Supabase mode

## 3. Real vs simulated

| Capability | Status |
|------------|--------|
| Simulation | Default everywhere |
| Protected test Brevo | Implemented — env + allowlist + `SEND TEST` |
| Hosted Brevo batch (`real_send`) | **Server path wired** — `QUEUE BREVO` + gates |
| Local browser Brevo batch | Blocked (must use hosted API) |
| Legacy `server-delivery.ts` Brevo | Still blocked (test workflow only) |

## 4. Changes (this branch)

### UI / auth
- `leadops-dashboard-shell.tsx` — campaign card links
- `leadops-detail-workspace.tsx` — remove fake import stats
- `leadops-suppression-panel.tsx` — locale-aware links
- `test-send/route.ts` — auth + rate limit (Supabase mode)
- i18n: simulated delivery labels, `importSummaryUnavailable`

### Real send plumbing
- `EmailDeliveryMode` += `real_send`
- `build-campaign-delivery-request.ts` — unsubscribe URLs for batch sends
- `brevo-provider.ts` — separate `real_send` vs `provider_test` gates
- `hosted-send-job-repositories.ts` — use real provider from env
- `send-job-server-mutations.ts` — allow gated `QUEUE BREVO` (daily cap 25)

## 5. Security

- Brevo API key server-only
- Real send requires `OUTREACH_REAL_SEND_ENABLED` + full config
- Idempotency keys on all sends
- Atomic job locks + duplicate attempt prevention
- Tenant-scoped webhook ingestion (existing)

## 6. Tests executed (cloud)

| Suite | Result |
|-------|--------|
| Unit | **489 passed**, 17 skipped |
| Typecheck | Pass |
| Build | Pass (post-commit) |
| Supabase integration | 17/17 (prior hardening run) |
| Focused Playwright | 20/20 (prior hardening run) |
| Protected Brevo E2E | Not run (requires credentials) |

New tests: `real_send` provider gates, `build-campaign-delivery-request`, Brevo queue rejection.

## 7. Pilot stages

| Stage | Verdict |
|-------|---------|
| Stage 0 — Simulation | **Supported** |
| Stage 1 — Internal protected test | **Ready** when env configured |
| Stage 2 — Small pilot (10–25) | **API ready** — needs hosted UI wiring + human approval |
| Stage 3 — Limited operational | Not ready |

## 8. Final verdict

**Ready for internal test** (Stage 1 protected Brevo send).

**Stage 2 server infrastructure is in place** but requires hosted deployment configuration, campaign UI for `QUEUE BREVO`, and a controlled human-approved pilot send.

## 9. Best next action

Configure Stage 1 env on hosted ForgeOS, run one protected test send to an allowlisted internal address, verify webhook in `outreach_provider_events`, then add hosted campaign UI for gated `QUEUE BREVO` and execute Stage 2 with ≤25 manually reviewed recipients.

## Related audits

- [01-UI-AUDIT.md](./01-UI-AUDIT.md)
- [03-BREVO-READINESS.md](./03-BREVO-READINESS.md)
- [04-PERSISTENCE-DEPLOYMENT.md](./04-PERSISTENCE-DEPLOYMENT.md)
