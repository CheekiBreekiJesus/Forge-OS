# Environment Variable Audit

**Audit date:** 2026-07-05  
**Sources:** `.env.example`, `.env.test.example`, `.env.customer.local.example`, source grep, scripts, deployment docs  
**Action:** No template changes in this branch.

---

## Future split (recommended)

| Template | Purpose |
|----------|---------|
| `.env.core.example` | App URL, persistence mode, tenant key |
| `.env.auth.example` | Supabase, test auth, dev headers |
| `.env.outreach.example` | Delivery, Brevo, unsubscribe, webhooks |
| `.env.ai.example` | AI gateway providers |
| `.env.test.example` | E2E/acceptance (existing) |
| `.env.customer.local.example` | Customer PC runtime (existing) |

Compose via documented `cp` chain or setup script after convergence.

---

## Core application

| Variable | Classification | Used | Notes |
|----------|---------------|------|-------|
| `NEXT_PUBLIC_APP_URL` | optional, browser-safe | yes | Health, links |
| `FORGEOS_PUBLIC_BASE_URL` | optional, server | yes | Unsubscribe URLs |
| `FORGEOS_PERSISTENCE_MODE` | used | yes | Server persistence |
| `NEXT_PUBLIC_FORGEOS_PERSISTENCE_MODE` | used, browser-safe | yes | Client send path |
| `FORGEOS_ACTIVE_TENANT_KEY` | optional | yes | Multi-tenant user default |
| `FORGEOS_RUNTIME_MODE` | optional | yes | Health endpoint |
| `FORGEOS_GIT_COMMIT` | optional | yes | Health metadata |
| `FORGEOS_LOCAL_DB_NAME` | used, server | yes | IndexedDB name (server) |
| `NEXT_PUBLIC_FORGEOS_LOCAL_DB_NAME` | used, browser-safe | yes | IndexedDB name (client) |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | optional, browser-safe | customer template | pt-PT default |
| `NODE_ENV` | system | yes | Standard |

**Duplication note:** `NEXT_PUBLIC_APP_URL` and `FORGEOS_PUBLIC_BASE_URL` often hold the same value — consolidate documentation to prefer `FORGEOS_PUBLIC_BASE_URL` for server-generated URLs.

---

## Auth / Supabase

| Variable | Classification | Used | Notes |
|----------|---------------|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | used, browser-safe | yes | Client + server fallback |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | used, browser-safe, secret-ish | yes | Public anon key |
| `SUPABASE_URL` | duplicated | yes | Server duplicate of public URL |
| `SUPABASE_SERVICE_ROLE_KEY` | secret, server-only | yes | Service client |
| `FORGEOS_TEST_AUTH_ENABLED` | test-only | yes | Never production |
| `FORGEOS_E2E` | test-only | yes | Playwright |
| `FORGEOS_TEST_USER_ID` | test-only | yes | CI |
| `FORGEOS_TEST_TENANT_ID` | test-only | yes | CI |
| `FORGEOS_TEST_ROLES` | test-only | yes | CI |
| `FORGEOS_ALLOW_DEV_AUTH_HEADERS` | test-only | yes | Dev API testing |
| `FORGEOS_TEST_DATABASE_URL` | test-only, secret | yes | SQL integration tests |
| `DATABASE_URL` | test-only fallback | yes | `test-harness.ts` |

**Duplication:** `SUPABASE_URL` mirrors `NEXT_PUBLIC_SUPABASE_URL` — document single source; server may read public var.

---

## Outreach / email delivery

