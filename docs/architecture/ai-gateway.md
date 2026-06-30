# ForgeOS AI Gateway

Date: 2026-06-30

## Purpose

The AI Gateway is the shared server-side boundary for AI generation in ForgeOS. It keeps provider credentials, model routing, retry behavior, and fallback behavior out of feature UI code.

## Current Capability

The first capability wired through the gateway is Outreach email generation for LeadOps:

- capability: `src/lib/ai/capabilities/outreach-email.ts`
- schema: `src/lib/ai/capabilities/outreach-email-schema.ts`
- route consumer: `src/app/api/leadops/generate/route.ts`
- UI consumer: `src/components/leadops-detail-workspace.tsx`

The structured output contract is:

- `subject`
- `body`
- `contextUsed`
- provider metadata: `provider`, `model`, `fallbackUsed`, `warnings`

## Provider Registry

Provider registration lives in `src/lib/ai/registry.ts`.

Implemented adapters:

- `abacus`: Abacus.AI Python bridge adapter.
- `deterministic`: local deterministic fallback adapter.
- `openai`, `deepseek`, `xai`, `mistral`, `groq`, `openrouter`, `together`, `lmstudio`, `vllm`: OpenAI-compatible HTTP adapter.
- `ollama`: local Ollama adapter.

Placeholders:

- `anthropic`
- `google`

These are present for configuration compatibility but need native adapters before production live use.

## Configuration

Global routing:

```text
AI_DEFAULT_PROVIDER=abacus
AI_FALLBACK_PROVIDER=deterministic
AI_REQUEST_TIMEOUT_MS=45000
AI_MAX_RETRIES=2
```

Outreach capability:

```text
AI_OUTREACH_PROVIDER=abacus
AI_OUTREACH_PROFILE=outreach-fast
AI_OUTREACH_LANGUAGE=pt-PT
AI_OUTREACH_TONE=professional
AI_OUTREACH_SPEED=fast
AI_OUTREACH_REASONING=low
AI_OUTREACH_TEMPERATURE=0.25
AI_OUTREACH_TOP_P=0.90
AI_OUTREACH_MAX_TOKENS=700
```

Provider-specific values use the provider prefix, for example:

```text
ABACUS_API_KEY=replace-with-abacus-key
ABACUS_MODEL=OPENAI_GPT5_4_MINI
ABACUS_TIMEOUT_MS=
ABACUS_TEMPERATURE_OVERRIDE=
ABACUS_MAX_TOKENS_OVERRIDE=
```

Blank optional values are treated as unset.

## Fallback Policy

The gateway only falls back automatically when:

- `AI_FALLBACK_PROVIDER=deterministic`
- the selected live provider fails configuration, runtime, validation, timeout, or retry checks

The gateway does not silently cascade from one paid provider to another. If `AI_FALLBACK_PROVIDER` is set to a non-deterministic provider, the original error is surfaced.

## Privacy Rules

- Provider keys stay server-side.
- Browser code receives provider metadata only, never credentials.
- The diagnostic scripts load `.env.local` for local checks but do not print secret values.
- Synthetic `.invalid` emails and example companies are used for tests and diagnostics.
