# Image Generation Provider Architecture

Date: 2026-07-01

## Current State

Marketing Studio includes a provider-neutral image generation interface and one deterministic local mock provider.

Implemented file:

- `src/features/marketing/providers.ts`

Current provider:

- `MockImageGenerationProvider`
- Generates an SVG blob locally.
- Supports deterministic preview generation and transformation metadata.
- Does not call paid image APIs.
- Does not upload files to external providers.

## Provider Contract

Image providers must implement:

- `validateConfiguration()`
- `generateImage(request)`
- `transformImage(request)`

Requests include product linkage, source asset references, transformation type, aspect ratio, output MIME type, prompt, and locale.

Results include provider id, model, blob, dimensions, MIME type, prompt, output asset type, and warnings.

## Safety Rules

- Do not send private customer files or product data to an external provider unless an explicit tenant configuration and consent path exists.
- Do not store provider credentials in client code.
- Do not treat a generated image as approved automatically.
- Store generated output as local assets plus marketing metadata.
- Keep live provider adapters server-side when added.

## Future Provider Work

Before adding a live provider:

- Add server-side adapter code.
- Add environment placeholders only to `.env.example`.
- Add provider configuration validation.
- Add test accounts or dry-run mode.
- Add cost/billing safeguards.
- Add tenant-level provider enablement.
- Add audit events for generated assets.
