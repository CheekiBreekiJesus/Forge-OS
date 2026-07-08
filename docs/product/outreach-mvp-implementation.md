# Outreach MVP Implementation Log

Date: 2026-06-30

## Final MVP Scope

This increment keeps the existing internal `leadops` feature name and `/leadops` routes for compatibility, while renaming the visible module to:

- Portuguese: `Contactos Comerciais`
- English: `Outreach`

The MVP supports a local and testable outreach workflow:

1. Open the Outreach lead list.
2. Preview CSV lead import quality metrics.
3. Open a tenant-scoped lead workspace.
4. Review stored company context.
5. Select products, with personalized plastic cups as the primary recommendation.
6. Generate a European Portuguese outreach email through a server route.
7. Edit subject and body.
8. Approve the message.
9. Assign a campaign.
10. Queue the message.
11. Simulate sending by default, or submit through a server-side Smartlead adapter when configured.
12. Preserve the local demo draft state across reloads using browser local storage.

## Root Cause Of Reported Generation Failure

The previous workspace generated email entirely inside the client component. The source logic was valid, but the UI had no loading state, no visible failure state for generation, and no server boundary to separate provider concerns from presentation. Cursor QA also reported that its embedded browser did not reliably propagate the click into React's event system.

The fix uses a form submit handler and a server API route at `/api/leadops/generate`. The button now has an explicit loading state, displays success/failure feedback, and writes the generated subject/body into controlled fields.

## Architecture

Domain logic remains in `src/features/leadops/`.

Boundaries:

- `providers.ts`: LeadOps adapter for AI Gateway generation, deterministic fallback metadata, simulation delivery, Smartlead adapter.
- `src/lib/ai/`: shared provider registry, provider config, retry/fallback policy, and structured generation capability.
- `import.ts`: CSV parsing, field alias mapping, validation, and duplicate detection.
- `/api/leadops/generate`: server-side generation endpoint.
- `/api/leadops/send`: server-side delivery endpoint.

The UI consumes these boundaries and does not read provider credentials.

## Persistence Strategy

This increment does not introduce a Supabase JavaScript dependency. The running app remains fixture-first when Supabase is not configured. To make the demo workflow durable across reloads, the lead workspace saves draft workflow state to local storage using a tenant-and-lead scoped key.

Supabase schema direction already exists in `supabase/migrations/202606300001_leadops_outreach_schema.sql`. A future persistence increment should connect repository interfaces to Supabase Auth tenant resolution and RLS-protected queries.

## Provider Behavior

Generation:

- Deterministic generation is always available.
- The server routes live generation through the shared AI Gateway.
- Abacus.AI is the default configured Outreach provider.
- Invalid, unconfigured, or failed provider responses fall back to deterministic generation only when deterministic fallback is enabled.
- The gateway does not silently cascade from one paid provider to another.
- API keys are never sent to the browser.

Delivery:

- `OUTREACH_DELIVERY_PROVIDER=simulation` is the default and requires no credentials.
- `OUTREACH_DELIVERY_PROVIDER=smartlead` requires Smartlead environment variables.
- Smartlead delivery stays server-side and reports configuration/provider errors without marking the message as sent.

## Validation Rules

Queueing is blocked when:

- the lead has no valid email;
- the lead is unsubscribed;
- the lead has bounced;
- there is no campaign;
- no generated message exists;
- the message is not approved;
- the message was already sent.

Editing a message clears approval and requires reapproval.

## Import Workflow

CSV import currently previews quality metrics only. It maps common English and Portuguese field names for company, contact, email, phone, website, Facebook URL, region, industry, source database, notes, and language.

Rows are classified as valid, review, or invalid. Duplicate emails are flagged for manual review. Rows are not silently discarded or persisted in this increment.

## Environment Variables

Supported placeholders are documented in `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AI_DEFAULT_PROVIDER`
- `AI_FALLBACK_PROVIDER`
- `AI_OUTREACH_PROVIDER`
- `ABACUS_API_KEY`
- `ABACUS_MODEL`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OUTREACH_DELIVERY_PROVIDER`
- `SMARTLEAD_API_KEY`
- `SMARTLEAD_API_BASE_URL`
- `SMARTLEAD_DEFAULT_CAMPAIGN_ID`

## Known Limitations

- Supabase runtime repositories are not wired yet.
- Smartlead live delivery requires local credentials.
- Anthropic and Google provider entries are placeholders until native adapters are implemented.
- CSV import previews records but does not persist them.
- Abacus uses a Python subprocess bridge; review before serverless deployment.

## Test Strategy

Added or extended Vitest coverage for:

- deterministic and fallback generation;
- provider simulation and missing Smartlead configuration;
- queue guards and duplicate-send prevention;
- product recommendation rules;
- CSV parsing, validation, duplicate detection, and quoted fields.

Playwright E2E coverage was added for the core Outreach workflow with mocked generation and deterministic delivery.

## Validation Results

Executed on 2026-06-30 after Abacus live verification:

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run validate
npm run ai:models -- --provider abacus
npm run ai:doctor -- --provider abacus
npm run ai:doctor -- --provider abacus --live
```

Live verification summary:

- Python: `.venv\Scripts\python.exe` (3.10.11)
- Abacus SDK: `1.4.102`
- Models discovered: `87`
- Selected model: `OPENAI_GPT5_4_MINI`
- Live doctor: direct Abacus success, no fallback
- Live outreach generation: direct Abacus success, European Portuguese output

Manual browser verification performed on:

- `/pt-PT/leadops`
- `/pt-PT/leadops/leadops_001`
- `/en/leadops/leadops_001`

## Setup And Troubleshooting

Local demo:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000/pt-PT/leadops
http://localhost:3000/pt-PT/leadops/leadops_001
```

Validation:

```bash
npm run validate
```

Generation failures:

- Confirm the route `/api/leadops/generate` returns `200`.
- If Abacus credentials are absent, deterministic generation should still work.
- If live provider output fails validation, the UI should show deterministic fallback mode when deterministic fallback is enabled.

Delivery failures:

- Keep `OUTREACH_DELIVERY_PROVIDER=simulation` for local demos.
- Use Smartlead mode only after adding valid provider credentials to `.env.local`.
- Provider errors must not mark a message as sent.
