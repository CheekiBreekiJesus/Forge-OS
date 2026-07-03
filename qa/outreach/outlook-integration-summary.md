# Outlook Graph integration summary

Branch: `feat/outlook-local-send-mvp`  
Base: `83209dd` on `feat/email-outreach-mvp-integration`

## Delivered

| Area | Status |
|---|---|
| `EmailSendProvider` + `OutlookGraphEmailProvider` | Done |
| OAuth PKCE (`/api/integrations/outlook/*`) | Done |
| AES-256-GCM token cache | Done |
| `EmailDeliveryProvider` outlook adapter | Done |
| Integration UI `/settings/integrations/outlook` | Done |
| Test send API with allowlist | Done |
| Organic send session controller | Done |
| Unit + integration tests (mocked Graph) | Done |
| Documentation | Done |

## Defaults

- `OUTLOOK_GRAPH_ENABLED=false`
- `OUTLOOK_LIVE_SEND_ENABLED=false`
- Organic session `enabled=false`, max 5, delay 180–420s

## Not in scope

- Brevo configuration
- Real email sends in CI
- Production Supabase mutations
- Background worker while browser closed

## Manual validation

1. Register Entra public client (see `docs/email-outreach/outlook-graph-setup.md`).
2. Set env vars in `.env.local`.
3. Connect mailbox via Settings → Outlook integration.
4. Enable live send only for controlled test with allowlisted recipient.
