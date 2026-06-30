# AI Provider Audit

Date: 2026-06-30

## Scope

This audit covers direct AI-provider usage in the ForgeOS repository before the shared AI Gateway migration.

## Confirmed AI Call Sites

- `src/features/leadops/providers.ts`
  - Previous role: direct Outreach generation boundary, including provider-specific OpenAI environment variables and HTTP calls.
  - Current role: LeadOps adapter that delegates generation to the shared Outreach AI capability.
- `src/app/api/leadops/generate/route.ts`
  - Role: server route for Outreach email generation.
  - Current behavior: calls `generateOutreachEmail`, which now uses the AI Gateway.
- `src/components/leadops-detail-workspace.tsx`
  - Role: browser UI for requesting generation and displaying provider metadata.
  - Current behavior: never reads provider credentials.

## Confirmed Non-Call-Site Mentions

- `README.md` and `docs/product/outreach-mvp-implementation.md` described the earlier OpenAI-specific implementation.
- `scripts/agent-orchestrator/*` contains secret-redaction examples and tests that mention `OPENAI_API_KEY`; these are not AI provider call sites.

## Migration Result

- Direct Outreach generation no longer calls an OpenAI endpoint from feature code.
- Provider selection, model selection, request timeouts, retries, and deterministic fallback are centralized under `src/lib/ai/`.
- Abacus.AI is the default configured provider for Outreach.
- Deterministic generation remains available for local demos, tests, and provider failure fallback.

## Remaining Limitations

- Anthropic and Google are listed in the registry but do not yet use native provider APIs. They are placeholders until provider-specific adapters are implemented.
- OpenAI-compatible providers use chat-completions style endpoints and may require provider-specific adjustments before live use.
- Live Abacus validation requires a local `.env.local` key and the Python `abacusai` package; secrets must remain uncommitted.
