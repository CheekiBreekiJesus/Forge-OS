# ForgeOS — Current State

Authoritative snapshot for the JH Gomes outreach release path.  
Branch baseline: `integration/jh-gomes-outreach-runtime` @ `bf5f3fe`.

## Canonical architecture

- **Single root Next.js application** (`package.json`, `src/app/`, `src/features/`).
- **Not** a Turborepo or multi-app workspace.
- Domain boundaries live under `src/features/*`, application services under `src/application/`, persistence under `src/persistence/`.
- **JH Gomes** is the first tenant (`tenant_jh_gomes`); code must stay tenant-scoped and customer-neutral at the platform level.
- Internal naming: English. UI: `pt-PT` and `en` via `src/i18n/`.

## What is implemented

| Area | Status |
|------|--------|
| Lead CSV/XLSX import | IndexedDB + UI |
| Campaign segmentation and drafts | IndexedDB |
| Deterministic + AI email generation | API + client |
| Version-aware approval | `campaign-approval-service` |
| Campaign send jobs (simulation) | IndexedDB client path active |
| Send-job server routes | Wired; default deps return 503 until Supabase adapter configured |
| Brevo test-send (protected) | API with allowlist + confirmation |
| Public unsubscribe + suppression | Token + durable store when Supabase configured |
| Brevo webhook ingestion | Supabase durable events |
| Customer PC local runtime | Windows scripts, `http://localhost:3000` |
| Local health endpoint | `GET /api/health/local` |

## What is simulated

| Area | Mode |
|------|------|
| Email batch delivery (default) | `OUTREACH_DELIVERY_PROVIDER=simulation` |
| AI generation in CI/tests | `AI_*_PROVIDER=deterministic` |
| Smartlead | Deprecated; blocked at provider boundary |
| Production auth | Dev/test header adapter only; production fails closed |
| Hosted Supabase in browser | Not connected; IndexedDB is runtime default |

## What is production-connected (when configured)

| Area | Requirement |
|------|-------------|
| Supabase PostgreSQL | `NEXT_PUBLIC_SUPABASE_URL`, service role for server writes |
| Brevo live/test send | `BREVO_*`, `OUTREACH_REAL_SEND_ENABLED`, allowlist |
| Abacus AI | `ABACUS_API_KEY` (optional; falls back to deterministic) |

## Persistence modes

| Mode | Env | Storage |
|------|-----|---------|
| `local` (default) | unset / `FORGEOS_PERSISTENCE_MODE=local` | IndexedDB (Dexie), name from `FORGEOS_LOCAL_DB_NAME` |
| `supabase` | `FORGEOS_PERSISTENCE_MODE=supabase` + Supabase URL/keys | PostgreSQL via migrations in `supabase/migrations/` |

IndexedDB schema version: **13**. Seed version: **4**.  
Customer PC template DB name: `forgeos:jhgomes:local`. Dev default: `forgeos:jhgomes:development`.

## Authentication status

- **Client:** static `DEFAULT_TENANT_ID` in persistence provider (no session).
- **Server send-jobs:** `resolveTrustedSendJobActorContext` — header-based in dev/test; **throws in production** until Supabase session adapter is configured.
- **Supabase RLS:** migrations expect `auth.uid()` via `tenant_memberships`; not wired to Next.js middleware yet.
- **Test identity:** enabled only when `FORGEOS_TEST_AUTH_ENABLED=true` (CI/E2E).

## Email delivery status

- Default: **simulation** — accepts exact approved subject/body, no external send.
- Brevo: test-send and webhooks only; batch `brevo` mode gated.
- Smartlead: **not supported** for exact-content delivery; returns `unsupported-exact-content` / `configuration-missing`.
- Duplicate send: blocked at validation, idempotency key, and delivery-attempt uniqueness.

## Validation commands

```bash
npm run lint          # 0 errors (12 pre-existing warnings)
npm run typecheck
npm test              # unit tests under src/
npm run build
npm run test:e2e      # 43 tests, port 3012, DB forgeos:e2e:default
npm run test:acceptance  # 50 tests, port 3001, DB forgeos:e2e:acceptance
npm run test:customer-pc:smoke
npm run validate      # lint + typecheck + test + build
```

Focused outreach E2E: `e2e/outreach-workflow.spec.ts`, `e2e/campaign-send-job-simulation.spec.ts`, `e2e/acceptance/03-leads-import-outreach.spec.ts`.

## Test counts (baseline)

| Suite | Count |
|-------|-------|
| Unit (`npm test`) | 246 |
| Main E2E | 43 |
| Acceptance | 50 (+ 1 live-AI skipped by default) |

## Remaining production blockers

1. Supabase session auth wired to Next.js (no middleware yet).
2. Tenant public ID (`tenant_jh_gomes`) → UUID mapping for Supabase FKs.
3. Server send-job Supabase repository adapter (routes exist, deps null).
4. RLS policies on send-job and public-event tables (service_role only today).
5. Full webhook → IndexedDB reconciliation for hosted mode.
6. Smartlead exact-content mapping not documented — live Smartlead blocked.
7. Production rate limiting and audit log persistence to Supabase.

## Contradictory docs (archived / superseded by this file)

- `docs/product/outreach-mvp-implementation.md` — references localStorage and active Smartlead.
- `docs/architecture/local-mvp-persistence.md` — outdated schema/seed versions.
- `docs/deployment/mvp-live-readiness.md` — Smartlead as production path.

See `docs/email-outreach/integration-status.md` for outreach module detail.
