# Outreach AI Generation

Date: 2026-06-30

## Current Behavior

Outreach generation runs through `/api/leadops/generate` and the shared AI Gateway.

The browser submits lead, campaign, selected product keys, tone, and stored company context. The server returns:

- generated subject and body
- selected provider and model metadata
- fallback status
- warnings
- context sources used

The UI remains editable and approval-based. Provider output does not queue or send email automatically.

When fallback occurs, the UI shows:

> Não foi possível utilizar o fornecedor de IA configurado. Foi utilizada a geração local.

Deterministic fallback is not presented as live AI output.

## Default Provider

Abacus.AI is the default configured live provider for Outreach:

```text
AI_OUTREACH_PROVIDER=abacus
ABACUS_MODEL=OPENAI_GPT5_4_MINI
```

If Abacus is not configured or fails validation, deterministic PT-PT generation is used when deterministic fallback is enabled.

## Live Verification (2026-06-30)

Verified on Windows with:

- Python command: `.venv\Scripts\python.exe` (Python 3.10.11)
- Abacus SDK: `1.4.102`
- Models discovered: `87`
- Selected model: `OPENAI_GPT5_4_MINI`
- Non-live doctor: passed
- Live doctor: passed (`fallbackUsed=false`, latency ~5.6s)
- Live outreach generation: passed (`provider=abacus`, European Portuguese output, plastic cups primary offer)

Implementation notes:

- Abacus SDK model discovery uses enum `.value` extraction.
- The Python bridge omits `json_response_schema` because the current Abacus SDK rejects the bundled JSON schema format; structured output is validated in TypeScript instead.
- `signal.alarm` is skipped on Windows.

## Safety Requirements

- Do not claim a website was reviewed unless stored website context is present.
- Do not invent pricing, production capacity, discounts, delivery dates, certifications, customers, or supplier facts.
- Keep generated messages concise and low pressure.
- Keep final send approval manual.
- Use synthetic data in tests and diagnostics.

## E2E Coverage

Playwright covers the core Outreach workflow without live Abacus calls:

```bash
npm run test:e2e
npm run test:e2e:ui
```

E2E runs with `AI_OUTREACH_PROVIDER=deterministic` and mocks `/api/leadops/generate` where needed.

## Future Work

- Add provider-specific native adapters for non-OpenAI-compatible providers.
- Persist generated message drafts server-side after tenant auth and database repositories are wired.
- Add provider cost and latency monitoring.
- Add human-review audit events once the persistent workflow exists.
