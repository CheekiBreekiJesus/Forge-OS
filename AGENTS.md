# AGENTS.md

## 1. Project summary

**ForgeOS** is a multi-tenant Industrial Operating System for manufacturing SMEs. The first deployment customer is **JH Gomes** (Portuguese cup printing and manufacturing). JH Gomes is a tenant reference implementation, not the product architecture.

**Stage:** early MVP / operational prototype — suitable for demos and workflow validation, **not production-ready**.

**Repository:** `forge-os` (npm package name)

## 2. Current priority

1. **JH Gomes outreach** — lead import, campaign workflow, review/approve, simulation and Brevo-boundary send jobs on the integration base.
2. **Supabase persistence slice** — PostgreSQL outreach vertical with RLS migrations (apply and validate externally).
3. **Auth convergence** — OAuth foundation + tenant membership + activation (on unmerged branches; see `docs/CURRENT_STATE.md`).
4. **Cup Customizer** — quotation cup preview and simulation workflow (active on feature branch).
5. **Secure spreadsheet import** — hardened XLSX/CSV parser direction (remediation on convergence branch).

## 3. Verified tech stack

| Layer | Choice |
|-------|--------|
| Framework | **Next.js 16** (App Router) |
| UI | **React 19**, **TypeScript 5.8**, **Tailwind CSS 3** |
| Local persistence | **IndexedDB** via Dexie (`FORGEOS_PERSISTENCE_MODE=local`) |
| Hosted persistence | **Supabase / PostgreSQL** (`FORGEOS_PERSISTENCE_MODE=supabase`) |
| Auth direction | **Supabase Auth** + OAuth; tenant membership via `tenant_memberships` |
| Email delivery | **Simulation** default; **Brevo** provider boundary (server-side) |
| AI | Provider gateway (deterministic default; Abacus/OpenAI/etc. optional) |
| Unit tests | **Vitest** (`npm test`) |
| E2E / acceptance | **Playwright** (`npm run test:e2e`, `npm run test:acceptance`) |
| Deployment direction | **Vercel** |
| i18n | `pt-PT` (default), `en` |

Do not claim database, auth, framework, or testing are undefined — they are implemented to varying degrees. Distinguish **base branch** vs **unmerged branch** work using `docs/CURRENT_STATE.md`.

## 4. Architecture rules

- Multi-tenant SaaS: every business record is tenant-scoped.
- Internal naming (code, DB, API) is **English**; user-facing text uses i18n dictionaries.
- No JH Gomes-specific hardcoding in global modules — use tenant configuration.
- Domain layout: `src/features/<module>/`, `src/application/`, `src/persistence/`.
- Persistence modes: local IndexedDB (default) or Supabase PostgreSQL (outreach server path).
- Brevo and AI providers are server-side boundaries — never expose secrets to the browser.

### Protected areas (require explicit approval)

- Authentication and session handling
- Row-level security and `supabase/migrations/`
- Billing and infrastructure
- Secrets and environment configuration

## 5. Development rules

- Smallest safe change; architecture-first.
- TypeScript, explicit types, English internal naming.
- UI strings localization-ready (`src/i18n/`).
- Business logic separate from presentation.
- No new dependencies without clear reason.
- Never commit secrets, API keys, or real customer data.

## 6. Security and privacy

- Secrets in environment variables only; `.env.example` has placeholders.
- Tenant isolation in queries, APIs, and UI.
- Test auth (`FORGEOS_TEST_AUTH_ENABLED`, `FORGEOS_E2E`) is **never** for production.
- AI features must not send unnecessary private business data externally.
- See `docs/engineering/agent-privacy-policy.md`.

## 7. Localization

- Backend/code: English.
- UI: `pt-PT`, `en` (future: `es`).
- European Portuguese for JH Gomes deployment; avoid Brazilian phrasing.

## 8. Testing and validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Optional (require setup):

```bash
npm run test:e2e
npm run test:acceptance
npm run test:supabase:integration   # requires FORGEOS_TEST_DATABASE_URL
npm run validate                    # lint + typecheck + test + build
```

### Agent maintenance (read-only by default)

```bash
npm run agent:health
npm run agent:maintain
npm run agent:test
npm run agent:canary
```

Policy: `agent/maintenance-policy.json`. Generated reports under `qa/reports/` (gitignored).

## 9. What to read before changing code

**Normal task (read only these):**

1. `AGENTS.md` (this file)
2. `docs/CURRENT_STATE.md`
3. Relevant module documentation (e.g. `docs/email-outreach/README.md`)
4. `package.json`
5. Affected source and tests

**Optional historical context:** `docs/ai-context/*` — planning artifacts; verify claims against code. Do not treat as canonical.

**Repository hygiene:** `docs/DOCUMENT_STATUS.md`, `docs/engineering/repository-cleanup-roadmap.md`.

## 10. Definition of done

- Matches product direction and `docs/CURRENT_STATE.md` scope.
- Tenant isolation preserved.
- UI strings localization-ready.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` pass.
- New logic has tests where practical.
- No secrets or private data committed.
- Documentation updated when assumptions change.