| Variable | Classification | Used | Notes |
|----------|---------------|------|-------|
| `EMAIL_DELIVERY_PROVIDER` | used | yes | Legacy alias |
| `OUTREACH_DELIVERY_PROVIDER` | used | yes | Preferred name |
| `OUTREACH_REAL_SEND_ENABLED` | used | yes | Brevo live gate |
| `OUTREACH_TEST_SEND_ENABLED` | optional | yes | Test send |
| `OUTREACH_TEST_RECIPIENT_ALLOWLIST` | optional | yes | Safety |
| `OUTREACH_PROVIDER_TIMEOUT_MS` | optional | yes | Provider calls |
| `OUTREACH_UNSUBSCRIBE_SECRET` | secret, server-only | yes | Token signing |
| `OUTREACH_WEBHOOK_TENANT_ID` | optional, server | yes | Brevo webhook |
| `BREVO_API_KEY` | secret, server-only | yes | Active provider |
| `BREVO_SENDER_EMAIL` | server-only | yes | |
| `BREVO_SENDER_NAME` | server-only | yes | |
| `BREVO_REPLY_TO` | optional | yes | |
| `BREVO_WEBHOOK_SECRET` | secret, server-only | yes | |

### Smartlead (deprecated)

| Variable | Classification | Used | Notes |
|----------|---------------|------|-------|
| `SMARTLEAD_API_KEY` | deprecated | yes (code) | `.env.example` marked deprecated |
| `SMARTLEAD_API_BASE_URL` | deprecated | no grep in src | Template only |
| `SMARTLEAD_DEFAULT_CAMPAIGN_ID` | deprecated | yes | `providers.ts` |
| `SMARTLEAD_SUBJECT_FIELD` | deprecated | yes | `providers.ts` |
| `SMARTLEAD_BODY_FIELD` | deprecated | yes | `providers.ts` |

**Recommendation:** Remove Smartlead code paths after feature-owner review post-convergence.

---

## AI providers

| Variable | Classification | Notes |
|----------|---------------|-------|
| `AI_DEFAULT_PROVIDER` | used | `deterministic` in CI |
| `AI_FALLBACK_PROVIDER` | used | |
| `AI_OUTREACH_PROVIDER` | used | Capability-specific |
| `AI_*_TEMPERATURE`, `AI_*_MAX_TOKENS`, etc. | optional | Outreach tuning |
| `ABACUS_*` | optional, secret | Active default provider |
| `OPENAI_*`, `ANTHROPIC_*`, `GOOGLE_AI_*`, etc. | optional, secret | Gateway aliases |
| `OLLAMA_*`, `LMSTUDIO_*`, `VLLM_*` | optional | Local inference |
| `AI_ALLOW_BROWSER_PROVIDER_SELECTION` | browser-safe | false in production |
| `AI_LOG_PROMPTS`, `AI_LOG_RESPONSES` | optional | Privacy risk if true |
| `FORGEOS_LIVE_AI` | test-only | `live-ai.spec.ts` |

---

## Outlook (customer PC template)

| Variable | Classification | Used |
|----------|---------------|------|
| `OUTLOOK_GRAPH_ENABLED` | optional | customer template |
| `OUTLOOK_LIVE_SEND_ENABLED` | optional | customer template |
| `MICROSOFT_CLIENT_ID` | secret | customer template |
| `MICROSOFT_AUTHORITY` | optional | customer template |
| `MICROSOFT_REDIRECT_URI` | optional | customer template |
| `FORGEOS_LOCAL_ENCRYPTION_KEY` | secret | customer template |

Not used on integration base outreach path.

---

## Test / acceptance scripts

| Variable | Classification | Used |
|----------|---------------|------|
| `ACCEPTANCE_BASE_URL` | test-only | `private-import-acceptance.ts` |
| `PRIVATE_ACCEPTANCE_*` | test-only | Private import script |
| `FORGEOS_LOCAL_LOG_DIR` | optional | Customer PC |

---

## Unused / template-only candidates

| Variable | Verdict |
|----------|---------|
| `SMARTLEAD_API_BASE_URL` | unused in src — deprecated |
| Many `*_OVERRIDE` AI vars | optional — only when provider used |
| Provider-specific vars for unused providers | optional — keep in `.env.ai.example` split |

---

## Security classification summary

| Class | Count (approx) | Handling |
|-------|----------------|----------|
| Secret | ~15 active | Never commit; server-only |
| Browser-safe public | ~8 | `NEXT_PUBLIC_*` only |
| Test-only | ~10 | CI + Playwright only |
| Deprecated | 5 Smartlead | Remove after code cleanup |
