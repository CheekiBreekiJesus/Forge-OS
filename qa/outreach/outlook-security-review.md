# Outlook integration security review

Date: 2026-07-03  
Scope: local MVP `feat/outlook-local-send-mvp` (post-hardening)

## Passed controls

| Control | Implementation |
|---|---|
| No tokens in browser storage | Server-only token cache |
| PKCE S256 | `oauth-pkce.ts` |
| OAuth state TTL + single use | `oauth-state.ts` (10 min) |
| Encrypted token cache at rest | AES-256-GCM, `%LOCALAPPDATA%\ForgeOS\auth\` |
| Live send double gate | `OUTLOOK_GRAPH_ENABLED` + `OUTLOOK_LIVE_SEND_ENABLED` |
| Test recipient allowlist | `OUTLOOK_TEST_RECIPIENTS` |
| Server-authoritative send payloads | `canonical-send.ts`, `outlook-send-service.ts` |
| Durable idempotency | `durable-send-attempt-store.ts` |
| Mailbox / sender consistency | Normalized email compare before send |
| Mutation route boundary | `route-guard.ts` (actor headers, Origin, localhost) |
| No auto-retry on uncertain | `classify-error.ts`, recovery marks stale `submitting` → `uncertain` |
| Status API redaction | No token fields in JSON |
| Audit sanitization | `outlook-audit.ts` strips tokens/bodies |
| No secrets in repo | `.env.example` placeholders only |

## Residual limitations

1. **OAuth pending state in memory** — restart during OAuth flow requires reconnect.
2. **In-memory fallback** when `FORGEOS_LOCAL_ENCRYPTION_KEY` missing — documented; not for production.
3. **Organic session tick** — requires app running (no durable background worker).
4. **HTTP 202** — not delivery confirmation; UI/docs state this explicitly.
5. **Single-machine cache** — not suitable for multi-user hosted deployment without redesign.
6. **Runtime repository injection** — API returns 503 until `LocalRepositoryBundle` is wired for server runtime.
7. **Aliases / shared mailboxes** — not supported; exact sender mailbox match required.

## Not audited (out of scope)

- Production authentication architecture (unchanged)
- Hosted Supabase RLS
- Microsoft tenant conditional access policies

## Recommendation

Safe for **local operator-controlled** testing with hardened server boundaries. Do not enable live send until Entra app, encryption key, allowlist, and mailbox/sender alignment are configured deliberately.
