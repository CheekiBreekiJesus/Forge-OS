# ForgeOS — Current State

Authoritative snapshot for the JH Gomes outreach release path.  
Branch baseline: `release/jh-gomes-outreach-supabase` (from `de654e2`).

## Canonical architecture

- **Single root Next.js application** (`package.json`, `src/app/`, `src/features/`).
- Domain boundaries under `src/features/*`, application services under `src/application/`, persistence under `src/persistence/`.
- **JH Gomes** resolves via `tenants.tenant_key = tenant_jh_gomes` → UUID; platform code stays tenant-scoped and customer-neutral.
- Internal naming: English. UI: `pt-PT` and `en` via `src/i18n/`.

## Outreach production persistence slice (implemented)

| Area | Status |
|------|--------|
| Stable tenant key (`tenants.tenant_key`) | Migration + lookup helpers |
| Supabase cookie session + membership | `src/lib/auth/session.ts` |
| Server-owned send route | `POST /api/outreach/messages/{messageId}/send` |
| Supabase repository bundle (outreach path) | `createSupabaseRepositoryBundle()` |
| Atomic delivery claim RPC | `claim_outreach_send_attempt` |
| Delivery attempt persistence | `outreach_send_attempts` |
| Campaign recipients (PostgreSQL) | `outreach_campaign_recipients` |
| RLS read policies + blocked direct send-attempt writes | Migration `202607031600` |
| UI supabase send path | `campaign-recipient-review-panel` → server endpoint |
| Brevo provider events (durable) | Existing `outreach_provider_events` + webhook |
| SQL integration tests | `npm run test:supabase:integration` (requires `FORGEOS_TEST_DATABASE_URL`) |

## Persistence modes

| Mode | Env | Storage |
|------|-----|---------|
| `local` (default) | unset / `FORGEOS_PERSISTENCE_MODE=local` | IndexedDB (Dexie) |
| `supabase` | `FORGEOS_PERSISTENCE_MODE=supabase` + Supabase URL/keys | PostgreSQL via `supabase/migrations/` |

Browser IndexedDB behavior is unchanged in `local` mode.  
When `NEXT_PUBLIC_FORGEOS_PERSISTENCE_MODE=supabase`, campaign simulate-send uses the server-owned endpoint.

## Authentication status

- **Production:** Supabase cookie session → `tenant_memberships` → tenant UUID (never trusts client tenant headers).
- **Test/E2E:** `FORGEOS_TEST_AUTH_ENABLED=true` or `FORGEOS_E2E=true` only.
- **Development headers:** `FORGEOS_ALLOW_DEV_AUTH_HEADERS=true` and non-production only.
- **Test tenant key resolution:** `tenant_jh_gomes` → UUID when Supabase configured.

## Email delivery status

- Default: **simulation** with exact approved subject/body.
- Duplicate send: blocked by approval state, idempotency key, unique constraint, and atomic claim RPC.
- Smartlead live: blocked (unchanged).
- Brevo: test-send + webhooks; batch live gated.

## Validation commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run test:acceptance
npm run test:customer-pc:smoke
npm run test:supabase:integration   # requires PostgreSQL (CI service or FORGEOS_TEST_DATABASE_URL)
```

## Remaining production blockers

1. Full Supabase local stack verification (`supabase start`) — CLI available via `npx supabase`; Docker daemon was not running on the implementation machine.
2. Hosted PostgREST vertical test through `@supabase/supabase-js` (repository bundle) — requires live Supabase API, not raw PostgreSQL only.
3. Browser Supabase read path for campaign UI data (currently IndexedDB client; server send only wired for supabase mode).
4. Send-job routes still use development header actor context in non-production.
5. Production deployment and secrets configuration.

## Contradictory docs (superseded by this file)

- `docs/product/outreach-mvp-implementation.md` — pre-Supabase persistence notes.
- `docs/architecture/local-mvp-persistence.md` — outdated schema versions.

See `docs/email-outreach/integration-status.md` for module detail.
